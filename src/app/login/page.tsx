import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { LoginForm } from './LoginForm';

interface Props {
  searchParams: { next?: string; reason?: string };
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession();
  if (session) redirect('/dashboard');

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 lg:block">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_30%,#ffffff44,transparent_50%),radial-gradient(circle_at_80%_70%,#ffffff33,transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
              IP
            </span>
            Implementation Portal
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight">
              להפוך כל הטמעה
              <br /> לחוויה מודרכת.
            </h1>
            <p className="max-w-md text-brand-100">
              מהרגע שלקוח מקבל גישה ועד go-live — checklists חיים, הקצאות מבוססות
              תפקיד, ומסלול ביקורת מלא לכל פעולה.
            </p>
            <ul className="space-y-3 text-sm text-brand-100">
              <li className="flex items-center gap-2">
                <Sparkles size={14} /> תבניות onboarding לשימוש חוזר
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={14} /> RBAC עם 5 רמות הרשאה
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={14} /> Audit trail צמוד לתאימות וביקורת
              </li>
            </ul>
          </div>
          <p className="text-xs text-brand-200/80">
            © {new Date().getFullYear()} Implementation Portal
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              ברוכים הבאים
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              התחברו כדי להמשיך בתהליך ההטמעה שלכם.
            </p>
          </div>
          {searchParams.reason === 'inactive' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              החשבון אינו פעיל. פנו למנהל המערכת.
            </div>
          )}
          <LoginForm next={searchParams.next} />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <div className="font-medium text-slate-700">פרטי התחברות לדמו</div>
            <div className="mt-1 grid gap-0.5">
              <span>בעלים: owner@vendor.example / Demo!2026</span>
              <span>מנהל לקוח: admin@acme.example / Demo!2026</span>
              <span>משתמש לקוח: maria@acme.example / Demo!2026</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
