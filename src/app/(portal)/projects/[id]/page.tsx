import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  Lock,
  PauseCircle,
  ArrowLeft,
  ArrowRight
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
import { formatDate, itemKindLabel, progressPercent, statusLabel } from '@/lib/format';
import { getServerDictionary } from '@/lib/i18n/server';
import { direction } from '@/lib/i18n/config';

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
  const { locale, t } = getServerDictionary();
  const isRtl = direction(locale) === 'rtl';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const ForwardArrow = isRtl ? ArrowLeft : ArrowRight;

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
        <BackArrow size={14} />
        {t.common.backToDashboard}
      </Link>

      <Card>
        <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              {project.customerOrg.name} · {t.project.templatePrefix(project.template.name)}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {project.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{t.project.owner(project.owner.name)}</span>
              <span>·</span>
              <span>{t.project.targetDate(formatDate(project.targetDate, locale))}</span>
              <span>·</span>
              <span>{t.project.created(formatDate(project.createdAt, locale))}</span>
            </div>
          </div>
          <ProjectStatusBadge status={project.status} locale={locale} />
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {t.project.tasksCompletedOf(completed, project.items.length)}
            </span>
            <span className="font-medium text-slate-900">{pct}%</span>
          </div>
          <Progress value={pct} className="h-3" />
          {firstActionable && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
              <div>
                <div className="text-xs text-brand-700">{t.project.nextStep}</div>
                <div className="text-sm font-medium text-slate-900">
                  {firstActionable.templateItem.title}
                </div>
              </div>
              <Link
                href={`/projects/${project.id}/items/${firstActionable.id}`}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {t.common.continue}
                <ForwardArrow size={14} />
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">
            {t.project.guidedChecklist}
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
                        {t.project.step(idx + 1)}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {itemKindLabel(item.templateItem.kind, locale)}
                      </span>
                      {!canAct && (
                        <span
                          title={t.project.requiresHigherRole}
                          className="inline-flex items-center gap-1 text-xs text-slate-400"
                        >
                          <Lock size={12} />
                          {t.project.viewOnly}
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
                      <ItemStatusBadge status={item.status} locale={locale} />
                      {item.assignedTo && (
                        <span>{t.project.assignedTo(item.assignedTo.name)}</span>
                      )}
                      {item.completedBy && item.completedAt && (
                        <span>
                          {t.project.completedBy(
                            item.completedBy.name,
                            formatDate(item.completedAt, locale)
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden text-xs text-slate-400 sm:block">
                    {statusLabel(item.status, locale)}
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
