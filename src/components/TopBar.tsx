import Link from 'next/link';
import { LogOut, ShieldCheck } from 'lucide-react';
import { ROLE_LABEL_HE } from '@/lib/format';
import { canAccessAdmin } from '@/lib/rbac';

interface Props {
  user: {
    name: string;
    email: string;
    role: string;
    organization: { name: string };
  };
}

export function TopBar({ user }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-slate-900"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              IP
            </span>
            <span>Implementation Portal</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/dashboard">לוח בקרה</NavLink>
            {canAccessAdmin(user.role) && (
              <>
                <NavLink href="/admin/projects">פרויקטים</NavLink>
                <NavLink href="/admin/users">משתמשים</NavLink>
                <NavLink href="/admin/audit">יומן ביקורת</NavLink>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <div className="text-sm font-medium text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-500">
              {user.organization.name} · {ROLE_LABEL_HE[user.role] ?? user.role}
            </div>
          </div>
          {canAccessAdmin(user.role) && (
            <span
              title="חשבון ספק"
              className="hidden h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-700 md:grid"
            >
              <ShieldCheck size={16} />
            </span>
          )}
          <form action="/api/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={14} />
              התנתק
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}
