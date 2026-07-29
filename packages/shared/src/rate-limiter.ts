const inMemoryRateLimits = new Map<string, number[]>();

/**
 * Check if the caller has exceeded the rate limit.
 * Uses Upstash Redis REST API when credentials are present in env variables,
 * and falls back gracefully to in-memory tracking for local dev.
 * 
 * @param key Unique identifier (e.g. IP address + route name)
 * @param limit Maximum allowed requests in the window
 * @param windowMs Window size in milliseconds (defaults to 1 hour = 3600000)
 */
export async function isAllowedRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 3600000
): Promise<boolean> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Mode 1: Distributed Upstash Redis REST API
  if (redisUrl && redisToken) {
    try {
      const windowSeconds = Math.ceil(windowMs / 1000);
      const redisKey = `ratelimit:${key}`;

      // Pipeline execution: 1. INCR, 2. EXPIRE
      const response = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['EXPIRE', redisKey, windowSeconds],
        ]),
      });

      if (response.ok) {
        const results = await response.json();
        const count = results[0]?.result;
        if (typeof count === 'number') {
          return count <= limit;
        }
      }
    } catch (error) {
      console.warn('[RateLimiter] Upstash Redis call failed, falling back to in-memory:', error);
    }
  }

  // Mode 2: In-Memory Fallback (Local Dev / Offline mode)
  const now = Date.now();
  const timestamps = inMemoryRateLimits.get(key) || [];
  const activeTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (activeTimestamps.length >= limit) {
    return false;
  }

  activeTimestamps.push(now);
  inMemoryRateLimits.set(key, activeTimestamps);
  return true;
}
