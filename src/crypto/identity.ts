import { AnonymousProfile } from '../types';
import { generateECDHKeyPair, computeFingerprint } from './e2ee';

const CODENAME_PREFIXES = [
  'Phantom',
  'Specter',
  'Ghost',
  'Vortex',
  'Cipher',
  'Obsidian',
  'Krypton',
  'Aegis',
  'Zero',
  'Shadow',
  'Echo',
  'Sentinel',
  'Apex',
  'Chronos',
  'Mirage',
];

const GLYPHS = ['🛡️', '⚡', '👁️', '🪐', '🗝️', '🧬', '🌀', '🔮', '🛰️', '💎', '🕶️', '🌑'];

const THEME_COLORS = [
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
];

export function generateRandomCodename(): string {
  const prefix = CODENAME_PREFIXES[Math.floor(Math.random() * CODENAME_PREFIXES.length)];
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0')
    .toUpperCase();
  return `${prefix}-${hex}`;
}

export function getRandomGlyph(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

export function getRandomColor(): string {
  return THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
}

export interface FullAnonymousIdentity extends AnonymousProfile {
  privateKeyJwk: string;
}

export async function createNewAnonymousProfile(
  isBurner = false,
  customCodename?: string
): Promise<FullAnonymousIdentity> {
  const keyPair = await generateECDHKeyPair();
  const fingerprint = await computeFingerprint(keyPair.publicKeyJwk);
  const codename = customCodename || generateRandomCodename();

  return {
    id: `anon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    codename,
    avatarGlyph: getRandomGlyph(),
    colorHex: getRandomColor(),
    publicKeyJwk: keyPair.publicKeyJwk,
    privateKeyJwk: keyPair.privateKeyJwk,
    fingerprint,
    createdAt: Date.now(),
    isBurner,
    notes: isBurner ? 'Ephemeral disposable identity' : 'Primary secure persona',
  };
}
