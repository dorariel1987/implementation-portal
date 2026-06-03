import Link from 'next/link';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ProjectStatusBadge } from '@/components/StatusBadge';
import { Progress } from '@/components/ui/Progress';
import { formatDate, progressPercent } from '@/lib/format';
import { getServerDictionary } from '@/lib/i18n/server';

export default async function AdminProjectsPage() {
  const { locale, t } = getServerDictionary();
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
          <h1 className="text-2xl font-semibold text-slate-900">
            {t.adminProjects.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.adminProjects.subtitle}
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={14} />
          {t.adminProjects.newProject}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">
            {t.adminProjects.allProjects(projects.length)}
          </h2>
        </CardHeader>
        <CardBody className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <Th>{t.adminProjects.colName}</Th>
                  <Th>{t.adminProjects.colClient}</Th>
                  <Th>{t.adminProjects.colTemplate}</Th>
                  <Th>{t.adminProjects.colOwner}</Th>
                  <Th>{t.adminProjects.colStatus}</Th>
                  <Th>{t.adminProjects.colProgress}</Th>
                  <Th>{t.adminProjects.colTargetDate}</Th>
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
                        <ProjectStatusBadge status={p.status} locale={locale} />
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
                        {formatDate(p.targetDate, locale)}
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
                      {t.adminProjects.empty}
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
