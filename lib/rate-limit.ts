// NOTE: This in-memory store resets on restart and is not shared across instances. Use a distributed KV store (e.g. Redis/Upstash) for multi-instance production deployments.

interface Window {
  count: number;
  start: number;
}

const store = new Map<string, Window>();

/** Returns true if the IP has exceeded the rate limit. */
export function rateLimit(
  ip: string,
  opts?: { limit?: number; windowMs?: number }
): boolean {
  const limit = opts?.limit ?? 10;
  const windowMs = opts?.windowMs ?? 60_000;
  const now = Date.now();

  const entry = store.get(ip);

  if (!entry || now - entry.start >= windowMs) {
    store.set(ip, { count: 1, start: now });
    // Cleanup stale entries periodically (every ~100 new windows)
    if (Math.random() < 0.01) {
      for (const [key, val] of store) {
        if (now - val.start >= windowMs) store.delete(key);
      }
    }
    return false;
  }

  entry.count += 1;
  if (entry.count > limit) return true;
  return false;
}
