'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldWrap, Select, TextArea } from '@/components/ui/Field';
import { STATUS_LABEL } from '@/lib/format';
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
}

export function ItemForm({
  itemId,
  currentStatus,
  currentNotes,
  currentPayload,
  kind,
  canAct
}: Props) {
  const [state, formAction] = useFormState(updateItemStatus, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="itemId" value={itemId} />

      <FieldWrap label="סטטוס" htmlFor="status">
        <Select
          id="status"
          name="status"
          defaultValue={currentStatus}
          disabled={!canAct}
        >
          {ITEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s] ?? s}
            </option>
          ))}
        </Select>
      </FieldWrap>

      {(kind === 'FORM' || kind === 'UPLOAD') && (
        <FieldWrap
          label={kind === 'FORM' ? 'תוכן הטופס' : 'קישור / שם קובץ'}
          htmlFor="payload"
          hint={
            kind === 'FORM'
              ? 'מלאו כאן את המידע שנדרש לשלב הזה (פורמט חופשי או JSON).'
              : 'במצב דמו: הדביקו URL לקובץ או שם קובץ.'
          }
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

      <FieldWrap label="הערות" htmlFor="notes" hint="מתועד ב-audit trail.">
        <TextArea
          id="notes"
          name="notes"
          defaultValue={currentNotes ?? ''}
          disabled={!canAct}
          placeholder="הוסיפו הערה אופציונלית…"
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
        <SubmitButton canAct={canAct} />
        {!canAct && (
          <span className="text-xs text-slate-500">
            אין לכם הרשאה לעדכן שלב זה.
          </span>
        )}
      </div>
    </form>
  );
}

function SubmitButton({ canAct }: { canAct: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={!canAct || pending}>
      <Save size={14} />
      {pending ? 'שומר…' : 'שמור והמשך'}
    </Button>
  );
}
