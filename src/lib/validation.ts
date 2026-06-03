import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('כתובת מייל לא תקינה'),
  password: z.string().min(1, 'נדרשת סיסמה')
});

export const createProjectSchema = z.object({
  name: z.string().min(2, 'שם פרויקט קצר מדי').max(120),
  customerOrgId: z.string().min(1, 'יש לבחור ארגון לקוח'),
  templateId: z.string().min(1, 'יש לבחור תבנית'),
  ownerId: z.string().min(1, 'יש לבחור אחראי'),
  targetDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined))
});

export const updateItemStatusSchema = z.object({
  itemId: z.string().min(1),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'SKIPPED']),
  notes: z.string().max(2000).optional(),
  payload: z.string().max(10_000).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateItemStatusInput = z.infer<typeof updateItemStatusSchema>;
