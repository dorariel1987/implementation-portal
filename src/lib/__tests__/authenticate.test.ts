import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all side-effecting collaborators. The rate limiter is intentionally NOT
// mocked — we want to exercise the real brute-force protection end to end.
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({})
    }
  }
}));

vi.mock('@/lib/audit', () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@/lib/auth', () => ({
  getRequestContext: () => ({ ip: '203.0.113.1', userAgent: 'vitest' }),
  setSessionCookie: vi.fn().mockResolvedValue(undefined),
  signSession: vi.fn().mockResolvedValue('signed.jwt.token'),
  verifyPassword: vi.fn()
}));

import { db } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { setSessionCookie, signSession, verifyPassword } from '@/lib/auth';
import { authenticateCredentials } from '@/lib/authenticate';

const ACTIVE_USER = {
  id: 'usr_1',
  email: 'owner@vendor.example',
  name: 'Owner',
  role: 'OWNER',
  organizationId: 'org_1',
  isActive: true,
  passwordHash: 'hashed'
};

let emailSeq = 0;
function uniqueEmail() {
  // Unique per test so the real rate limiter (keyed on email+ip) stays isolated.
  return `user${emailSeq++}@example.com`;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authenticateCredentials - success', () => {
  it('issues a token, sets the cookie, updates lastLoginAt, and audits USER_LOGIN', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ ...ACTIVE_USER } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const result = await authenticateCredentials(
      ACTIVE_USER.email,
      'correct-password',
      { via: 'rest' }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.token).toBe('signed.jwt.token');
      expect(result.user.role).toBe('OWNER');
      expect(result.user.email).toBe(ACTIVE_USER.email);
    }
    expect(signSession).toHaveBeenCalledOnce();
    expect(setSessionCookie).toHaveBeenCalledWith('signed.jwt.token');
    expect(db.user.update).toHaveBeenCalledOnce();
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_LOGIN' })
    );
  });

  it('normalizes the email (trim + lowercase) before lookup', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ ...ACTIVE_USER } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    await authenticateCredentials('  OWNER@Vendor.Example  ', 'pw', {
      via: 'web'
    });

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'owner@vendor.example' }
    });
  });
});

describe('authenticateCredentials - failures', () => {
  it('rejects an unknown user without leaking which field was wrong', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null as never);

    const result = await authenticateCredentials(uniqueEmail(), 'whatever', {
      via: 'rest'
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_CREDENTIALS');
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_LOGIN_FAILED',
        metadata: expect.objectContaining({ reason: 'unknown_or_inactive' })
      })
    );
  });

  it('rejects an inactive user', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      ...ACTIVE_USER,
      isActive: false
    } as never);

    const result = await authenticateCredentials(uniqueEmail(), 'pw', {
      via: 'rest'
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_CREDENTIALS');
    expect(setSessionCookie).not.toHaveBeenCalled();
  });

  it('rejects a wrong password and audits bad_password', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ ...ACTIVE_USER } as never);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const result = await authenticateCredentials(uniqueEmail(), 'wrong', {
      via: 'rest'
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_CREDENTIALS');
    expect(setSessionCookie).not.toHaveBeenCalled();
    expect(recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_LOGIN_FAILED',
        metadata: expect.objectContaining({ reason: 'bad_password' })
      })
    );
  });
});

describe('authenticateCredentials - brute-force protection', () => {
  it('blocks with RATE_LIMITED after repeated failures from the same email+ip', async () => {
    const email = uniqueEmail();
    vi.mocked(db.user.findUnique).mockResolvedValue({ ...ACTIVE_USER } as never);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    let lastCode: string | undefined;
    let sawRateLimit = false;
    // Limit is 8 attempts / 10 min; the 9th must be blocked.
    for (let i = 0; i < 9; i++) {
      const r = await authenticateCredentials(email, 'wrong', { via: 'rest' });
      if (!r.ok) {
        lastCode = r.code;
        if (r.code === 'RATE_LIMITED') {
          sawRateLimit = true;
          expect(r.retryAfterSeconds).toBeGreaterThan(0);
          break;
        }
      }
    }

    expect(sawRateLimit).toBe(true);
    expect(lastCode).toBe('RATE_LIMITED');
  });

  it('clears the limiter after a successful login (real users not punished)', async () => {
    const email = uniqueEmail();
    vi.mocked(db.user.findUnique).mockResolvedValue({
      ...ACTIVE_USER,
      email
    } as never);

    // A few wrong attempts...
    vi.mocked(verifyPassword).mockResolvedValue(false);
    for (let i = 0; i < 5; i++) {
      await authenticateCredentials(email, 'wrong', { via: 'rest' });
    }

    // ...then a correct one which should succeed and reset the counter.
    vi.mocked(verifyPassword).mockResolvedValue(true);
    const ok = await authenticateCredentials(email, 'correct', { via: 'rest' });
    expect(ok.ok).toBe(true);

    // Subsequent wrong attempts get the full budget again (no immediate block).
    vi.mocked(verifyPassword).mockResolvedValue(false);
    const after = await authenticateCredentials(email, 'wrong', { via: 'rest' });
    expect(after.ok).toBe(false);
    if (!after.ok) expect(after.code).toBe('INVALID_CREDENTIALS');
  });
});
