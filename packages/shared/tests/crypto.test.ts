import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import * as cryptoModule from '../src/crypto';
import crypto from 'crypto';

describe('Crypto module', () => {
  let errorSpy: any;

  beforeEach(() => {
    // Spy on console.error to avoid logging expected errors in tests
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null for null or undefined values', () => {
    expect(cryptoModule.encryptValue(null)).toBeNull();
    expect(cryptoModule.encryptValue(undefined)).toBeNull();
    expect(cryptoModule.decryptValue(null)).toBeNull();
    expect(cryptoModule.decryptValue(undefined)).toBeNull();
  });

  it('should return original string if decrypting unencrypted string', () => {
    expect(cryptoModule.decryptValue('hello')).toBe('hello');
  });

  it('should return original string on decryption error', () => {
    // Malformed encrypted string (invalid hex for IV)
    expect(cryptoModule.decryptValue('p4p_enc:invalid-iv:invalid-hex')).toBe('p4p_enc:invalid-iv:invalid-hex');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should return original string on safe fallback (missing parts)', () => {
    expect(cryptoModule.decryptValue('p4p_enc:missing_parts')).toBe('p4p_enc:missing_parts');
  });

  it('should encrypt and decrypt correctly', () => {
    const originalValue = 'hello world';
    const encrypted = cryptoModule.encryptValue(originalValue);

    // Ensure it's actually encrypted
    expect(encrypted).not.toBe(originalValue);
    expect(encrypted?.startsWith('p4p_enc:')).toBe(true);

    // Decrypt and compare
    const decrypted = cryptoModule.decryptValue(encrypted);
    expect(decrypted).toBe(originalValue);
  });

  it('should handle empty strings', () => {
    const originalValue = '';
    const encrypted = cryptoModule.encryptValue(originalValue);

    expect(encrypted).not.toBe(originalValue);
    expect(encrypted?.startsWith('p4p_enc:')).toBe(true);

    const decrypted = cryptoModule.decryptValue(encrypted);
    expect(decrypted).toBe(originalValue);
  });

  it('should fallback to plain text on encryption error', () => {
    // We can spy on crypto.randomBytes to force an error
    vi.spyOn(crypto, 'randomBytes').mockImplementation(() => {
      throw new Error('Forced encryption error');
    });

    const originalValue = 'error test';
    const result = cryptoModule.encryptValue(originalValue);

    expect(result).toBe(originalValue);
    expect(errorSpy).toHaveBeenCalled();
  });
});
