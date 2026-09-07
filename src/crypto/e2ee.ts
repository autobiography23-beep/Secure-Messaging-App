// Utilities for Base64 and ArrayBuffer
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface KeyPairResult {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyJwk: string;
  privateKeyJwk: string;
}

/**
 * Generates an Elliptic Curve Diffie-Hellman (ECDH) keypair using curve P-256
 */
export async function generateECDHKeyPair(): Promise<KeyPairResult> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicKeyJwk: JSON.stringify(publicKeyJwk),
    privateKeyJwk: JSON.stringify(privateKeyJwk),
  };
}

/**
 * Imports a public key from JWK format
 */
export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * Imports a private key from JWK format
 */
export async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Derives a 256-bit AES-GCM symmetric session key from local private key and remote public key
 */
export async function deriveSharedKey(
  localPrivateKey: CryptoKey,
  remotePublicKey: CryptoKey
): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: remotePublicKey,
    },
    localPrivateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext using AES-256-GCM with a randomized 96-bit initialization vector (IV)
 */
export async function encryptMessage(
  plaintext: string,
  sharedKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    sharedKey,
    encoded
  );

  return {
    ciphertext: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext
 */
export async function decryptMessage(
  ciphertextBase64: string,
  ivBase64: string,
  sharedKey: CryptoKey
): Promise<string> {
  const cipherBytes = base64ToArrayBuffer(ciphertextBase64);
  const ivBytes = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes,
    },
    sharedKey,
    cipherBytes
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Computes a standardized short fingerprint from a public key string
 */
export async function computeFingerprint(publicKeyJwkStr: string): Promise<string> {
  const encoded = new TextEncoder().encode(publicKeyJwkStr);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  // Return formatted uppercase 16-character fingerprint: "ABCD-EF01-2345-6789"
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`.toUpperCase();
}

/**
 * Computes deterministic Signal-style Safety Numbers (6 groups of 5 numbers)
 * between two public keys to ensure zero Man-In-The-Middle
 */
export async function computeSafetyNumbers(
  publicKeyA: string,
  publicKeyB: string
): Promise<string[]> {
  // Sort lexicographically to ensure both peers get the exact same number
  const sorted = [publicKeyA, publicKeyB].sort();
  const concatenated = sorted.join('::');
  const encoded = new TextEncoder().encode(concatenated);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  const uint8 = new Uint8Array(hashBuffer);

  const groups: string[] = [];
  // Derive 6 groups of 5 digits
  for (let i = 0; i < 6; i++) {
    const offset = i * 4;
    const num =
      ((uint8[offset] << 24) |
        (uint8[offset + 1] << 16) |
        (uint8[offset + 2] << 8) |
        uint8[offset + 3]) >>>
      0;
    const digits = (num % 100000).toString().padStart(5, '0');
    groups.push(digits);
  }

  return groups;
}
