import Link from 'next/link';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ProjectStatusBadge } from '@/components/StatusBadge';
import { Progress } from '@/components/ui/Progress';
import { formatDate, progressPercent } from '@/lib/format';

export default async function AdminProjectsPage() {
  const projects = await db.project.findMany({
    include: {
      customerOrg: true,
      owner: true,
      template: true,
      items: { select: { status: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">פרויקטים</h1>
          <p className="mt-1 text-sm text-slate-500">
            ניהול פרויקטי הטמעה לכל הלקוחות.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={14} />
          פרויקט חדש
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">
            כל הפרויקטים ({projects.length})
          </h2>
        </CardHeader>
        <CardBody className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <Th>שם</Th>
                  <Th>לקוח</Th>
                  <Th>תבנית</Th>
                  <Th>אחראי</Th>
                  <Th>סטטוס</Th>
                  <Th>התקדמות</Th>
                  <Th>תאריך יעד</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => {
                  const completed = p.items.filter(
                    (i) => i.status === 'COMPLETED'
                  ).length;
                  const pct = progressPercent(completed, p.items.length);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <Td>
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-medium text-slate-900 hover:text-brand-700"
                        >
                          {p.name}
                        </Link>
                      </Td>
                      <Td>{p.customerOrg.name}</Td>
                      <Td className="text-slate-500">{p.template.name}</Td>
                      <Td>{p.owner.name}</Td>
                      <Td>
                        <ProjectStatusBadge status={p.status} />
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress value={pct} />
                          </div>
                          <span className="text-xs text-slate-500">
                            {completed}/{p.items.length}
                          </span>
                        </div>
                      </Td>
                      <Td className="text-slate-500">
                        {formatDate(p.targetDate)}
                      </Td>
                    </tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      עדיין לא נוצרו פרויקטים.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-6 py-3 font-medium">{children}</th>;
}

function Td({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-6 py-3 ${className ?? ''}`}>{children}</td>;
}
