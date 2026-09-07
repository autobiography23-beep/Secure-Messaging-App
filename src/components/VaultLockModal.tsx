import React, { useState } from 'react';
import { VaultLockConfig } from '../types';
import {
  Fingerprint,
  Lock,
  Unlock,
  Shield,
  KeyRound,
  AlertCircle,
  ScanLine,
} from 'lucide-react';

interface VaultLockModalProps {
  lockConfig: VaultLockConfig;
  onUnlockPasscode: (pin: string) => Promise<boolean>;
  onUnlockBiometrics: () => Promise<boolean>;
  onConfigurePasscode: (pin: string) => Promise<void>;
}

export function VaultLockModal({
  lockConfig,
  onUnlockPasscode,
  onUnlockBiometrics,
  onConfigurePasscode,
}: VaultLockModalProps) {
  const [pin, setPin] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSettingUpPin, setIsSettingUpPin] = useState(!lockConfig.hasPasscode);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleBiometricClick = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    try {
      const ok = await onUnlockBiometrics();
      if (!ok) {
        setErrorMsg('Biometric verification failed. Please use PIN.');
      }
    } catch {
      setErrorMsg('Biometric scanner unavailable. Use PIN.');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setErrorMsg(null);

    const ok = await onUnlockPasscode(pin);
    if (!ok) {
      setErrorMsg('Incorrect security passcode. Access denied.');
      setPin('');
    }
  };

  const handleSetupPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setErrorMsg('Passcode must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Passcodes do not match');
      return;
    }

    await onConfigurePasscode(newPin);
    setIsSettingUpPin(false);
    setNewPin('');
    setConfirmPin('');
    setErrorMsg(null);
  };

  const handleNumpadPress = (num: string) => {
    if (isSettingUpPin) {
      if (newPin.length < 6) setNewPin((p) => p + num);
    } else {
      if (pin.length < 6) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length >= 4 && lockConfig.hasPasscode) {
          // Auto-verify when 4 or 6 digits entered
          onUnlockPasscode(nextPin).then((ok) => {
            if (!ok && nextPin.length >= 6) {
              setErrorMsg('Incorrect security passcode');
              setPin('');
            }
          });
        }
      }
    }
  };

  const handleNumpadClear = () => {
    if (isSettingUpPin) {
      setNewPin('');
      setConfirmPin('');
    } else {
      setPin('');
    }
    setErrorMsg(null);
  };

  return (
    <div
      id="vault-lock-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-xl p-4 select-none"
    >
      <div
        id="vault-lock-container"
        className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Subtle decorative glowing aperture */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#050505] border border-white/10 flex items-center justify-center mb-4 text-indigo-400 shadow-inner relative">
          {isScanning ? (
            <>
              <Fingerprint className="w-8 h-8 animate-pulse text-indigo-400" />
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
                <div className="w-full h-0.5 bg-indigo-400/80 shadow-[0_0_12px_#818cf8] animate-bounce" />
              </div>
            </>
          ) : (
            <Lock className="w-8 h-8 text-white/80" />
          )}
        </div>

        <h1 className="text-lg font-medium text-white tracking-tight flex items-center gap-2">
          Security Vault Locked
        </h1>
        <p className="text-xs text-white/40 mt-1 mb-5">
          Biometric authentication or security PIN required to decrypt local keys
        </p>

        {errorMsg && (
          <div className="w-full mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSettingUpPin ? (
          /* Initial PIN configuration */
          <form onSubmit={handleSetupPinSubmit} className="w-full space-y-3">
            <div className="text-xs font-medium text-white/60 text-left uppercase tracking-wider">
              Create Your Vault Security PIN
            </div>
            <input
              id="setup-pin-input"
              type="password"
              maxLength={6}
              placeholder="Enter 4-6 digit PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full bg-[#101010] border border-white/10 rounded-xl px-4 py-2.5 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-indigo-500/50"
            />
            <input
              id="setup-pin-confirm-input"
              type="password"
              maxLength={6}
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full bg-[#101010] border border-white/10 rounded-xl px-4 py-2.5 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-indigo-500/50"
            />
            <button
              id="save-vault-pin-btn"
              type="submit"
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors"
            >
              Set PIN & Secure Vault
            </button>
          </form>
        ) : (
          /* Unlock Interface */
          <div className="w-full space-y-5">
            {/* Biometric trigger button */}
            <button
              id="biometric-scan-btn"
              onClick={handleBiometricClick}
              disabled={isScanning}
              className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ScanLine className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-white">
                  {isScanning ? 'Scanning Authenticator...' : 'Authenticate with Biometrics'}
                </div>
                <div className="text-[11px] text-white/40">Touch ID, Face ID, or WebAuthn</div>
              </div>
            </button>

            {/* PIN Dots visualizer */}
            <div className="flex items-center justify-center gap-2.5 py-1">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx < pin.length
                      ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]'
                      : 'bg-white/5 border border-white/10'
                  }`}
                />
              ))}
            </div>

            {/* Quick Numpad for tactile PIN entry */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  id={`numpad-btn-${num}`}
                  type="button"
                  onClick={() => handleNumpadPress(num)}
                  className="h-11 rounded-lg bg-[#101010] hover:bg-white/10 border border-white/5 text-sm font-medium text-white active:scale-95 transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                id="numpad-clear-btn"
                type="button"
                onClick={handleNumpadClear}
                className="h-11 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white/40 active:scale-95 transition-all"
              >
                Clear
              </button>
              <button
                id="numpad-btn-0"
                type="button"
                onClick={() => handleNumpadPress('0')}
                className="h-11 rounded-lg bg-[#101010] hover:bg-white/10 border border-white/5 text-sm font-medium text-white active:scale-95 transition-all"
              >
                0
              </button>
              <button
                id="numpad-submit-btn"
                type="button"
                onClick={handlePinSubmit}
                className="h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_12px_rgba(79,70,229,0.3)] active:scale-95 transition-all"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Footnote */}
        <div className="mt-5 text-[10px] text-white/30 uppercase tracking-widest font-mono flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-white/30" />
          WebCrypto Hardware-Backed Keyring
        </div>
      </div>
    </div>
  );
}
