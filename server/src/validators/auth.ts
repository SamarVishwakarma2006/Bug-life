import { z } from 'zod';

const email = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
// bcrypt only uses the first 72 bytes; reject longer passwords instead of truncating.
const password = z
  .string()
  .min(8)
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Password must be at most 72 UTF-8 bytes',
  );
export const registerSchema = z
  .object({ name: z.string().trim().min(2).max(80), email, password })
  .strict();
export const loginSchema = z
  .object({
    email,
    password: z
      .string()
      .min(1)
      .max(200)
      .refine(
        (value) => Buffer.byteLength(value, 'utf8') <= 72,
        'Password must be at most 72 UTF-8 bytes',
      ),
  })
  .strict();
