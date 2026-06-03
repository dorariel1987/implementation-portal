import type { Role } from './types';

export const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  CUSTOMER_USER: 1,
  CUSTOMER_ADMIN: 2,
  IMPLEMENTER: 3,
  OWNER: 4
};

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: 'בעלים',
  IMPLEMENTER: 'איש הטמעה',
  CUSTOMER_ADMIN: 'מנהל לקוח',
  CUSTOMER_USER: 'משתמש לקוח',
  VIEWER: 'צופה'
};

export type Permission =
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  | 'project:view'
  | 'item:complete'
  | 'item:assign'
  | 'item:approve'
  | 'user:manage'
  | 'template:manage'
  | 'audit:view';

const PERMISSIONS: Record<Role, Permission[]> = {
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
  CUSTOMER_ADMIN: [
    'project:view',
    'item:complete',
    'item:assign',
    'user:manage'
  ],
  CUSTOMER_USER: ['project:view', 'item:complete'],
  VIEWER: ['project:view', 'audit:view']
};

// All public helpers accept `string` (the type Prisma returns for SQLite-backed
// enum-like fields). Internally we narrow to the strict union and rely on
// the application-layer write validation to keep the database consistent.

export function hasPermission(role: string, perm: Permission): boolean {
  return PERMISSIONS[role as Role]?.includes(perm) ?? false;
}

export function requirePermission(role: string, perm: Permission): void {
  if (!hasPermission(role, perm)) {
    throw new Error(`Forbidden: missing permission ${perm}`);
  }
}

export function isVendor(role: string): boolean {
  return role === 'OWNER' || role === 'IMPLEMENTER';
}

export function isCustomer(role: string): boolean {
  return role === 'CUSTOMER_ADMIN' || role === 'CUSTOMER_USER';
}

export function canAccessAdmin(role: string): boolean {
  return isVendor(role);
}

export function meetsRoleRequirement(
  actor: string,
  required: string | null
): boolean {
  if (!required) return true;
  return (ROLE_RANK[actor as Role] ?? -1) >= (ROLE_RANK[required as Role] ?? 0);
}
