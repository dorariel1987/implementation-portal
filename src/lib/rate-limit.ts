// Lightweight in-memory sliding-window rate limiter.
//
// Scope: single Node process. This is sufficient for brute-force protection on
// a single instance / dev. For multi-instance production, back this with Redis
// (e.g. @upstash/ratelimit) — the call sites would not need to change.

interface Bucket {
  hits: number[]; // epoch-ms timestamps within the current window
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map doesn't grow unbounded under churn.
let lastSweep = 0;
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Records an attempt against `key` and reports whether it is allowed.
 * @param limit    Max attempts permitted within the window.
 * @param windowMs Sliding window size in milliseconds.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1000)
    );
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.hits.length),
    retryAfterSeconds: 0
  };
}

/** Clears a key, e.g. after a successful login. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
