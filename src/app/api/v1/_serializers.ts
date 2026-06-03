// Internal (underscore-prefixed dirs are not routable in Next App Router) module
// holding pure serialization helpers shared by API routes. Keeping this here
// keeps the route handlers lean and the wire format consistent.

interface ProjectWithItems {
  id: string;
  name: string;
  status: string;
  customerOrgId: string;
  ownerId: string;
  templateId: string;
  startDate: Date | null;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customerOrg: { id: string; name: string; type: string };
  owner: { id: string; name: string; email: string };
  template: { id: string; name: string };
  items: { status: string }[];
}

export function serializeProjectSummary(p: ProjectWithItems) {
  const total = p.items.length;
  const completed = p.items.filter((i) => i.status === 'COMPLETED').length;
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    startDate: p.startDate,
    targetDate: p.targetDate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    customerOrg: p.customerOrg,
    owner: p.owner,
    template: p.template,
    progress: {
      total,
      completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100)
    }
  };
}

interface ProjectItemFull {
  id: string;
  projectId: string;
  templateItemId: string;
  order: number;
  status: string;
  assignedToId: string | null;
  completedById: string | null;
  completedAt: Date | null;
  payload: string | null;
  notes: string | null;
  updatedAt: Date;
  templateItem: {
    id: string;
    title: string;
    description: string | null;
    kind: string;
    requiredRole: string | null;
  };
  assignedTo: { id: string; name: string; email: string } | null;
  completedBy: { id: string; name: string; email: string } | null;
}

export function serializeChecklistItem(i: ProjectItemFull) {
  return {
    id: i.id,
    projectId: i.projectId,
    order: i.order,
    status: i.status,
    title: i.templateItem.title,
    description: i.templateItem.description,
    kind: i.templateItem.kind,
    requiredRole: i.templateItem.requiredRole,
    assignedTo: i.assignedTo,
    completedBy: i.completedBy,
    completedAt: i.completedAt,
    payload: i.payload,
    notes: i.notes,
    updatedAt: i.updatedAt
  };
}
