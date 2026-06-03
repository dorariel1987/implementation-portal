import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/TopBar';
import { getLocale } from '@/lib/i18n/server';

export default async function PortalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const locale = getLocale();
  return (
    <div className="min-h-screen">
      <TopBar user={user} locale={locale} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
