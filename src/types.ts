export interface AnonymousProfile {
  id: string;
  codename: string;
  avatarGlyph: string;
  colorHex: string;
  publicKeyJwk: string;
  fingerprint: string;
  createdAt: number;
  isBurner: boolean;
  notes?: string;
}

export interface PeerContact {
  fingerprint: string;
  alias: string;
  publicKeyJwk: string;
  safetyNumber: string;
  isVerified: boolean;
  isOnline: boolean;
  isEchoBot?: boolean;
  lastSeen?: number;
  unreadCount: number;
}

export type BurnTimerDuration = 0 | 5 | 10 | 30 | 60 | 300 | 3600;

export interface SecureMessage {
  id: string;
  conversationFingerprint: string; // The peer's fingerprint
  senderFingerprint: string;
  recipientFingerprint: string;
  senderAlias: string;
  plaintext: string;
  ciphertext: string;
  iv: string;
  timestamp: number;
  timerSeconds: BurnTimerDuration;
  burnType: 'on_send' | 'on_view';
  viewedAt?: number;
  expiresAt?: number;
  isShredded: boolean;
  status: 'sent' | 'delivered' | 'read' | 'shredded';
  direction: 'incoming' | 'outgoing';
}

export interface EncryptedPacket {
  id: string;
  senderFingerprint: string;
  recipientFingerprint: string;
  senderAlias: string;
  senderPublicKeyJwk: string;
  ciphertext: string;
  iv: string;
  timestamp: number;
  timerSeconds: BurnTimerDuration;
  burnType: 'on_send' | 'on_view';
}

export interface VaultLockConfig {
  isLocked: boolean;
  hasPasscode: boolean;
  passcodeHash?: string;
  passcodeSalt?: string;
  biometricsEnabled: boolean;
  webauthnCredentialId?: string;
  autoLockMinutes: number; // 0 for off, 1, 3, 5, 15
  lastActiveTimestamp: number;
}
