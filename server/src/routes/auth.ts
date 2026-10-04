import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { loginSchema, registerSchema } from '../validators/auth.js';
import { profile } from '../services/statsService.js';
import { z } from 'zod';
import { updateProfile, changePassword } from '../services/accountService.js';

export const authRouter = Router();
authRouter.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  controller.register,
);
authRouter.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  controller.login,
);
authRouter.get('/me', auth, controller.me);
authRouter.patch('/me', auth, async (req, res) => {
  const input = z
    .object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(254).toLowerCase(),
    })
    .strict()
    .parse(req.body);
  res.json(await updateProfile(res.locals.userId as string, input));
});
authRouter.patch('/password', auth, authRateLimit, async (req, res) => {
  const input = z
    .object({
      currentPassword: z
        .string()
        .min(1)
        .refine((value) => Buffer.byteLength(value) <= 72),
      password: z
        .string()
        .min(8)
        .refine(
          (value) => Buffer.byteLength(value) <= 72,
          'Password must be at most 72 UTF-8 bytes.',
        ),
    })
    .strict()
    .parse(req.body);
  res.json(
    await changePassword(
      res.locals.userId as string,
      input.currentPassword,
      input.password,
    ),
  );
});
authRouter.get('/profile', auth, async (_req, res) => {
  res.json(await profile(res.locals.userId as string));
});
