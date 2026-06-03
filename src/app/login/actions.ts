'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { authenticateCredentials } from '@/lib/authenticate';
import { loginSchema } from '@/lib/validation';
import { getServerDictionary } from '@/lib/i18n/server';

export type LoginState = {
  error?: string;
  email?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const { t } = getServerDictionary();

  const raw = {
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    password: String(formData.get('password') ?? '')
  };

  let parsed;
  try {
    parsed = loginSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: t.login.invalidData, email: raw.email };
    }
    throw err;
  }

  const result = await authenticateCredentials(parsed.email, parsed.password, {
    via: 'web'
  });

  if (!result.ok) {
    const message =
      result.code === 'RATE_LIMITED'
        ? t.login.errorRateLimited
        : t.login.errorInvalidCredentials;
    return { error: message, email: parsed.email };
  }

  const next = String(formData.get('next') ?? '/dashboard');
  redirect(next.startsWith('/') ? next : '/dashboard');
}
