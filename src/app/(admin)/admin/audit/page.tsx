import { Activity, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Field';
import { formatDateTime } from '@/lib/format';

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: 'התחברות',
  USER_LOGIN_FAILED: 'ניסיון התחברות שנכשל',
  USER_LOGOUT: 'התנתקות',
  USER_CREATED: 'משתמש נוצר',
  USER_UPDATED: 'משתמש עודכן',
  USER_DEACTIVATED: 'משתמש הושבת',
  PROJECT_CREATED: 'פרויקט נוצר',
  PROJECT_UPDATED: 'פרויקט עודכן',
  PROJECT_STATUS_CHANGED: 'סטטוס פרויקט שונה',
  PROJECT_DELETED: 'פרויקט נמחק',
  ITEM_STATUS_CHANGED: 'סטטוס משימה שונה',
  ITEM_COMPLETED: 'משימה הושלמה',
  ITEM_ASSIGNED: 'משימה הוקצתה',
  ITEM_APPROVED: 'משימה אושרה',
  ITEM_NOTE_ADDED: 'הערה נוספה',
  TEMPLATE_CREATED: 'תבנית נוצרה',
  TEMPLATE_UPDATED: 'תבנית עודכנה',
  PERMISSION_DENIED: 'הרשאה נדחתה'
};

const ACTION_TONE: Record<string, string> = {
  USER_LOGIN_FAILED: 'border-rose-200 bg-rose-50 text-rose-700',
  PERMISSION_DENIED: 'border-rose-200 bg-rose-50 text-rose-700',
  ITEM_COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PROJECT_CREATED: 'border-brand-200 bg-brand-50 text-brand-700'
};

interface Props {
  searchParams: { page?: string; action?: string };
}

export default async function AuditPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const action = searchParams.action || undefined;

  const where = action ? { action } : {};
  const [total, events, distinctActions] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: true }
    }),
    db.auditLog.findMany({
      distinct: ['action'],
      select: { action: true }
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Activity size={20} />
            יומן ביקורת
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            רישום append-only של כל פעולה רגישה במערכת.
          </p>
        </div>
        <form className="flex items-end gap-2">
          <div className="w-56">
            <Select name="action" defaultValue={action ?? ''}>
              <option value="">כל הפעולות</option>
              {distinctActions
                .map((a) => a.action)
                .sort()
                .map((a) => (
                  <option key={a} value={a}>
                    {ACTION_LABELS[a] ?? a}
                  </option>
                ))}
            </Select>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            סנן
          </button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">
            {total.toLocaleString('he-IL')} אירועים
            {action && (
              <span className="text-slate-500">
                {' '}
                · מסונן לפי {ACTION_LABELS[action] ?? action}
              </span>
            )}
          </h2>
        </CardHeader>
        <CardBody className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">תאריך</th>
                  <th className="px-6 py-3 font-medium">פעולה</th>
                  <th className="px-6 py-3 font-medium">מבצע</th>
                  <th className="px-6 py-3 font-medium">משאב</th>
                  <th className="px-6 py-3 font-medium">פרטים</th>
                  <th className="px-6 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((e) => {
                  let metadata: Record<string, unknown> | null = null;
                  if (e.metadata) {
                    try {
                      metadata = JSON.parse(e.metadata);
                    } catch {
                      metadata = null;
                    }
                  }
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(e.occurredAt)}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          className={
                            ACTION_TONE[e.action] ??
                            'border-slate-200 bg-slate-50 text-slate-700'
                          }
                        >
                          {ACTION_LABELS[e.action] ?? e.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {e.actor?.name ?? e.actorEmail ?? 'אנונימי'}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {e.resourceType}
                        {e.resourceId && (
                          <span className="ms-1 font-mono text-xs text-slate-400">
                            #{e.resourceId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {metadata ? (
                          <code className="block max-w-md truncate font-mono text-xs">
                            {JSON.stringify(metadata)}
                          </code>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-400">
                        {e.ipAddress ?? '—'}
                      </td>
                    </tr>
                  );
                })}
                {events.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      אין אירועים תואמים.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            עמוד {page} מתוך {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/audit?page=${page - 1}${
                  action ? `&action=${action}` : ''
                }`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
              >
                <ArrowRight size={14} />
                הקודם
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/audit?page=${page + 1}${
                  action ? `&action=${action}` : ''
                }`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
              >
                הבא
                <ArrowLeft size={14} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
