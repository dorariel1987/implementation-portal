import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  progressPercent,
  STATUS_LABEL,
  PROJECT_STATUS_LABEL,
  ROLE_LABEL_HE
} from '@/lib/format';

describe('progressPercent', () => {
  it('returns 0 when total is 0 (no divide-by-zero)', () => {
    expect(progressPercent(0, 0)).toBe(0);
  });

  it('computes whole-number percentages', () => {
    expect(progressPercent(1, 4)).toBe(25);
    expect(progressPercent(3, 7)).toBe(43); // rounded
    expect(progressPercent(7, 7)).toBe(100);
  });

  it('rounds to nearest integer', () => {
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(67);
  });
});

describe('date formatting', () => {
  it('returns an em dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDateTime(null)).toBe('—');
  });

  it('formats a real date to a non-empty string', () => {
    const out = formatDate(new Date('2026-06-03T10:00:00Z'));
    expect(out).not.toBe('—');
    expect(out.length).toBeGreaterThan(0);
  });

  it('accepts ISO strings as well as Date objects', () => {
    expect(formatDate('2026-06-03')).not.toBe('—');
    expect(formatDateTime('2026-06-03T10:00:00Z')).not.toBe('—');
  });
});

describe('label maps', () => {
  it('has Hebrew labels for known statuses with a graceful fallback shape', () => {
    expect(STATUS_LABEL.COMPLETED).toBeTruthy();
    expect(PROJECT_STATUS_LABEL.ACTIVE).toBeTruthy();
    expect(ROLE_LABEL_HE.OWNER).toBeTruthy();
  });

  it('returns undefined for unknown keys (callers use ?? fallback)', () => {
    expect(STATUS_LABEL.NOPE).toBeUndefined();
  });
});
