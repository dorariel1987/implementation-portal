'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldWrap, Select, TextInput } from '@/components/ui/Field';
import { getDictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';
import { createProject, type CreateProjectState } from './actions';

const initial: CreateProjectState = {};

interface Props {
  locale: Locale;
  customers: { id: string; name: string }[];
  templates: { id: string; name: string; itemCount: number }[];
  owners: { id: string; name: string; email: string }[];
}

export function NewProjectForm({ locale, customers, templates, owners }: Props) {
  const [state, formAction] = useFormState(createProject, initial);
  const t = getDictionary(locale).newProject;

  return (
    <form action={formAction} className="space-y-5">
      <FieldWrap label={t.projectName} htmlFor="name">
        <TextInput
          id="name"
          name="name"
          placeholder={t.projectNamePlaceholder}
          required
        />
      </FieldWrap>

      <div className="grid gap-5 md:grid-cols-2">
        <FieldWrap label={t.customerOrg} htmlFor="customerOrgId">
          <Select id="customerOrgId" name="customerOrgId" required>
            <option value="">{t.selectCustomer}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FieldWrap>

        <FieldWrap label={t.template} htmlFor="templateId">
          <Select id="templateId" name="templateId" required>
            <option value="">{t.selectTemplate}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({t.stepsCount(tpl.itemCount)})
              </option>
            ))}
          </Select>
        </FieldWrap>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FieldWrap label={t.implementer} htmlFor="ownerId">
          <Select id="ownerId" name="ownerId" required>
            <option value="">{t.selectOwner}</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.email})
              </option>
            ))}
          </Select>
        </FieldWrap>

        <FieldWrap label={t.targetDate} htmlFor="targetDate">
          <TextInput id="targetDate" name="targetDate" type="date" />
        </FieldWrap>
      </div>

      {state.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <SubmitButton labels={{ creating: t.creating, create: t.create }} />
    </form>
  );
}

function SubmitButton({
  labels
}: {
  labels: { creating: string; create: string };
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      <Sparkles size={14} />
      {pending ? labels.creating : labels.create}
    </Button>
  );
}
