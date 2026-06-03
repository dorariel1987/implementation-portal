import { z } from 'zod';

// Centralized, validated environment configuration. Importing `env` anywhere on
// the server guarantees the process is correctly configured, and surfaces a
// single clear error instead of cryptic failures deep in a request.

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  AUTH_SECRET: z
    .string()
    .min(32, 'AUTH_SECRET must be at least 32 characters long'),
  SESSION_MAX_AGE_HOURS: z.coerce.number().positive().default(12),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development')
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.errors
      .map((e) => `  - ${e.path.join('.') || '(root)'}: ${e.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration:\n${issues}\n` +
        'See .env.example for the required variables.'
    );
  }
  cached = parsed.data;
  return cached;
}

export function getSessionMaxAgeSeconds(): number {
  return Math.max(1, Math.floor(getEnv().SESSION_MAX_AGE_HOURS * 3600));
}
