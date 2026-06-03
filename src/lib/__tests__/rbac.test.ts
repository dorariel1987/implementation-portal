import { describe, it, expect } from 'vitest';
import {
  canAccessAdmin,
  hasPermission,
  isCustomer,
  isVendor,
  meetsRoleRequirement,
  requirePermission,
  ROLE_RANK,
  type Permission
} from '@/lib/rbac';
import { ROLES, type Role } from '@/lib/types';

// The full expected permission grid. Keeping it here (rather than importing the
// private PERMISSIONS map) means the test acts as an independent specification:
// if someone changes rbac.ts, this grid must be consciously updated too.
const GRID: Record<Role, Permission[]> = {
  OWNER: [
    'project:create',
    'project:update',
    'project:delete',
    'project:view',
    'item:complete',
    'item:assign',
    'item:approve',
    'user:manage',
    'template:manage',
    'audit:view'
  ],
  IMPLEMENTER: [
    'project:create',
    'project:update',
    'project:view',
    'item:complete',
    'item:assign',
    'item:approve',
    'template:manage',
    'audit:view'
  ],
  CUSTOMER_ADMIN: ['project:view', 'item:complete', 'item:assign', 'user:manage'],
  CUSTOMER_USER: ['project:view', 'item:complete'],
  VIEWER: ['project:view', 'audit:view']
};

const ALL_PERMISSIONS: Permission[] = [
  'project:create',
  'project:update',
  'project:delete',
  'project:view',
  'item:complete',
  'item:assign',
  'item:approve',
  'user:manage',
  'template:manage',
  'audit:view'
];

describe('rbac permission matrix', () => {
  for (const role of ROLES) {
    describe(role, () => {
      for (const perm of ALL_PERMISSIONS) {
        const expected = GRID[role].includes(perm);
        it(`${expected ? 'grants' : 'denies'} ${perm}`, () => {
          expect(hasPermission(role, perm)).toBe(expected);
        });
      }
    });
  }

  it('denies everything for an unknown role', () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission('SUPERHACKER', perm)).toBe(false);
    }
  });

  it('only OWNER can delete projects', () => {
    const canDelete = ROLES.filter((r) => hasPermission(r, 'project:delete'));
    expect(canDelete).toEqual(['OWNER']);
  });

  it('every role can view projects', () => {
    for (const role of ROLES) {
      expect(hasPermission(role, 'project:view')).toBe(true);
    }
  });

  it('audit:view is restricted to OWNER, IMPLEMENTER and VIEWER', () => {
    const canAudit = ROLES.filter((r) => hasPermission(r, 'audit:view')).sort();
    expect(canAudit).toEqual(['IMPLEMENTER', 'OWNER', 'VIEWER']);
  });
});

describe('requirePermission', () => {
  it('does not throw when permitted', () => {
    expect(() => requirePermission('OWNER', 'project:delete')).not.toThrow();
  });

  it('throws when not permitted', () => {
    expect(() => requirePermission('VIEWER', 'project:delete')).toThrow(
      /project:delete/
    );
  });
});

describe('role classification helpers', () => {
  it('isVendor is true only for OWNER and IMPLEMENTER', () => {
    expect(isVendor('OWNER')).toBe(true);
    expect(isVendor('IMPLEMENTER')).toBe(true);
    expect(isVendor('CUSTOMER_ADMIN')).toBe(false);
    expect(isVendor('VIEWER')).toBe(false);
  });

  it('isCustomer is true only for customer roles', () => {
    expect(isCustomer('CUSTOMER_ADMIN')).toBe(true);
    expect(isCustomer('CUSTOMER_USER')).toBe(true);
    expect(isCustomer('OWNER')).toBe(false);
  });

  it('admin area mirrors vendor status', () => {
    for (const role of ROLES) {
      expect(canAccessAdmin(role)).toBe(isVendor(role));
    }
  });
});

describe('meetsRoleRequirement (role ranking)', () => {
  it('null requirement is always satisfied', () => {
    expect(meetsRoleRequirement('VIEWER', null)).toBe(true);
  });

  it('equal rank satisfies the requirement', () => {
    expect(meetsRoleRequirement('CUSTOMER_ADMIN', 'CUSTOMER_ADMIN')).toBe(true);
  });

  it('higher rank satisfies a lower requirement', () => {
    expect(meetsRoleRequirement('OWNER', 'CUSTOMER_ADMIN')).toBe(true);
  });

  it('lower rank fails a higher requirement', () => {
    expect(meetsRoleRequirement('CUSTOMER_USER', 'IMPLEMENTER')).toBe(false);
  });

  it('ranking is strictly ordered VIEWER < CUSTOMER_USER < CUSTOMER_ADMIN < IMPLEMENTER < OWNER', () => {
    expect(ROLE_RANK.VIEWER).toBeLessThan(ROLE_RANK.CUSTOMER_USER);
    expect(ROLE_RANK.CUSTOMER_USER).toBeLessThan(ROLE_RANK.CUSTOMER_ADMIN);
    expect(ROLE_RANK.CUSTOMER_ADMIN).toBeLessThan(ROLE_RANK.IMPLEMENTER);
    expect(ROLE_RANK.IMPLEMENTER).toBeLessThan(ROLE_RANK.OWNER);
  });

  it('an unknown actor role never meets a real requirement', () => {
    expect(meetsRoleRequirement('GHOST', 'CUSTOMER_USER')).toBe(false);
  });
});
