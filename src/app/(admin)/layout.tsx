import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/rbac';
import { TopBar } from '@/components/TopBar';
import { getLocale } from '@/lib/i18n/server';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!canAccessAdmin(user.role)) redirect('/dashboard?denied=1');
  const locale = getLocale();

  return (
    <div className="min-h-screen">
      <TopBar user={user} locale={locale} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
