// Display helpers. Inputs are typed as `string` (matching Prisma's output for
// our enum-like fields). Locale-aware label lookups live in the i18n
// dictionaries; the legacy Hebrew maps below are kept for backwards
// compatibility (and unit tests) but new UI code should use the i18n helpers.

import { DEFAULT_LOCALE, intlLocale, type Locale } from './i18n/config';
import { getDictionary } from './i18n/dictionaries';

export function statusLabel(status: string, locale: Locale = DEFAULT_LOCALE): string {
  return getDictionary(locale).labels.status[status] ?? status;
}

export function projectStatusLabel(
  status: string,
  locale: Locale = DEFAULT_LOCALE
): string {
  return getDictionary(locale).labels.projectStatus[status] ?? status;
}

export function itemKindLabel(kind: string, locale: Locale = DEFAULT_LOCALE): string {
  return getDictionary(locale).labels.itemKind[kind] ?? kind;
}

export function roleLabel(role: string, locale: Locale = DEFAULT_LOCALE): string {
  return getDictionary(locale).labels.role[role] ?? role;
}

export function actionLabel(action: string, locale: Locale = DEFAULT_LOCALE): string {
  return getDictionary(locale).labels.action[action] ?? action;
}

// --- Tones (locale-independent visual styling) ---------------------------

export const STATUS_TONE: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  BLOCKED: 'bg-rose-50 text-rose-700 border-rose-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SKIPPED: 'bg-slate-50 text-slate-500 border-slate-200'
};

export const PROJECT_STATUS_TONE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ACTIVE: 'bg-brand-50 text-brand-700 border-brand-200',
  ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ARCHIVED: 'bg-slate-50 text-slate-500 border-slate-200'
};

export const ACTION_TONE: Record<string, string> = {
  USER_LOGIN_FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
  PERMISSION_DENIED: 'border-rose-200 bg-rose-50 text-rose-700',
  ITEM_COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PROJECT_CREATED: 'border-brand-200 bg-brand-50 text-brand-700'
};

// --- Legacy Hebrew label maps (kept for backwards compatibility & tests) ---

export const STATUS_LABEL: Record<string, string> = getDictionary('he').labels.status;
export const PROJECT_STATUS_LABEL: Record<string, string> =
  getDictionary('he').labels.projectStatus;
export const ITEM_KIND_LABEL: Record<string, string> =
  getDictionary('he').labels.itemKind;
export const ROLE_LABEL_HE: Record<string, string> = getDictionary('he').labels.role;

// --- Date / number formatting --------------------------------------------

export function formatDate(
  d: Date | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString(intlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(
  d: Date | string | null | undefined,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString(intlLocale(locale), {
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
