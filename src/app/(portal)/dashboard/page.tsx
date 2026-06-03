import Link from 'next/link';
import { ArrowLeft, ClipboardList, Sparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isVendor } from '@/lib/rbac';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { ProjectStatusBadge } from '@/components/StatusBadge';
import { formatDate, progressPercent } from '@/lib/format';

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { denied?: string };
}) {
  const user = await requireUser();

  const where = isVendor(user.role)
    ? {}
    : { customerOrgId: user.organizationId };

  const projects = await db.project.findMany({
    where: { ...where, status: { not: 'ARCHIVED' } },
    include: {
      customerOrg: true,
      owner: true,
      items: { select: { status: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const totals = projects.reduce(
    (acc, p) => {
      acc.total += p.items.length;
      acc.completed += p.items.filter((i) => i.status === 'COMPLETED').length;
      return acc;
    },
    { total: 0, completed: 0 }
  );

  return (
    <div className="space-y-8">
      {searchParams.denied && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          הגישה לאזור המבוקש נדחתה — חסרות הרשאות.
        </div>
      )}

      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            שלום, {user.name.split(' ')[0]}.
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isVendor(user.role)
              ? 'אלו הפרויקטים הפעילים במערכת. בחרו פרויקט כדי להמשיך בליווי.'
              : 'אלו פרויקטי ההטמעה הפעילים שלכם. בחרו פרויקט כדי להמשיך.'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-6">
          <Stat label="פרויקטים" value={projects.length} />
          <Stat
            label="התקדמות כוללת"
            value={`${progressPercent(totals.completed, totals.total)}%`}
          />
        </div>
      </section>

      {projects.length === 0 ? (
        <EmptyState canCreate={isVendor(user.role)} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const completed = p.items.filter(
              (i) => i.status === 'COMPLETED'
            ).length;
            const pct = progressPercent(completed, p.items.length);
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="block">
                  <Card className="h-full transition hover:border-brand-300 hover:shadow-md">
                    <CardHeader>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500">
                          {p.customerOrg.name}
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {p.name}
                        </div>
                      </div>
                      <ProjectStatusBadge status={p.status} />
                    </CardHeader>
                    <CardBody className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {completed} / {p.items.length} משימות הושלמו
                        </span>
                        <span className="font-medium text-slate-700">
                          {pct}%
                        </span>
                      </div>
                      <Progress value={pct} />
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>אחראי: {p.owner.name}</span>
                        <span>יעד: {formatDate(p.targetDate)}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 text-sm font-medium text-brand-700">
                        המשך
                        <ArrowLeft size={14} />
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
          <ClipboardList size={24} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            אין עדיין פרויקטים
          </h2>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            {canCreate
              ? 'צרו פרויקט הטמעה חדש מתבנית checklist קיימת והזמינו את הלקוח.'
              : 'ברגע שצוות ההטמעה ישייך אליכם פרויקט, הוא יופיע כאן.'}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Sparkles size={14} />
            צור פרויקט חדש
          </Link>
        )}
      </CardBody>
    </Card>
  );
}
