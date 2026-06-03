import { db } from '@/lib/db';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABEL_HE, formatDateTime } from '@/lib/format';

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    include: { organization: true },
    orderBy: [{ organization: { name: 'asc' } }, { name: 'asc' }]
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">משתמשים</h1>
        <p className="mt-1 text-sm text-slate-500">
          כל החשבונות הקיימים — של ספק ושל לקוחות.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">
            סך הכל {users.length} משתמשים
          </h2>
        </CardHeader>
        <CardBody className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">שם</th>
                  <th className="px-6 py-3 font-medium">מייל</th>
                  <th className="px-6 py-3 font-medium">ארגון</th>
                  <th className="px-6 py-3 font-medium">תפקיד</th>
                  <th className="px-6 py-3 font-medium">סטטוס</th>
                  <th className="px-6 py-3 font-medium">כניסה אחרונה</th>
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
                        ({u.organization.type === 'VENDOR' ? 'ספק' : 'לקוח'})
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Badge className="border-brand-200 bg-brand-50 text-brand-700">
                        {ROLE_LABEL_HE[u.role]}
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
                        {u.isActive ? 'פעיל' : 'מושבת'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {formatDateTime(u.lastLoginAt)}
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
