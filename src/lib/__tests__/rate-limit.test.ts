import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { consumeRateLimit, resetRateLimit } from '@/lib/rate-limit';

// Each test uses a unique key so the module-level bucket map can't leak state
// between cases. Time is faked so the sliding window is fully deterministic.
let keySeq = 0;
function freshKey() {
  return `test-key-${Date.now()}-${keySeq++}`;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('consumeRateLimit', () => {
  it('allows attempts up to the limit then blocks', () => {
    const key = freshKey();
    const limit = 3;
    const windowMs = 60_000;

    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(true);
    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(true);
    const third = consumeRateLimit(key, limit, windowMs);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);

    const blocked = consumeRateLimit(key, limit, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('reports decreasing remaining counts', () => {
    const key = freshKey();
    expect(consumeRateLimit(key, 5, 60_000).remaining).toBe(4);
    expect(consumeRateLimit(key, 5, 60_000).remaining).toBe(3);
    expect(consumeRateLimit(key, 5, 60_000).remaining).toBe(2);
  });

  it('frees up capacity once the window slides past old hits', () => {
    const key = freshKey();
    const limit = 2;
    const windowMs = 10_000;

    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(true);
    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(true);
    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(false);

    // Advance just past the window so both prior hits expire.
    vi.advanceTimersByTime(windowMs + 1);

    expect(consumeRateLimit(key, limit, windowMs).allowed).toBe(true);
  });

  it('computes a sensible Retry-After (<= window)', () => {
    const key = freshKey();
    const windowMs = 30_000;
    consumeRateLimit(key, 1, windowMs);
    const blocked = consumeRateLimit(key, 1, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(windowMs / 1000);
  });

  it('keeps separate buckets per key', () => {
    const a = freshKey();
    const b = freshKey();
    consumeRateLimit(a, 1, 60_000);
    expect(consumeRateLimit(a, 1, 60_000).allowed).toBe(false);
    // Different key is unaffected.
    expect(consumeRateLimit(b, 1, 60_000).allowed).toBe(true);
  });
});

describe('resetRateLimit', () => {
  it('clears a key so it can be consumed again immediately', () => {
    const key = freshKey();
    consumeRateLimit(key, 1, 60_000);
    expect(consumeRateLimit(key, 1, 60_000).allowed).toBe(false);

    resetRateLimit(key);

    expect(consumeRateLimit(key, 1, 60_000).allowed).toBe(true);
  });
});
