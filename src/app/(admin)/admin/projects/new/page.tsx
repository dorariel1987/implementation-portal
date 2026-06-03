import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { NewProjectForm } from './NewProjectForm';

export default async function NewProjectPage() {
  const [customers, templates, owners] = await Promise.all([
    db.organization.findMany({
      where: { type: 'CUSTOMER' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    }),
    db.checklistTemplate.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true } } }
    }),
    db.user.findMany({
      where: {
        isActive: true,
        role: { in: ['OWNER', 'IMPLEMENTER'] }
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        חזרה לרשימת הפרויקטים
      </Link>

      <Card>
        <CardHeader>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              פרויקט הטמעה חדש
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              בחרו לקוח ותבנית checklist — נייצר עבורכם את כל השלבים אוטומטית.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <NewProjectForm
            customers={customers}
            templates={templates.map((t) => ({
              id: t.id,
              name: t.name,
              itemCount: t._count.items
            }))}
            owners={owners}
          />
        </CardBody>
      </Card>
    </div>
  );
}
