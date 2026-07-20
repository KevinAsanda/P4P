import { isAllowedRateLimit } from '../rate-limiter';
import { describe, it, expect, vi } from 'vitest';

describe('Rate Limiter', () => {
  it('should allow requests within limit', () => {
    const key = 'test-key-1';
    expect(isAllowedRateLimit(key, 2, 1000)).toBe(true);
    expect(isAllowedRateLimit(key, 2, 1000)).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    const key = 'test-key-2';
    expect(isAllowedRateLimit(key, 1, 1000)).toBe(true);
    expect(isAllowedRateLimit(key, 1, 1000)).toBe(false);
  });

  it('should reset after windowMs', async () => {
    const key = 'test-key-3';

    // Mock the date so we don't have to wait during tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1000000));

    expect(isAllowedRateLimit(key, 1, 500)).toBe(true);
    expect(isAllowedRateLimit(key, 1, 500)).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(600);

    // Now it should be allowed again
    expect(isAllowedRateLimit(key, 1, 500)).toBe(true);

    vi.useRealTimers();
  });
});
