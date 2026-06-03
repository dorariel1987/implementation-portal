import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, type Locale } from './config';
import { getDictionary, type Dictionary } from './dictionaries';

export function getLocale(): Locale {
  const cookie = cookies().get(LOCALE_COOKIE)?.value;
  return cookie ? normalizeLocale(cookie) : DEFAULT_LOCALE;
}

export function getServerDictionary(): { locale: Locale; t: Dictionary } {
  const locale = getLocale();
  return { locale, t: getDictionary(locale) };
}
