// Display helpers. Inputs are typed as `string` (matching Prisma's output for
// our enum-like fields), but the lookup tables themselves remain typed for
// exhaustiveness during development.

import type { ItemStatus, ProjectStatus, Role, ItemKind } from './types';

const _STATUS_LABEL: Record<ItemStatus, string> = {
  PENDING: 'ממתין',
  IN_PROGRESS: 'בעבודה',
  BLOCKED: 'חסום',
  COMPLETED: 'הושלם',
  SKIPPED: 'דולג'
};
export const STATUS_LABEL: Record<string, string> = _STATUS_LABEL;

const _PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  DRAFT: 'טיוטה',
  ACTIVE: 'פעיל',
  ON_HOLD: 'מושהה',
  COMPLETED: 'הושלם',
  ARCHIVED: 'בארכיון'
};
export const PROJECT_STATUS_LABEL: Record<string, string> = _PROJECT_STATUS_LABEL;

const _ITEM_KIND_LABEL: Record<ItemKind, string> = {
  INFO: 'מידע',
  TASK: 'משימה',
  FORM: 'טופס',
  UPLOAD: 'העלאת קובץ',
  APPROVAL: 'אישור'
};
export const ITEM_KIND_LABEL: Record<string, string> = _ITEM_KIND_LABEL;

const _STATUS_TONE: Record<ItemStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  BLOCKED: 'bg-rose-50 text-rose-700 border-rose-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SKIPPED: 'bg-slate-50 text-slate-500 border-slate-200'
};
export const STATUS_TONE: Record<string, string> = _STATUS_TONE;

const _PROJECT_STATUS_TONE: Record<ProjectStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ACTIVE: 'bg-brand-50 text-brand-700 border-brand-200',
  ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ARCHIVED: 'bg-slate-50 text-slate-500 border-slate-200'
};
export const PROJECT_STATUS_TONE: Record<string, string> = _PROJECT_STATUS_TONE;

const _ROLE_LABEL_HE: Record<Role, string> = {
  OWNER: 'בעלים',
  IMPLEMENTER: 'איש הטמעה',
  CUSTOMER_ADMIN: 'מנהל לקוח',
  CUSTOMER_USER: 'משתמש לקוח',
  VIEWER: 'צופה'
};
export const ROLE_LABEL_HE: Record<string, string> = _ROLE_LABEL_HE;

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function progressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
