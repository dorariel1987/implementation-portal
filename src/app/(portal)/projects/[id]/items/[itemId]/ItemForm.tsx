'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldWrap, Select, TextArea } from '@/components/ui/Field';
import { statusLabel } from '@/lib/format';
import { getDictionary } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/config';
import { updateItemStatus, type ItemActionState } from './actions';
import { ITEM_STATUSES } from '@/lib/types';

const initial: ItemActionState = {};

interface Props {
  itemId: string;
  currentStatus: string;
  currentNotes: string | null;
  currentPayload: string | null;
  kind: string;
  canAct: boolean;
  locale: Locale;
}

export function ItemForm({
  itemId,
  currentStatus,
  currentNotes,
  currentPayload,
  kind,
  canAct,
  locale
}: Props) {
  const [state, formAction] = useFormState(updateItemStatus, initial);
  const t = getDictionary(locale);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="itemId" value={itemId} />

      <FieldWrap label={t.item.statusLabel} htmlFor="status">
        <Select
          id="status"
          name="status"
          defaultValue={currentStatus}
          disabled={!canAct}
        >
          {ITEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s, locale)}
            </option>
          ))}
        </Select>
      </FieldWrap>

      {(kind === 'FORM' || kind === 'UPLOAD') && (
        <FieldWrap
          label={kind === 'FORM' ? t.item.formContent : t.item.fileLink}
          htmlFor="payload"
          hint={kind === 'FORM' ? t.item.formHint : t.item.uploadHint}
        >
          <TextArea
            id="payload"
            name="payload"
            defaultValue={currentPayload ?? ''}
            disabled={!canAct}
            placeholder={
              kind === 'FORM'
                ? '{"environment":"production","domain":"acme.com"}'
                : 'https://...'
            }
          />
        </FieldWrap>
      )}

      <FieldWrap label={t.item.notes} htmlFor="notes" hint={t.item.notesHint}>
        <TextArea
          id="notes"
          name="notes"
          defaultValue={currentNotes ?? ''}
          disabled={!canAct}
          placeholder={t.item.notesPlaceholder}
        />
      </FieldWrap>

      {state.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <SubmitButton canAct={canAct} labels={{ save: t.item.save, saving: t.item.saving }} />
        {!canAct && (
          <span className="text-xs text-slate-500">{t.item.noPermission}</span>
        )}
      </div>
    </form>
  );
}

function SubmitButton({
  canAct,
  labels
}: {
  canAct: boolean;
  labels: { save: string; saving: string };
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={!canAct || pending}>
      <Save size={14} />
      {pending ? labels.saving : labels.save}
    </Button>
  );
}
