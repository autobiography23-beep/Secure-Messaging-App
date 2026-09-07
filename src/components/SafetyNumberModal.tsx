import React, { useState } from 'react';
import { PeerContact } from '../types';
import { ShieldCheck, ShieldAlert, Check, Copy, X, QrCode } from 'lucide-react';

interface SafetyNumberModalProps {
  contact: PeerContact | null;
  myCodename: string;
  onToggleVerify: (fingerprint: string) => void;
  onClose: () => void;
}

export function SafetyNumberModal({
  contact,
  myCodename,
  onToggleVerify,
  onClose,
}: SafetyNumberModalProps) {
  const [copied, setCopied] = useState(false);

  if (!contact) return null;

  const safetyNumberBlocks = contact.safetyNumber ? contact.safetyNumber.split(' ') : [];

  const copyFullCode = () => {
    navigator.clipboard.writeText(contact.safetyNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="safety-number-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="safety-number-card"
        className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-[#E0E0E0] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#080808]/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                contact.isVerified
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {contact.isVerified ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-medium text-base tracking-tight text-white">Verify Safety Numbers</h2>
              <p className="text-xs text-white/40">
                Between <span className="text-white font-medium">{myCodename}</span> and{' '}
                <span className="text-white font-medium">{contact.alias}</span>
              </p>
            </div>
          </div>
          <button
            id="close-safety-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm">
          <p className="text-xs text-white/40 leading-relaxed">
            Safety numbers protect your conversation against active eavesdropping and Man-in-the-Middle
            (MITM) attacks. Compare this 30-digit fingerprint with your peer over a trusted second channel or in person.
          </p>

          {/* Visual Matrix Pattern / Simulated QR */}
          <div className="flex justify-center p-4 bg-[#050505] rounded-xl border border-white/10">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-lg shadow-inner flex items-center justify-center">
                <QrCode className="w-24 h-24 text-black" />
              </div>
              <span className="text-[11px] font-mono text-white/40">
                Key Fingerprint: {contact.fingerprint}
              </span>
            </div>
          </div>

          {/* 6 Groups of 5 digits */}
          <div className="bg-[#080808] p-4 rounded-xl border border-white/10">
            <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2 text-center">
              Shared Cryptographic Verification Code
            </div>
            <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
              {safetyNumberBlocks.map((block, idx) => (
                <div
                  key={idx}
                  className="py-2 px-1 rounded-lg bg-[#101010] border border-white/10 text-sm font-semibold text-white tracking-wider"
                >
                  {block}
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-center">
              <button
                id="copy-safety-code-btn"
                onClick={copyFullCode}
                className="text-xs text-white/40 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Copied Full Code' : 'Copy Full 30-Digit Code'}
              </button>
            </div>
          </div>

          {/* Verification Status & Toggle */}
          <div className="p-4 rounded-xl bg-[#080808] border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Verification Status</div>
              <div className="text-[11px] text-white/40">
                {contact.isVerified
                  ? 'Key authenticated. Protected against MITM.'
                  : 'Unverified key. Tap button to mark verified.'}
              </div>
            </div>

            <button
              id="toggle-verify-contact-btn"
              onClick={() => onToggleVerify(contact.fingerprint)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                contact.isVerified
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10'
              }`}
            >
              {contact.isVerified ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Verified
                </>
              ) : (
                'Mark as Verified'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-[#080808]/40 flex justify-end">
          <button
            id="done-safety-modal-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
