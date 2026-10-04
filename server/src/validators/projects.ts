import { z } from 'zod';
export const projectSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    key: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z][A-Z0-9]{1,7}$/,
        'Use 2–8 letters or digits, starting with a letter.',
      ),
    description: z.string().trim().max(4000).default(''),
  })
  .strict();
export const memberRoleSchema = z
  .object({ role: z.enum(['DEVELOPER', 'REVIEWER']) })
  .strict();
export const memberSchema = memberRoleSchema
  .extend({ email: z.string().trim().email().max(254).toLowerCase() })
  .strict();
export const idSchema = z.string().cuid();
