'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldWrap, TextInput } from '@/components/ui/Field';
import { loginAction, type LoginState } from './actions';

const initial: LoginState = {};

interface Labels {
  email: string;
  password: string;
  signIn: string;
  signingIn: string;
}

interface Props {
  next?: string;
  initialEmail?: string;
  labels: Labels;
}

export function LoginForm({ next, initialEmail, labels }: Props) {
  const [state, formAction] = useFormState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <FieldWrap label={labels.email} htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email ?? initialEmail ?? ''}
          placeholder="name@company.com"
        />
      </FieldWrap>
      <FieldWrap label={labels.password} htmlFor="password">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </FieldWrap>
      {state.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <SubmitButton labels={labels} />
    </form>
  );
}

function SubmitButton({ labels }: { labels: Labels }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <LogIn size={16} />
      {pending ? labels.signingIn : labels.signIn}
    </Button>
  );
}
