// WebAuthn & PBKDF2 biometric security helper

export async function isBiometricsSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerWebAuthnBiometrics(
  username: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn not supported in this browser environment');
    }

    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const userId = window.crypto.getRandomValues(new Uint8Array(16));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Secure Vault',
          id: window.location.hostname || 'localhost',
        },
        user: {
          id: userId,
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Registration cancelled' };
    }

    const rawId = credential.rawId;
    const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(rawId)));

    return { success: true, credentialId: credIdBase64 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Biometric registration failed';
    return { success: false, error: message };
  }
}

export async function verifyWebAuthnBiometrics(
  credentialIdBase64?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn not available');
    }

    const challenge = window.crypto.getRandomValues(new Uint8Array(32));
    const allowCredentials: PublicKeyCredentialDescriptor[] = [];

    if (credentialIdBase64) {
      const binary = atob(credentialIdBase64);
      const idBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        idBytes[i] = binary.charCodeAt(i);
      }
      allowCredentials.push({
        id: idBytes,
        type: 'public-key',
        transports: ['internal'],
      });
    }

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'required',
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        timeout: 60000,
      },
    });

    return { success: !!assertion };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Biometric verification failed';
    return { success: false, error: message };
  }
}

/**
 * PBKDF2 hash generator for Vault PIN
 */
export async function hashPasscode(
  passcode: string,
  saltHex?: string
): Promise<{ hashHex: string; saltHex: string }> {
  const salt = saltHex
    ? hexToUint8Array(saltHex)
    : window.crypto.getRandomValues(new Uint8Array(16));

  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );

  return {
    hashHex: uint8ArrayToHex(new Uint8Array(derivedBits)),
    saltHex: uint8ArrayToHex(salt),
  };
}

export async function verifyPasscode(
  passcode: string,
  expectedHashHex: string,
  saltHex: string
): Promise<boolean> {
  const { hashHex } = await hashPasscode(passcode, saltHex);
  return hashHex === expectedHashHex;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// High-tech sound synthesizers using Web Audio API for sensory tactile feedback
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playSecurityAudio(
  type: 'scan' | 'unlock' | 'lock' | 'burn' | 'send' | 'receive' | 'error'
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'scan') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'unlock') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.25);
    } else if (type === 'lock') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'burn') {
      // Noise burst for cryptographic shredding
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.linearRampToValueAtTime(600, now + 0.15);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (type === 'send') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'receive') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {
    // Ignore audio restrictions
  }
}
