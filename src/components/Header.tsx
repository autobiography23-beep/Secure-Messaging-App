import React, { useState } from 'react';
import { FullAnonymousIdentity } from '../crypto/identity';
import {
  Shield,
  Lock,
  EyeOff,
  Flame,
  User,
  Radio,
  Trash2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  activeProfile: FullAnonymousIdentity | null;
  isConnected: boolean;
  onOpenProfiles: () => void;
  onLockVault: () => void;
  onEnterStealth: () => void;
  onPurgeAll: () => void;
}

export function Header({
  activeProfile,
  isConnected,
  onOpenProfiles,
  onLockVault,
  onEnterStealth,
  onPurgeAll,
}: HeaderProps) {
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  return (
    <header
      id="app-header"
      className="h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between z-30 shrink-0 text-[#E0E0E0]"
    >
      {/* Left: Branding & Encryption Specs */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 border border-white/10 flex items-center justify-center text-indigo-300 shadow-[0_0_12px_rgba(79,70,229,0.2)]">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-medium text-sm md:text-base tracking-tight text-white">
              Secure Messaging
            </h1>
            <span className="hidden sm:inline-flex text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 tracking-widest">
              ECDH + AES-256
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              {isConnected ? 'Blind Relay Active' : 'Relay Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Actions: Persona Chip, Stealth Mode, Lock Vault, Panic Shred */}
      <div className="flex items-center gap-2">
        {/* Anonymous Identity Switcher Chip */}
        {activeProfile && (
          <button
            id="open-profiles-chip"
            onClick={onOpenProfiles}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
            title="Manage Anonymous Personas & Keys"
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs border border-white/10"
              style={{ backgroundColor: `${activeProfile.colorHex}30` }}
            >
              {activeProfile.avatarGlyph}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium text-white leading-none flex items-center gap-1">
                {activeProfile.codename}
                {activeProfile.isBurner && (
                  <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                )}
              </div>
              <div className="text-[10px] font-mono text-white/40 leading-none mt-1">
                {activeProfile.fingerprint.slice(0, 9)}...
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/40" />
          </button>
        )}

        {/* Stealth Decoy Toggle */}
        <button
          id="stealth-mode-btn"
          onClick={onEnterStealth}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/80 transition-colors"
          title="Stealth Decoy Mode (Disguise as Calculator)"
        >
          <EyeOff className="w-4 h-4" />
        </button>

        {/* Lock Vault */}
        <button
          id="lock-vault-header-btn"
          onClick={onLockVault}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/60 hover:text-white transition-colors"
          title="Lock Biometric Vault"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Lock Vault</span>
        </button>

        {/* Emergency Shred / Panic Button */}
        {showPurgeConfirm ? (
          <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-lg border border-red-800/80 animate-in fade-in">
            <span className="text-[11px] text-red-300 font-mono px-1">Shred All?</span>
            <button
              id="confirm-panic-purge-btn"
              onClick={() => {
                onPurgeAll();
                setShowPurgeConfirm(false);
              }}
              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold shadow-sm"
            >
              Destroy
            </button>
            <button
              onClick={() => setShowPurgeConfirm(false)}
              className="px-1.5 py-1 rounded bg-white/10 text-white/80 text-[11px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            id="panic-purge-btn"
            onClick={() => setShowPurgeConfirm(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-950/40 border border-white/10 hover:border-red-900 text-white/40 hover:text-red-400 transition-colors"
            title="Panic: Cryptographic Shred All Data & Keys"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
