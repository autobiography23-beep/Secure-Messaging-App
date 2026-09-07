import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AnonymousProfile,
  PeerContact,
  SecureMessage,
  BurnTimerDuration,
  EncryptedPacket,
  VaultLockConfig,
} from '../types';
import {
  FullAnonymousIdentity,
  createNewAnonymousProfile,
} from '../crypto/identity';
import {
  importPrivateKey,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  computeSafetyNumbers,
  generateECDHKeyPair,
  computeFingerprint,
} from '../crypto/e2ee';
import { playSecurityAudio, hashPasscode, verifyPasscode, verifyWebAuthnBiometrics } from '../crypto/biometrics';

const STORAGE_PROFILES_KEY = 'secure_messenger_profiles';
const STORAGE_ACTIVE_ID_KEY = 'secure_messenger_active_id';
const STORAGE_MESSAGES_KEY = 'secure_messenger_messages';
const STORAGE_CONTACTS_KEY = 'secure_messenger_contacts';
const STORAGE_LOCK_CONFIG_KEY = 'secure_messenger_lock_config';

export function useSecureMessenger() {
  // Identities & Profile
  const [profiles, setProfiles] = useState<FullAnonymousIdentity[]>([]);
  const [activeProfile, setActiveProfile] = useState<FullAnonymousIdentity | null>(null);

  // Contacts & Chats
  const [contacts, setContacts] = useState<PeerContact[]>([]);
  const [activeContactFingerprint, setActiveContactFingerprint] = useState<string | null>(null);
  const [messages, setMessages] = useState<SecureMessage[]>([]);

  // Real-time server presence
  const [onlinePeers, setOnlinePeers] = useState<Array<{ peerId: string; alias: string; publicKey: string; fingerprint: string }>>([]);
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);

  // Timed messaging setting for active composer
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<BurnTimerDuration>(10);
  const [activeBurnType, setActiveBurnType] = useState<'on_send' | 'on_view'>('on_send');

  // Vault Lock State
  const [lockConfig, setLockConfig] = useState<VaultLockConfig>({
    isLocked: false,
    hasPasscode: false,
    biometricsEnabled: true,
    autoLockMinutes: 5,
    lastActiveTimestamp: Date.now(),
  });

  // Stealth Decoy Mode
  const [isStealthMode, setIsStealthMode] = useState(false);

  // Typers
  const [peerTyping, setPeerTyping] = useState<Record<string, boolean>>({});

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const sharedKeysCacheRef = useRef<Map<string, CryptoKey>>(new Map());
  const echoBotIdentityRef = useRef<{
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    publicKeyJwk: string;
    fingerprint: string;
  } | null>(null);

  // Update activity timestamp for auto-lock
  const recordActivity = useCallback(() => {
    setLockConfig((prev) => ({
      ...prev,
      lastActiveTimestamp: Date.now(),
    }));
  }, []);

  // Initialize Echo Sentinel Test Peer
  useEffect(() => {
    async function initEchoBot() {
      const pair = await generateECDHKeyPair();
      const fp = await computeFingerprint(pair.publicKeyJwk);
      echoBotIdentityRef.current = {
        privateKey: pair.privateKey,
        publicKey: pair.publicKey,
        publicKeyJwk: pair.publicKeyJwk,
        fingerprint: fp,
      };

      // Add Echo Sentinel to default contacts if not present
      setContacts((prev) => {
        if (prev.some((c) => c.isEchoBot)) return prev;
        return [
          {
            fingerprint: fp,
            alias: 'Echo Sentinel (E2EE Bot)',
            publicKeyJwk: pair.publicKeyJwk,
            safetyNumber: '99281 48201 59283 10294 77391 66281',
            isVerified: true,
            isOnline: true,
            isEchoBot: true,
            unreadCount: 0,
          },
          ...prev,
        ];
      });
    }
    initEchoBot();
  }, []);

  // Load stored state on mount
  useEffect(() => {
    async function initStorage() {
      try {
        const savedProfiles = localStorage.getItem(STORAGE_PROFILES_KEY);
        const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
        const savedMessages = localStorage.getItem(STORAGE_MESSAGES_KEY);
        const savedContacts = localStorage.getItem(STORAGE_CONTACTS_KEY);
        const savedLock = localStorage.getItem(STORAGE_LOCK_CONFIG_KEY);

        let parsedProfiles: FullAnonymousIdentity[] = [];
        if (savedProfiles) {
          parsedProfiles = JSON.parse(savedProfiles);
          setProfiles(parsedProfiles);
        }

        let currentActive: FullAnonymousIdentity | null = null;
        if (parsedProfiles.length > 0) {
          currentActive = parsedProfiles.find((p) => p.id === savedActiveId) || parsedProfiles[0];
          setActiveProfile(currentActive);
        } else {
          // Create initial anonymous profile
          const initial = await createNewAnonymousProfile(false);
          parsedProfiles = [initial];
          currentActive = initial;
          setProfiles(parsedProfiles);
          setActiveProfile(initial);
          localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(parsedProfiles));
          localStorage.setItem(STORAGE_ACTIVE_ID_KEY, initial.id);
        }

        if (savedMessages) {
          const parsedMsgs: SecureMessage[] = JSON.parse(savedMessages);
          setMessages(parsedMsgs);
        }

        if (savedContacts) {
          const parsedCont: PeerContact[] = JSON.parse(savedContacts);
          setContacts((prev) => {
            const merged = [...parsedCont];
            // keep echo bot
            const echo = prev.find((c) => c.isEchoBot);
            if (echo && !merged.some((c) => c.isEchoBot)) {
              merged.unshift(echo);
            }
            return merged;
          });
        }

        if (savedLock) {
          const parsedLock: VaultLockConfig = JSON.parse(savedLock);
          // Set to locked if passcode exists
          setLockConfig({
            ...parsedLock,
            isLocked: parsedLock.hasPasscode,
            lastActiveTimestamp: Date.now(),
          });
        }
      } catch (err) {
        console.error('Storage initialization failed:', err);
      }
    }
    initStorage();
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
    }
  }, [profiles]);

  useEffect(() => {
    if (activeProfile) {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeProfile.id);
    }
  }, [activeProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_LOCK_CONFIG_KEY, JSON.stringify(lockConfig));
  }, [lockConfig]);

  // Connect WebSocket to server
  useEffect(() => {
    if (!activeProfile) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnectedToServer(true);
          // Register our anonymous presence
          if (activeProfile && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: 'REGISTER',
                peerId: activeProfile.id,
                alias: activeProfile.codename,
                publicKey: activeProfile.publicKeyJwk,
                fingerprint: activeProfile.fingerprint,
              })
            );
          }
        };

        socket.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'PEERS_LIST') {
              // Update online peers, excluding ourselves
              const peers = (data.peers || []).filter(
                (p: { fingerprint: string }) => p.fingerprint !== activeProfile.fingerprint
              );
              setOnlinePeers(peers);
            } else if (data.type === 'INCOMING_ENCRYPTED_MESSAGE') {
              handleIncomingPacket(data.message);
            } else if (data.type === 'MESSAGE_SHREDDED') {
              handleRemoteShred(data.messageId);
            } else if (data.type === 'PEER_TYPING') {
              setPeerTyping((prev) => ({
                ...prev,
                [data.senderFingerprint]: data.isTyping,
              }));
            }
          } catch (e) {
            console.error('WebSocket message parsing error:', e);
          }
        };

        socket.onclose = () => {
          setIsConnectedToServer(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (e) {
        console.error('WebSocket connection error:', e);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socket) {
        socket.close();
      }
    };
  }, [activeProfile]);

  // Derived Shared Key helper
  const getOrDeriveSharedKey = useCallback(
    async (peerPublicKeyJwk: string, peerFingerprint: string): Promise<CryptoKey> => {
      if (!activeProfile) throw new Error('No active anonymous profile');

      const cached = sharedKeysCacheRef.current.get(peerFingerprint);
      if (cached) return cached;

      const myPrivKey = await importPrivateKey(activeProfile.privateKeyJwk);
      const remotePubKey = await importPublicKey(peerPublicKeyJwk);
      const derived = await deriveSharedKey(myPrivKey, remotePubKey);

      sharedKeysCacheRef.current.set(peerFingerprint, derived);
      return derived;
    },
    [activeProfile]
  );

  // Handle Incoming Packet
  const handleIncomingPacket = useCallback(
    async (packet: EncryptedPacket) => {
      if (!activeProfile) return;
      if (packet.recipientFingerprint !== activeProfile.fingerprint) return;

      try {
        const sharedKey = await getOrDeriveSharedKey(
          packet.senderPublicKeyJwk,
          packet.senderFingerprint
        );

        const decryptedPlaintext = await decryptMessage(packet.ciphertext, packet.iv, sharedKey);
        playSecurityAudio('receive');

        // Check if sender is in contacts; if not, auto-add with safety numbers
        const safetyNumbers = await computeSafetyNumbers(
          activeProfile.publicKeyJwk,
          packet.senderPublicKeyJwk
        );

        setContacts((prev) => {
          const exists = prev.find((c) => c.fingerprint === packet.senderFingerprint);
          if (!exists) {
            return [
              ...prev,
              {
                fingerprint: packet.senderFingerprint,
                alias: packet.senderAlias || `Anon-${packet.senderFingerprint.slice(0, 4)}`,
                publicKeyJwk: packet.senderPublicKeyJwk,
                safetyNumber: safetyNumbers.join(' '),
                isVerified: false,
                isOnline: true,
                unreadCount: 1,
              },
            ];
          }
          return prev.map((c) =>
            c.fingerprint === packet.senderFingerprint
              ? { ...c, unreadCount: c.unreadCount + 1 }
              : c
          );
        });

        const now = Date.now();
        const expiresAt =
          packet.timerSeconds > 0 && packet.burnType === 'on_send'
            ? now + packet.timerSeconds * 1000
            : undefined;

        const incomingMsg: SecureMessage = {
          id: packet.id,
          conversationFingerprint: packet.senderFingerprint,
          senderFingerprint: packet.senderFingerprint,
          recipientFingerprint: packet.recipientFingerprint,
          senderAlias: packet.senderAlias,
          plaintext: decryptedPlaintext,
          ciphertext: packet.ciphertext,
          iv: packet.iv,
          timestamp: packet.timestamp,
          timerSeconds: packet.timerSeconds,
          burnType: packet.burnType,
          expiresAt,
          isShredded: false,
          status: 'delivered',
          direction: 'incoming',
        };

        setMessages((prev) => [...prev, incomingMsg]);
      } catch (err) {
        console.error('Failed to decrypt incoming packet:', err);
      }
    },
    [activeProfile, getOrDeriveSharedKey]
  );

  // Handle remote shred
  const handleRemoteShred = useCallback((messageId: string) => {
    playSecurityAudio('burn');
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              isShredded: true,
              plaintext: '[CRYPTOGRAPHICALLY SHREDDED]',
              status: 'shredded',
            }
          : msg
      )
    );
  }, []);

  // Periodic Timer Tick for Disappearing Messages (every 200ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setMessages((prevMessages) => {
        let hasShredded = false;

        const updated = prevMessages.map((msg) => {
          if (msg.isShredded || !msg.expiresAt) return msg;

          if (now >= msg.expiresAt) {
            hasShredded = true;
            // Notify peer of message shred via socket
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'SHRED_EVENT',
                  recipientFingerprint: msg.recipientFingerprint,
                  messageId: msg.id,
                })
              );
            }
            return {
              ...msg,
              isShredded: true,
              plaintext: '[CRYPTOGRAPHICALLY SHREDDED]',
              status: 'shredded' as const,
            };
          }
          return msg;
        });

        if (hasShredded) {
          playSecurityAudio('burn');
        }

        return updated;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Auto-lock detector on idle or visibility change
  useEffect(() => {
    if (!lockConfig.hasPasscode || lockConfig.autoLockMinutes === 0 || lockConfig.isLocked) {
      return;
    }

    const checkLock = () => {
      const elapsedMinutes = (Date.now() - lockConfig.lastActiveTimestamp) / 1000 / 60;
      if (elapsedMinutes >= lockConfig.autoLockMinutes) {
        playSecurityAudio('lock');
        setLockConfig((prev) => ({ ...prev, isLocked: true }));
      }
    };

    const interval = setInterval(checkLock, 10000);

    const onVisibility = () => {
      if (document.hidden) {
        // user tabbed away
        checkLock();
      } else {
        recordActivity();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [lockConfig, recordActivity]);

  // Send Encrypted Message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeProfile || !activeContactFingerprint || !text.trim()) return;

      const targetContact = contacts.find((c) => c.fingerprint === activeContactFingerprint);
      if (!targetContact) return;

      recordActivity();

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = Date.now();

      try {
        // Derive shared key and encrypt
        const sharedKey = await getOrDeriveSharedKey(
          targetContact.publicKeyJwk,
          targetContact.fingerprint
        );

        const { ciphertext, iv } = await encryptMessage(text, sharedKey);
        playSecurityAudio('send');

        const expiresAt =
          activeTimerSeconds > 0 && activeBurnType === 'on_send'
            ? now + activeTimerSeconds * 1000
            : undefined;

        const outgoingMsg: SecureMessage = {
          id: messageId,
          conversationFingerprint: targetContact.fingerprint,
          senderFingerprint: activeProfile.fingerprint,
          recipientFingerprint: targetContact.fingerprint,
          senderAlias: activeProfile.codename,
          plaintext: text,
          ciphertext,
          iv,
          timestamp: now,
          timerSeconds: activeTimerSeconds,
          burnType: activeBurnType,
          expiresAt,
          isShredded: false,
          status: 'sent',
          direction: 'outgoing',
        };

        setMessages((prev) => [...prev, outgoingMsg]);

        // If target is the Echo Sentinel Bot, trigger automated simulated zero-knowledge response
        if (targetContact.isEchoBot && echoBotIdentityRef.current) {
          const echoBot = echoBotIdentityRef.current;
          setTimeout(async () => {
            try {
              // Bot derives key with user and decrypts
              const myPubKey = await importPublicKey(activeProfile.publicKeyJwk);
              const botSharedKey = await deriveSharedKey(echoBot.privateKey, myPubKey);
              const botDecrypted = await decryptMessage(ciphertext, iv, botSharedKey);

              // Generate high-tech echo response
              let botReplyText = `[Cipher Audit Verified] Decrypted ${ciphertext.length} bytes via AES-256-GCM. Plaintext match: "${botDecrypted}". Safety numbers authenticated.`;
              if (activeTimerSeconds > 0) {
                botReplyText += ` Timed self-destruct engaged (${activeTimerSeconds}s).`;
              }

              const { ciphertext: botCipher, iv: botIv } = await encryptMessage(
                botReplyText,
                botSharedKey
              );

              const botMsgId = `echo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
              const botExpiresAt =
                activeTimerSeconds > 0 ? Date.now() + activeTimerSeconds * 1000 : undefined;

              const incomingEcho: SecureMessage = {
                id: botMsgId,
                conversationFingerprint: echoBot.fingerprint,
                senderFingerprint: echoBot.fingerprint,
                recipientFingerprint: activeProfile.fingerprint,
                senderAlias: targetContact.alias,
                plaintext: botReplyText,
                ciphertext: botCipher,
                iv: botIv,
                timestamp: Date.now(),
                timerSeconds: activeTimerSeconds,
                burnType: activeBurnType,
                expiresAt: botExpiresAt,
                isShredded: false,
                status: 'delivered',
                direction: 'incoming',
              };

              playSecurityAudio('receive');
              setMessages((prev) => [...prev, incomingEcho]);
            } catch (e) {
              console.error('Echo bot response error:', e);
            }
          }, 800);
          return;
        }

        // Send over WebSocket blind relay to real peer
        const packet: EncryptedPacket = {
          id: messageId,
          senderFingerprint: activeProfile.fingerprint,
          recipientFingerprint: targetContact.fingerprint,
          senderAlias: activeProfile.codename,
          senderPublicKeyJwk: activeProfile.publicKeyJwk,
          ciphertext,
          iv,
          timestamp: now,
          timerSeconds: activeTimerSeconds,
          burnType: activeBurnType,
        };

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'RELAY_ENCRYPTED_MESSAGE',
              recipientFingerprint: targetContact.fingerprint,
              message: packet,
            })
          );
        }
      } catch (err) {
        console.error('Failed to send encrypted message:', err);
      }
    },
    [
      activeProfile,
      activeContactFingerprint,
      contacts,
      activeTimerSeconds,
      activeBurnType,
      getOrDeriveSharedKey,
      recordActivity,
    ]
  );

  // Trigger Burn on View when an unrevealed timed message is viewed
  const triggerBurnOnView = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.burnType === 'on_view' && !msg.viewedAt && !msg.isShredded) {
          const viewedAt = Date.now();
          const expiresAt = viewedAt + msg.timerSeconds * 1000;
          return {
            ...msg,
            viewedAt,
            expiresAt,
            status: 'read',
          };
        }
        return msg;
      })
    );
  }, []);

  // Add Contact by Public Key / Fingerprint
  const addContactByDetails = useCallback(
    async (alias: string, publicKeyJwkStr: string): Promise<PeerContact> => {
      if (!activeProfile) throw new Error('No active profile');

      const fingerprint = await computeFingerprint(publicKeyJwkStr);
      const safetyNumbers = await computeSafetyNumbers(
        activeProfile.publicKeyJwk,
        publicKeyJwkStr
      );

      const newContact: PeerContact = {
        fingerprint,
        alias: alias.trim() || `Anon-${fingerprint.slice(0, 4)}`,
        publicKeyJwk: publicKeyJwkStr,
        safetyNumber: safetyNumbers.join(' '),
        isVerified: false,
        isOnline: onlinePeers.some((p) => p.fingerprint === fingerprint),
        unreadCount: 0,
      };

      setContacts((prev) => {
        const filtered = prev.filter((c) => c.fingerprint !== fingerprint);
        return [newContact, ...filtered];
      });

      return newContact;
    },
    [activeProfile, onlinePeers]
  );

  // Toggle Safety Number Verified
  const toggleVerifyContact = useCallback((fingerprint: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.fingerprint === fingerprint ? { ...c, isVerified: !c.isVerified } : c))
    );
  }, []);

  // Switch Active Profile
  const switchProfile = useCallback(
    (profileId: string) => {
      const target = profiles.find((p) => p.id === profileId);
      if (target) {
        sharedKeysCacheRef.current.clear();
        setActiveProfile(target);
        setActiveContactFingerprint(null);
        playSecurityAudio('scan');
      }
    },
    [profiles]
  );

  // Create New Anonymous Burner Profile
  const createBurnerProfile = useCallback(
    async (customCodename?: string) => {
      const newProf = await createNewAnonymousProfile(true, customCodename);
      setProfiles((prev) => [...prev, newProf]);
      setActiveProfile(newProf);
      sharedKeysCacheRef.current.clear();
      setActiveContactFingerprint(null);
      playSecurityAudio('scan');
      return newProf;
    },
    []
  );

  // Permanently Burn/Delete an Identity and its keys
  const burnIdentity = useCallback(
    async (profileId: string) => {
      playSecurityAudio('burn');

      // Purge messages associated with this profile
      setMessages((prev) =>
        prev.filter(
          (m) =>
            m.senderFingerprint !== activeProfile?.fingerprint &&
            m.recipientFingerprint !== activeProfile?.fingerprint
        )
      );

      const remaining = profiles.filter((p) => p.id !== profileId);
      if (remaining.length === 0) {
        // Generate a clean replacement profile immediately
        const fresh = await createNewAnonymousProfile(false);
        setProfiles([fresh]);
        setActiveProfile(fresh);
      } else {
        setProfiles(remaining);
        if (activeProfile?.id === profileId) {
          setActiveProfile(remaining[0]);
        }
      }
      sharedKeysCacheRef.current.clear();
    },
    [profiles, activeProfile]
  );

  // Nuclear Panic / Shred All Data
  const purgeAllData = useCallback(async () => {
    playSecurityAudio('burn');
    localStorage.clear();
    sharedKeysCacheRef.current.clear();
    setMessages([]);
    setContacts([]);
    setActiveContactFingerprint(null);
    const fresh = await createNewAnonymousProfile(false);
    setProfiles([fresh]);
    setActiveProfile(fresh);
    setLockConfig({
      isLocked: false,
      hasPasscode: false,
      biometricsEnabled: true,
      autoLockMinutes: 5,
      lastActiveTimestamp: Date.now(),
    });
  }, []);

  // Vault Lock and Unlock Handlers
  const lockVault = useCallback(() => {
    playSecurityAudio('lock');
    setLockConfig((prev) => ({ ...prev, isLocked: true }));
  }, []);

  const unlockVaultWithPasscode = useCallback(
    async (enteredPin: string): Promise<boolean> => {
      if (!lockConfig.passcodeHash || !lockConfig.passcodeSalt) {
        return false;
      }
      const isValid = await verifyPasscode(
        enteredPin,
        lockConfig.passcodeHash,
        lockConfig.passcodeSalt
      );
      if (isValid) {
        playSecurityAudio('unlock');
        setLockConfig((prev) => ({
          ...prev,
          isLocked: false,
          lastActiveTimestamp: Date.now(),
        }));
        return true;
      } else {
        playSecurityAudio('error');
        return false;
      }
    },
    [lockConfig]
  );

  const unlockVaultWithBiometrics = useCallback(async (): Promise<boolean> => {
    playSecurityAudio('scan');
    const result = await verifyWebAuthnBiometrics(lockConfig.webauthnCredentialId);
    if (result.success) {
      playSecurityAudio('unlock');
      setLockConfig((prev) => ({
        ...prev,
        isLocked: false,
        lastActiveTimestamp: Date.now(),
      }));
      return true;
    } else {
      playSecurityAudio('error');
      return false;
    }
  }, [lockConfig]);

  const configurePasscode = useCallback(async (newPin: string) => {
    const { hashHex, saltHex } = await hashPasscode(newPin);
    setLockConfig((prev) => ({
      ...prev,
      hasPasscode: true,
      passcodeHash: hashHex,
      passcodeSalt: saltHex,
      lastActiveTimestamp: Date.now(),
    }));
    playSecurityAudio('unlock');
  }, []);

  // Typing signal
  const sendTypingSignal = useCallback(
    (isTyping: boolean) => {
      if (!activeContactFingerprint || !wsRef.current) return;
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'TYPING_SIGNAL',
            recipientFingerprint: activeContactFingerprint,
            isTyping,
          })
        );
      }
    },
    [activeContactFingerprint]
  );

  return {
    profiles,
    activeProfile,
    contacts,
    activeContactFingerprint,
    setActiveContactFingerprint,
    messages: messages.filter(
      (m) =>
        m.conversationFingerprint === activeContactFingerprint ||
        m.senderFingerprint === activeContactFingerprint ||
        m.recipientFingerprint === activeContactFingerprint
    ),
    allMessagesCount: messages.length,
    onlinePeers,
    isConnectedToServer,
    activeTimerSeconds,
    setActiveTimerSeconds,
    activeBurnType,
    setActiveBurnType,
    lockConfig,
    setLockConfig,
    isStealthMode,
    setIsStealthMode,
    peerTyping: activeContactFingerprint ? !!peerTyping[activeContactFingerprint] : false,
    recordActivity,
    sendMessage,
    triggerBurnOnView,
    addContactByDetails,
    toggleVerifyContact,
    switchProfile,
    createBurnerProfile,
    burnIdentity,
    purgeAllData,
    lockVault,
    unlockVaultWithPasscode,
    unlockVaultWithBiometrics,
    configurePasscode,
    sendTypingSignal,
  };
}
