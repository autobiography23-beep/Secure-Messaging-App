import React, { useState } from 'react';
import { SecureMessage } from '../types';
import { ShieldCheck, Copy, Check, X, Binary, Lock } from 'lucide-react';

interface CipherInspectorModalProps {
  message: SecureMessage | null;
  onClose: () => void;
}

export function CipherInspectorModal({ message, onClose }: CipherInspectorModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!message) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      id="cipher-inspector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="cipher-inspector-card"
        className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-[#E0E0E0] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#080808]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-base tracking-tight flex items-center gap-2 text-white">
                Cryptographic Inspector
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-emerald-300 font-mono">
                  AES-256-GCM
                </span>
              </h2>
              <p className="text-xs text-white/40">
                End-to-end cryptographic packet verification & audit
              </p>
            </div>
          </div>
          <button
            id="close-cipher-inspector-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Security Audit Badge */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium text-emerald-300">
                Zero-Knowledge Relay Guaranteed
              </div>
              <div className="text-xs text-white/50 mt-0.5 leading-relaxed">
                Plaintext was encrypted client-side using WebCrypto before network dispatch. Neither
                the server, ISP, nor intermediaries can decrypt this payload without the recipient's
                private ECDH key.
              </div>
            </div>
          </div>

          {/* Cipher Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#080808] border border-white/10">
              <span className="text-white/40 block mb-1">Key Exchange</span>
              <span className="font-mono text-white font-medium">ECDH (NIST P-256)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080808] border border-white/10">
              <span className="text-white/40 block mb-1">Cipher & Tag Length</span>
              <span className="font-mono text-white font-medium">AES-GCM (128-bit Tag)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080808] border border-white/10">
              <span className="text-white/40 block mb-1">Sender Fingerprint</span>
              <span className="font-mono text-indigo-300 font-medium">
                {message.senderFingerprint}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#080808] border border-white/10">
              <span className="text-white/40 block mb-1">Recipient Fingerprint</span>
              <span className="font-mono text-indigo-300 font-medium">
                {message.recipientFingerprint}
              </span>
            </div>
          </div>

          {/* Initialization Vector (IV) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-white/40" />
                96-bit Nonce / Initialization Vector (Base64)
              </span>
              <button
                id="copy-iv-btn"
                onClick={() => copyToClipboard(message.iv, 'iv')}
                className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedField === 'iv' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedField === 'iv' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-[#050505] border border-white/10 font-mono text-xs text-emerald-400 break-all select-all">
              {message.iv}
            </div>
          </div>

          {/* Raw Ciphertext Payload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-white/70">
                Raw Ciphertext Payload ({message.ciphertext.length} bytes)
              </span>
              <button
                id="copy-ciphertext-btn"
                onClick={() => copyToClipboard(message.ciphertext, 'cipher')}
                className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedField === 'cipher' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedField === 'cipher' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-3 rounded-lg bg-[#050505] border border-white/10 font-mono text-xs text-zinc-300 break-all select-all max-h-36 overflow-y-auto leading-relaxed">
              {message.ciphertext}
            </div>
          </div>

          {/* Decrypted Local Plaintext (Protected) */}
          <div className="pt-2 border-t border-white/5">
            <span className="text-xs font-medium text-white/70 block mb-1.5">
              Local Decrypted State (In-Memory Only)
            </span>
            <div className="p-3 rounded-lg bg-[#121212] border border-white/10 text-xs text-[#E0E0E0]">
              {message.isShredded ? (
                <span className="text-red-400 font-mono flex items-center gap-1.5">
                  [CRYPTOGRAPHICALLY SHREDDED & ZEROED]
                </span>
              ) : (
                message.plaintext
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-[#080808]/40 flex justify-end">
          <button
            id="done-cipher-inspector-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
