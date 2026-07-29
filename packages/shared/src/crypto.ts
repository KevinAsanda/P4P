import crypto from 'crypto';

// Retrieve or derive a 32-byte key for AES-256.
// ENCRYPTION_SECRET must always be set — never fall back to a default.
const SECRET = process.env.ENCRYPTION_SECRET;
if (!SECRET) {
  throw new Error(
    '[SECURITY] ENCRYPTION_SECRET environment variable is not set. ' +
    'This variable is required to encrypt customer PII (phone, address). ' +
    'Set it in your .env file and in your Render environment variables.'
  );
}
const KEY = crypto.createHash('sha256').update(SECRET).digest();

/**
 * Encrypt a string using AES-256-CBC.
 * Returns the format "p4p_enc:iv_hex:ciphertext_hex".
 */
export function encryptValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `p4p_enc:${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return value; // Fallback to plain text on error
  }
}

/**
 * Decrypt a string if it starts with the "p4p_enc:" prefix.
 * Otherwise, returns the value as-is (handling legacy or seeded plaintext strings).
 */
export function decryptValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  
  if (!value.startsWith('p4p_enc:')) {
    return value; // Return as-is if it's plaintext
  }

  try {
    const parts = value.split(':');
    if (parts.length !== 3) {
      return value; // Safe fallback if structure does not match
    }

    const ivHex = parts[1];
    const ciphertextHex = parts[2];

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return value; // Fallback to plain text / masked if decryption fails
  }
}
