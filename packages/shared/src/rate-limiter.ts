const rateLimits = new Map<string, number[]>();

/**
 * Check if the caller has exceeded the rate limit.
 * Returns true if request is allowed, false if rate limited.
 * 
 * @param key Unique identifier (e.g. IP address + route name)
 * @param limit Maximum allowed requests in the window
 * @param windowMs Window size in milliseconds
 */
export function isAllowedRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(key) || [];

  // Filter timestamps to keep only those within the current window
  const activeTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (activeTimestamps.length >= limit) {
    return false;
  }

  activeTimestamps.push(now);
  rateLimits.set(key, activeTimestamps);
  return true;
}
