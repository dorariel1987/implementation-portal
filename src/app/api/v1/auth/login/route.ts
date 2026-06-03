import type { NextRequest } from 'next/server';
import { authenticateCredentials } from '@/lib/authenticate';
import { getSessionMaxAgeSeconds } from '@/lib/env';
import { handle, jsonError, jsonOk, parseJsonBody } from '@/lib/api';
import { loginSchema } from '@/lib/validation';

export const POST = handle(async (req: NextRequest) => {
  const input = await parseJsonBody(req, loginSchema);

  const result = await authenticateCredentials(input.email, input.password, {
    via: 'rest'
  });

  if (!result.ok) {
    if (result.code === 'RATE_LIMITED') {
      const res = jsonError('RATE_LIMITED', result.message, 429);
      if (result.retryAfterSeconds) {
        res.headers.set('Retry-After', String(result.retryAfterSeconds));
      }
      return res;
    }
    return jsonError('INVALID_CREDENTIALS', result.message, 401);
  }

  return jsonOk({
    token: result.token,
    tokenType: 'Bearer',
    expiresIn: getSessionMaxAgeSeconds(),
    user: result.user
  });
});
