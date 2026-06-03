// Domain enums implemented as TypeScript union types.
// SQLite doesn't support Prisma native enums, so we store them as strings and
// enforce validity at the Zod/application layer.

export type Role =
  | 'OWNER'
  | 'IMPLEMENTER'
  | 'CUSTOMER_ADMIN'
  | 'CUSTOMER_USER'
  | 'VIEWER';

export const ROLES: Role[] = [
  'OWNER',
  'IMPLEMENTER',
  'CUSTOMER_ADMIN',
  'CUSTOMER_USER',
  'VIEWER'
];

export type OrgType = 'VENDOR' | 'CUSTOMER';
export const ORG_TYPES: OrgType[] = ['VENDOR', 'CUSTOMER'];

export type ProjectStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'ARCHIVED';
export const PROJECT_STATUSES: ProjectStatus[] = [
  'DRAFT',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED'
];

export type ItemStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'SKIPPED';
export const ITEM_STATUSES: ItemStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
  'SKIPPED'
];

export type ItemKind = 'INFO' | 'TASK' | 'FORM' | 'UPLOAD' | 'APPROVAL';
export const ITEM_KINDS: ItemKind[] = [
  'INFO',
  'TASK',
  'FORM',
  'UPLOAD',
  'APPROVAL'
];
