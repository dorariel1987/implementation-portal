// i18n configuration shared by both client and server code.
// Keep this file free of server-only imports (e.g. next/headers) so it can be
// bundled into client components as well.

export type Locale = 'en' | 'he';

export const LOCALES: Locale[] = ['en', 'he'];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_COOKIE = 'locale';

// One year, in seconds.
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'he';
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function direction(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'he' ? 'rtl' : 'ltr';
}

export function intlLocale(locale: Locale): string {
  return locale === 'he' ? 'he-IL' : 'en-US';
}

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  he: 'עברית'
};
