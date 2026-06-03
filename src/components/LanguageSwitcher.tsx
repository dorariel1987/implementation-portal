'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_LABEL,
  type Locale
} from '@/lib/i18n/config';

interface Props {
  current: Locale;
}

export function LanguageSwitcher({ current }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(locale: Locale) {
    if (locale === current) return;
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 text-xs"
      role="group"
      aria-label="Language"
    >
      <Globe size={13} className="mx-1 text-slate-400" />
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => setLocale(locale)}
          disabled={isPending}
          aria-pressed={locale === current}
          className={
            locale === current
              ? 'rounded-md bg-brand-600 px-2 py-1 font-medium text-white'
              : 'rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-slate-100'
          }
        >
          {LOCALE_LABEL[locale]}
        </button>
      ))}
    </div>
  );
}
