import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  loginSchema,
  updateItemStatusSchema
} from '@/lib/validation';

describe('loginSchema', () => {
  it('accepts a valid email + password', () => {
    const r = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret'
    });
    expect(r.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('createProjectSchema', () => {
  const valid = {
    name: 'Acme onboarding',
    customerOrgId: 'org_1',
    templateId: 'tpl_1',
    ownerId: 'usr_1'
  };

  it('accepts a minimal valid payload', () => {
    const r = createProjectSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('coerces an ISO targetDate string into a Date', () => {
    const r = createProjectSchema.parse({
      ...valid,
      targetDate: '2026-12-31'
    });
    expect(r.targetDate).toBeInstanceOf(Date);
  });

  it('leaves targetDate undefined when omitted', () => {
    const r = createProjectSchema.parse(valid);
    expect(r.targetDate).toBeUndefined();
  });

  it('rejects a too-short name', () => {
    const r = createProjectSchema.safeParse({ ...valid, name: 'x' });
    expect(r.success).toBe(false);
  });

  it('rejects a missing customerOrgId', () => {
    const r = createProjectSchema.safeParse({ ...valid, customerOrgId: '' });
    expect(r.success).toBe(false);
  });
});

describe('updateItemStatusSchema', () => {
  it('accepts every valid status', () => {
    for (const status of [
      'PENDING',
      'IN_PROGRESS',
      'BLOCKED',
      'COMPLETED',
      'SKIPPED'
    ]) {
      const r = updateItemStatusSchema.safeParse({ itemId: 'i1', status });
      expect(r.success).toBe(true);
    }
  });

  it('rejects an unknown status', () => {
    const r = updateItemStatusSchema.safeParse({
      itemId: 'i1',
      status: 'DONE'
    });
    expect(r.success).toBe(false);
  });

  it('rejects notes longer than the limit', () => {
    const r = updateItemStatusSchema.safeParse({
      itemId: 'i1',
      status: 'PENDING',
      notes: 'x'.repeat(2001)
    });
    expect(r.success).toBe(false);
  });
});
