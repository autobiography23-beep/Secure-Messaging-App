import React, { useState } from 'react';
import { useSecureMessenger } from './hooks/useSecureMessenger';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { VaultLockModal } from './components/VaultLockModal';
import { StealthDecoyView } from './components/StealthDecoyView';
import { CipherInspectorModal } from './components/CipherInspectorModal';
import { SafetyNumberModal } from './components/SafetyNumberModal';
import { AnonymousProfilesModal } from './components/AnonymousProfilesModal';
import { SecureMessage } from './types';

export default function App() {
  const {
    profiles,
    activeProfile,
    contacts,
    activeContactFingerprint,
    setActiveContactFingerprint,
    messages,
    onlinePeers,
    isConnectedToServer,
    activeTimerSeconds,
    setActiveTimerSeconds,
    activeBurnType,
    setActiveBurnType,
    lockConfig,
    isStealthMode,
    setIsStealthMode,
    peerTyping,
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
  } = useSecureMessenger();

  // Active Modals
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [showSafetyNumbers, setShowSafetyNumbers] = useState(false);
  const [inspectingMessage, setInspectingMessage] = useState<SecureMessage | null>(null);

  const activeContact =
    contacts.find((c) => c.fingerprint === activeContactFingerprint) || null;

  // Render Stealth Decoy Cloak if enabled
  if (isStealthMode) {
    return <StealthDecoyView onExitStealth={() => setIsStealthMode(false)} />;
  }

  return (
    <div id="secure-app-root" className="h-screen w-screen flex flex-col bg-[#050505] text-[#E0E0E0] overflow-hidden font-sans">
      {/* Header */}
      <Header
        activeProfile={activeProfile}
        isConnected={isConnectedToServer}
        onOpenProfiles={() => setShowProfilesModal(true)}
        onLockVault={lockVault}
        onEnterStealth={() => setIsStealthMode(true)}
        onPurgeAll={purgeAllData}
      />

      {/* Main Messenger Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          contacts={contacts}
          activeFingerprint={activeContactFingerprint}
          onlinePeers={onlinePeers}
          onSelectContact={(fp) => setActiveContactFingerprint(fp)}
          onAddContact={addContactByDetails}
        />

        <ChatWindow
          contact={activeContact}
          activeProfile={activeProfile}
          messages={messages}
          activeTimerSeconds={activeTimerSeconds}
          activeBurnType={activeBurnType}
          isPeerTyping={peerTyping}
          onSendMessage={sendMessage}
          onSetTimer={setActiveTimerSeconds}
          onSetBurnType={setActiveBurnType}
          onTriggerBurnOnView={triggerBurnOnView}
          onOpenSafetyNumbers={() => setShowSafetyNumbers(true)}
          onOpenCipherInspector={(msg) => setInspectingMessage(msg)}
          onTyping={sendTypingSignal}
        />
      </div>

      {/* Vault Biometric / Passcode Lock Screen Overlay */}
      {lockConfig.isLocked && (
        <VaultLockModal
          lockConfig={lockConfig}
          onUnlockPasscode={unlockVaultWithPasscode}
          onUnlockBiometrics={unlockVaultWithBiometrics}
          onConfigurePasscode={configurePasscode}
        />
      )}

      {/* Cryptographic Inspector Modal */}
      {inspectingMessage && (
        <CipherInspectorModal
          message={inspectingMessage}
          onClose={() => setInspectingMessage(null)}
        />
      )}

      {/* Safety Numbers MITM Verification Modal */}
      {showSafetyNumbers && activeContact && (
        <SafetyNumberModal
          contact={activeContact}
          myCodename={activeProfile?.codename || 'Anonymous'}
          onToggleVerify={toggleVerifyContact}
          onClose={() => setShowSafetyNumbers(false)}
        />
      )}

      {/* Anonymous Burner Profiles Modal */}
      {showProfilesModal && (
        <AnonymousProfilesModal
          profiles={profiles}
          activeProfile={activeProfile}
          onSwitchProfile={switchProfile}
          onCreateBurner={createBurnerProfile}
          onBurnIdentity={burnIdentity}
          onClose={() => setShowProfilesModal(false)}
        />
      )}
    </div>
  );
}
