import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  Lock,
  PauseCircle,
  ArrowLeft
} from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { isVendor, meetsRoleRequirement } from '@/lib/rbac';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import {
  ItemStatusBadge,
  ProjectStatusBadge
} from '@/components/StatusBadge';
import {
  formatDate,
  ITEM_KIND_LABEL,
  progressPercent,
  STATUS_LABEL
} from '@/lib/format';
const STATUS_ICON: Record<string, JSX.Element> = {
  PENDING: <Circle size={18} className="text-slate-400" />,
  IN_PROGRESS: <CircleDashed size={18} className="text-amber-500" />,
  BLOCKED: <PauseCircle size={18} className="text-rose-500" />,
  COMPLETED: <CheckCircle2 size={18} className="text-emerald-600" />,
  SKIPPED: <Circle size={18} className="text-slate-300" />
};

export default async function ProjectPage({
  params
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const project = await db.project.findUnique({
    where: { id: params.id },
    include: {
      customerOrg: true,
      owner: true,
      template: true,
      items: {
        orderBy: { order: 'asc' },
        include: { templateItem: true, assignedTo: true, completedBy: true }
      }
    }
  });

  if (!project) notFound();
  if (!isVendor(user.role) && project.customerOrgId !== user.organizationId) {
    notFound();
  }

  const completed = project.items.filter(
    (i) => i.status === 'COMPLETED'
  ).length;
  const pct = progressPercent(completed, project.items.length);

  // Find the next actionable item the user can complete
  const firstActionable = project.items.find(
    (i) =>
      i.status !== 'COMPLETED' &&
      i.status !== 'SKIPPED' &&
      meetsRoleRequirement(user.role, i.templateItem.requiredRole)
  );

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        חזרה ללוח הבקרה
      </Link>

      <Card>
        <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              {project.customerOrg.name} · תבנית: {project.template.name}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {project.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>אחראי: {project.owner.name}</span>
              <span>·</span>
              <span>תאריך יעד: {formatDate(project.targetDate)}</span>
              <span>·</span>
              <span>נוצר: {formatDate(project.createdAt)}</span>
            </div>
          </div>
          <ProjectStatusBadge status={project.status} />
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {completed} מתוך {project.items.length} משימות הושלמו
            </span>
            <span className="font-medium text-slate-900">{pct}%</span>
          </div>
          <Progress value={pct} className="h-3" />
          {firstActionable && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
              <div>
                <div className="text-xs text-brand-700">השלב הבא שלך</div>
                <div className="text-sm font-medium text-slate-900">
                  {firstActionable.templateItem.title}
                </div>
              </div>
              <Link
                href={`/projects/${project.id}/items/${firstActionable.id}`}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                המשך
                <ArrowLeft size={14} />
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">
            רשימת המשימות המודרכת
          </h2>
        </CardHeader>
        <ol className="divide-y divide-slate-100">
          {project.items.map((item, idx) => {
            const canAct = meetsRoleRequirement(
              user.role,
              item.templateItem.requiredRole
            );
            return (
              <li key={item.id}>
                <Link
                  href={`/projects/${project.id}/items/${item.id}`}
                  className="flex items-start gap-4 px-6 py-4 transition hover:bg-slate-50"
                >
                  <div className="mt-0.5">{STATUS_ICON[item.status]}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        שלב {idx + 1}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {ITEM_KIND_LABEL[item.templateItem.kind]}
                      </span>
                      {!canAct && (
                        <span
                          title="נדרשת רמת הרשאה גבוהה יותר"
                          className="inline-flex items-center gap-1 text-xs text-slate-400"
                        >
                          <Lock size={12} />
                          לצפייה בלבד
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {item.templateItem.title}
                    </div>
                    {item.templateItem.description && (
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {item.templateItem.description}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                      <ItemStatusBadge status={item.status} />
                      {item.assignedTo && (
                        <span>מוקצה ל-{item.assignedTo.name}</span>
                      )}
                      {item.completedBy && item.completedAt && (
                        <span>
                          הושלם ע״י {item.completedBy.name} ב-
                          {formatDate(item.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden text-xs text-slate-400 sm:block">
                    {STATUS_LABEL[item.status]}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
