import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getServerDictionary } from '@/lib/i18n/server';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LoginForm } from './LoginForm';

interface Props {
  searchParams: { next?: string; reason?: string };
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession();
  if (session) redirect('/dashboard');

  const { locale, t } = getServerDictionary();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 lg:block">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_30%,#ffffff44,transparent_50%),radial-gradient(circle_at_80%_70%,#ffffff33,transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
              IP
            </span>
            {t.common.appName}
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight">
              {t.login.heroTitleLine1}
              <br /> {t.login.heroTitleLine2}
            </h1>
            <p className="max-w-md text-brand-100">{t.login.heroSubtitle}</p>
            <ul className="space-y-3 text-sm text-brand-100">
              <li className="flex items-center gap-2">
                <Sparkles size={14} /> {t.login.feature1}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={14} /> {t.login.feature2}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={14} /> {t.login.feature3}
              </li>
            </ul>
          </div>
          <p className="text-xs text-brand-200/80">
            © {new Date().getFullYear()} {t.common.appName}
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-end">
            <LanguageSwitcher current={locale} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {t.login.welcome}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{t.login.subtitle}</p>
          </div>
          {searchParams.reason === 'inactive' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t.login.inactiveAccount}
            </div>
          )}
          <LoginForm
            next={searchParams.next}
            labels={{
              email: t.login.emailLabel,
              password: t.login.passwordLabel,
              signIn: t.login.signIn,
              signingIn: t.login.signingIn
            }}
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <div className="font-medium text-slate-700">{t.login.demoTitle}</div>
            <div className="mt-1 grid gap-0.5">
              <span>{t.login.demoOwner}</span>
              <span>{t.login.demoCustomerAdmin}</span>
              <span>{t.login.demoCustomerUser}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
