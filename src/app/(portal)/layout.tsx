import { requireUser } from '@/lib/auth';
import { TopBar } from '@/components/TopBar';

export default async function PortalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="min-h-screen">
      <TopBar user={user} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
