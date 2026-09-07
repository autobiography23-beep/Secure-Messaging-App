import React, { useState } from 'react';
import { FullAnonymousIdentity } from '../crypto/identity';
import {
  User,
  Flame,
  Plus,
  Copy,
  Check,
  X,
  Key,
  ShieldCheck,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface AnonymousProfilesModalProps {
  profiles: FullAnonymousIdentity[];
  activeProfile: FullAnonymousIdentity | null;
  onSwitchProfile: (id: string) => void;
  onCreateBurner: (customCodename?: string) => Promise<FullAnonymousIdentity>;
  onBurnIdentity: (id: string) => void;
  onClose: () => void;
}

export function AnonymousProfilesModal({
  profiles,
  activeProfile,
  onSwitchProfile,
  onCreateBurner,
  onBurnIdentity,
  onClose,
}: AnonymousProfilesModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [customName, setCustomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmBurnId, setConfirmBurnId] = useState<string | null>(null);

  if (!activeProfile) return null;

  const copyKey = () => {
    navigator.clipboard.writeText(activeProfile.publicKeyJwk);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyFingerprint = () => {
    navigator.clipboard.writeText(activeProfile.fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      await onCreateBurner(customName.trim() || undefined);
      setCustomName('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      id="anonymous-profiles-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="anonymous-profiles-card"
        className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-[#E0E0E0] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#080808]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-base tracking-tight text-white">Anonymous Identities</h2>
              <p className="text-xs text-white/40">
                Zero KYC, zero telemetry, ephemeral ECDH cryptographic personas
              </p>
            </div>
          </div>
          <button
            id="close-profiles-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Active Profile Card */}
          <div className="p-4 rounded-xl bg-[#101010] border border-white/10 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mr-10 -mt-10 opacity-20 pointer-events-none"
              style={{ backgroundColor: activeProfile.colorHex }}
            />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/10"
                  style={{ backgroundColor: `${activeProfile.colorHex}25` }}
                >
                  {activeProfile.avatarGlyph}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-base text-white">
                      {activeProfile.codename}
                    </span>
                    {activeProfile.isBurner && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" /> Burner
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/40 font-mono mt-0.5">
                    ID: {activeProfile.fingerprint}
                  </div>
                </div>
              </div>

              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Active Persona
              </span>
            </div>

            {/* Sharing Key details */}
            <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Share Public Fingerprint:</span>
                <button
                  id="copy-my-fingerprint-btn"
                  onClick={copyFingerprint}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 flex items-center gap-1 transition-colors"
                >
                  {copiedFingerprint ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copiedFingerprint ? 'Copied' : 'Copy ID'}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">Full ECDH Public Key (JWK):</span>
                <button
                  id="copy-my-pubkey-btn"
                  onClick={copyKey}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 flex items-center gap-1 transition-colors"
                >
                  {copiedKey ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Key className="w-3 h-3" />
                  )}
                  {copiedKey ? 'Copied' : 'Copy Public Key'}
                </button>
              </div>
            </div>
          </div>

          {/* Create New Burner Persona */}
          <div className="p-4 rounded-xl bg-[#080808] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Spawn Ephemeral Burner Identity
              </div>
              <span className="text-[11px] text-white/40">Fresh ECDH Keypair</span>
            </div>

            <div className="flex gap-2">
              <input
                id="custom-burner-name-input"
                type="text"
                placeholder="Optional codename (e.g. Ghost-99)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 bg-[#101010] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                id="create-burner-btn"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-[0_0_12px_rgba(79,70,229,0.3)] transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {isCreating ? 'Generating...' : 'Spawn Burner'}
              </button>
            </div>
          </div>

          {/* Persona Switcher List */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-white/40 uppercase tracking-wider px-1">
              Saved Identities ({profiles.length})
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {profiles.map((prof) => {
                const isActive = prof.id === activeProfile.id;
                const isConfirming = confirmBurnId === prof.id;

                return (
                  <div
                    key={prof.id}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-white/5 border-white/10 shadow-xs'
                        : 'bg-[#080808] border-white/5 hover:bg-white/[0.03]'
                    }`}
                  >
                    <button
                      onClick={() => onSwitchProfile(prof.id)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                        style={{ backgroundColor: `${prof.colorHex}25` }}
                      >
                        {prof.avatarGlyph}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white flex items-center gap-2">
                          {prof.codename}
                          {isActive && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              (current)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-white/40">
                          {prof.fingerprint}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isConfirming ? (
                        <div className="flex items-center gap-1 bg-red-950/60 p-1 rounded-lg border border-red-800/60">
                          <span className="text-[10px] text-red-300 font-mono px-1">Shred?</span>
                          <button
                            id={`confirm-shred-${prof.id}`}
                            onClick={() => onBurnIdentity(prof.id)}
                            className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-[10px] text-white font-medium"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmBurnId(null)}
                            className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/70"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`burn-identity-btn-${prof.id}`}
                          onClick={() => setConfirmBurnId(prof.id)}
                          title="Burn & Destroy Persona"
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-[#080808]/40 flex justify-end">
          <button
            id="done-profiles-modal-btn"
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
