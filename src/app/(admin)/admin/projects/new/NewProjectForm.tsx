'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldWrap, Select, TextInput } from '@/components/ui/Field';
import { createProject, type CreateProjectState } from './actions';

const initial: CreateProjectState = {};

interface Props {
  customers: { id: string; name: string }[];
  templates: { id: string; name: string; itemCount: number }[];
  owners: { id: string; name: string; email: string }[];
}

export function NewProjectForm({ customers, templates, owners }: Props) {
  const [state, formAction] = useFormState(createProject, initial);

  return (
    <form action={formAction} className="space-y-5">
      <FieldWrap label="שם הפרויקט" htmlFor="name">
        <TextInput
          id="name"
          name="name"
          placeholder="למשל: הטמעת Acme – Q4"
          required
        />
      </FieldWrap>

      <div className="grid gap-5 md:grid-cols-2">
        <FieldWrap label="ארגון לקוח" htmlFor="customerOrgId">
          <Select id="customerOrgId" name="customerOrgId" required>
            <option value="">בחרו לקוח…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FieldWrap>

        <FieldWrap label="תבנית checklist" htmlFor="templateId">
          <Select id="templateId" name="templateId" required>
            <option value="">בחרו תבנית…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.itemCount} שלבים)
              </option>
            ))}
          </Select>
        </FieldWrap>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FieldWrap label="אחראי הטמעה (פנימי)" htmlFor="ownerId">
          <Select id="ownerId" name="ownerId" required>
            <option value="">בחרו אחראי…</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.email})
              </option>
            ))}
          </Select>
        </FieldWrap>

        <FieldWrap label="תאריך יעד" htmlFor="targetDate">
          <TextInput id="targetDate" name="targetDate" type="date" />
        </FieldWrap>
      </div>

      {state.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      <Sparkles size={14} />
      {pending ? 'יוצר…' : 'צור פרויקט'}
    </Button>
  );
}
