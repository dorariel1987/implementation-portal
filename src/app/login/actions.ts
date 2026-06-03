'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticateCredentials } from '@/lib/authenticate';
import { loginSchema } from '@/lib/validation';

export type LoginState = {
  error?: string;
  email?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? '')
  };

  let parsed;
  try {
    parsed = loginSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: err.errors[0]?.message ?? 'נתונים לא תקינים',
        email: raw.email
      };
    }
    throw err;
  }

  const result = await authenticateCredentials(parsed.email, parsed.password, {
    via: 'web'
  });

  if (!result.ok) {
    return { error: result.message, email: parsed.email };
  }

  const next = String(formData.get('next') ?? '/dashboard');
  redirect(next.startsWith('/') ? next : '/dashboard');
}
