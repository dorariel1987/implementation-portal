import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Info, Lock } from 'lucide-react';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { isVendor, meetsRoleRequirement } from '@/lib/rbac';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ItemStatusBadge } from '@/components/StatusBadge';
import { formatDateTime, itemKindLabel, roleLabel } from '@/lib/format';
import { getServerDictionary } from '@/lib/i18n/server';
import { direction } from '@/lib/i18n/config';
import { ItemForm } from './ItemForm';

export default async function ItemPage({
  params
}: {
  params: { id: string; itemId: string };
}) {
  const user = await requireUser();
  const { locale, t } = getServerDictionary();
  const isRtl = direction(locale) === 'rtl';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  const ForwardArrow = isRtl ? ArrowLeft : ArrowRight;

  const item = await db.projectChecklistItem.findUnique({
    where: { id: params.itemId },
    include: {
      project: { include: { customerOrg: true } },
      templateItem: true,
      assignedTo: true,
      completedBy: true
    }
  });

  if (!item || item.projectId !== params.id) notFound();
  if (
    !isVendor(user.role) &&
    item.project.customerOrgId !== user.organizationId
  ) {
    notFound();
  }

  const allItems = await db.projectChecklistItem.findMany({
    where: { projectId: item.projectId },
    orderBy: { order: 'asc' },
    select: { id: true, order: true }
  });
  const idx = allItems.findIndex((i) => i.id === item.id);
  const prev = idx > 0 ? allItems[idx - 1] : null;
  const next = idx < allItems.length - 1 ? allItems[idx + 1] : null;

  const canAct = meetsRoleRequirement(
    user.role,
    item.templateItem.requiredRole
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/projects/${item.projectId}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <BackArrow size={14} />
        {t.item.backToProject(item.project.name)}
      </Link>

      <Card>
        <CardHeader className="flex-col items-start gap-4 sm:flex-row">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{t.item.stepOf(idx + 1, allItems.length)}</span>
              <span>·</span>
              <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                {itemKindLabel(item.templateItem.kind, locale)}
              </Badge>
              {item.templateItem.requiredRole && (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                  <Lock size={10} />
                  {roleLabel(item.templateItem.requiredRole, locale)}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              {item.templateItem.title}
            </h1>
          </div>
          <ItemStatusBadge status={item.status} locale={locale} />
        </CardHeader>
        <CardBody className="space-y-4">
          {item.templateItem.description && (
            <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
              <p className="whitespace-pre-wrap leading-relaxed">
                {item.templateItem.description}
              </p>
            </div>
          )}

          <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
            <Meta label={t.item.client} value={item.project.customerOrg.name} />
            <Meta
              label={t.item.assignedTo}
              value={item.assignedTo?.name ?? t.item.notAssigned}
            />
            <Meta
              label={t.item.lastUpdated}
              value={formatDateTime(item.updatedAt, locale)}
            />
          </div>

          {item.completedAt && item.completedBy && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {t.item.completedBanner(
                item.completedBy.name,
                formatDateTime(item.completedAt, locale)
              )}
            </div>
          )}

          <ItemForm
            itemId={item.id}
            currentStatus={item.status}
            currentNotes={item.notes}
            currentPayload={item.payload}
            kind={item.templateItem.kind}
            canAct={canAct}
            locale={locale}
          />
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        {prev ? (
          <Link
            href={`/projects/${item.projectId}/items/${prev.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <BackArrow size={14} />
            {t.item.prevStep}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/projects/${item.projectId}/items/${next.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            {t.item.nextStep}
            <ForwardArrow size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  );
}
