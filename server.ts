import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

interface ClientConnection {
  ws: WebSocket;
  peerId: string;
  alias: string;
  publicKey: string;
  fingerprint: string;
  lastSeen: number;
}

const PORT = 3000;
const app = express();
const server = http.createServer(app);

// JSON body parser for any API routes
app.use(express.json());

// In-memory blind relay connections (zero-knowledge: server holds NO private keys or plaintext)
const clients = new Map<WebSocket, ClientConnection>();

const wss = new WebSocketServer({ server, path: "/ws" });

function broadcastOnlinePeers() {
  const peerList = Array.from(clients.values()).map((c) => ({
    peerId: c.peerId,
    alias: c.alias,
    publicKey: c.publicKey,
    fingerprint: c.fingerprint,
    lastSeen: c.lastSeen,
  }));

  const payload = JSON.stringify({
    type: "PEERS_LIST",
    peers: peerList,
  });

  for (const client of clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (raw: string) => {
    try {
      const data = JSON.parse(raw.toString());

      switch (data.type) {
        case "REGISTER": {
          clients.set(ws, {
            ws,
            peerId: data.peerId,
            alias: data.alias,
            publicKey: data.publicKey,
            fingerprint: data.fingerprint,
            lastSeen: Date.now(),
          });
          broadcastOnlinePeers();
          break;
        }

        case "UPDATE_ALIAS": {
          const client = clients.get(ws);
          if (client) {
            client.alias = data.alias;
            client.fingerprint = data.fingerprint || client.fingerprint;
            broadcastOnlinePeers();
          }
          break;
        }

        case "RELAY_ENCRYPTED_MESSAGE": {
          // Zero-knowledge blind forwarding
          // The payload contains ONLY ciphertext, iv, senderFingerprint, recipientFingerprint, timerSecs, id, timestamp
          const { recipientFingerprint } = data;
          let delivered = false;

          for (const [clientWs, client] of clients.entries()) {
            if (
              client.fingerprint === recipientFingerprint &&
              clientWs.readyState === WebSocket.OPEN
            ) {
              clientWs.send(
                JSON.stringify({
                  type: "INCOMING_ENCRYPTED_MESSAGE",
                  message: data.message,
                })
              );
              delivered = true;
            }
          }

          // Acknowledge back to sender
          ws.send(
            JSON.stringify({
              type: "MESSAGE_STATUS",
              messageId: data.message.id,
              delivered,
            })
          );
          break;
        }

        case "SHRED_EVENT": {
          // Forward message shredding notification to peer
          const { recipientFingerprint, messageId } = data;
          for (const [clientWs, client] of clients.entries()) {
            if (
              client.fingerprint === recipientFingerprint &&
              clientWs.readyState === WebSocket.OPEN
            ) {
              clientWs.send(
                JSON.stringify({
                  type: "MESSAGE_SHREDDED",
                  messageId,
                })
              );
            }
          }
          break;
        }

        case "KEY_EXCHANGE_REQUEST": {
          // Forward an initial handshake / public key offer to a peer
          const { recipientFingerprint } = data;
          for (const [clientWs, client] of clients.entries()) {
            if (
              client.fingerprint === recipientFingerprint &&
              clientWs.readyState === WebSocket.OPEN
            ) {
              clientWs.send(
                JSON.stringify({
                  type: "KEY_EXCHANGE_OFFER",
                  offer: data.offer,
                })
              );
            }
          }
          break;
        }

        case "TYPING_SIGNAL": {
          const { recipientFingerprint, isTyping } = data;
          const sender = clients.get(ws);
          if (sender) {
            for (const [clientWs, client] of clients.entries()) {
              if (
                client.fingerprint === recipientFingerprint &&
                clientWs.readyState === WebSocket.OPEN
              ) {
                clientWs.send(
                  JSON.stringify({
                    type: "PEER_TYPING",
                    senderFingerprint: sender.fingerprint,
                    isTyping,
                  })
                );
              }
            }
          }
          break;
        }

        default:
          break;
      }
    } catch {
      // ignore malformed payloads
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    broadcastOnlinePeers();
  });
});

// Health check API
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", activeRelays: clients.size });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server with Blind Relay running on http://localhost:${PORT}`);
  });
}

startServer();
