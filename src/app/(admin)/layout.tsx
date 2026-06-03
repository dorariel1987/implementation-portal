import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/rbac';
import { TopBar } from '@/components/TopBar';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!canAccessAdmin(user.role)) redirect('/dashboard?denied=1');

  return (
    <div className="min-h-screen">
      <TopBar user={user} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
