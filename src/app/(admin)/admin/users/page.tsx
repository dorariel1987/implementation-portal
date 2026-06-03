import { db } from '@/lib/db';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { roleLabel, formatDateTime } from '@/lib/format';
import { getServerDictionary } from '@/lib/i18n/server';

export default async function AdminUsersPage() {
  const { locale, t } = getServerDictionary();
  const users = await db.user.findMany({
    include: { organization: true },
    orderBy: [{ organization: { name: 'asc' } }, { name: 'asc' }]
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t.adminUsers.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t.adminUsers.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">
            {t.adminUsers.totalUsers(users.length)}
          </h2>
        </CardHeader>
        <CardBody className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">{t.adminUsers.colName}</th>
                  <th className="px-6 py-3 font-medium">{t.adminUsers.colEmail}</th>
                  <th className="px-6 py-3 font-medium">{t.adminUsers.colOrg}</th>
                  <th className="px-6 py-3 font-medium">{t.adminUsers.colRole}</th>
                  <th className="px-6 py-3 font-medium">{t.adminUsers.colStatus}</th>
                  <th className="px-6 py-3 font-medium">
                    {t.adminUsers.colLastLogin}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {u.name}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {u.organization.name}
                      <span className="ms-2 text-xs text-slate-400">
                        (
                        {u.organization.type === 'VENDOR'
                          ? t.adminUsers.vendor
                          : t.adminUsers.customer}
                        )
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Badge className="border-brand-200 bg-brand-50 text-brand-700">
                        {roleLabel(u.role, locale)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        className={
                          u.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                        }
                      >
                        {u.isActive ? t.adminUsers.active : t.adminUsers.inactive}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {formatDateTime(u.lastLoginAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
