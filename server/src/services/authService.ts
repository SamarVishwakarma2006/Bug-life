import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { db } from '../config/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
import type { registerSchema, loginSchema } from '../validators/auth.js';

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  xp: true,
  level: true,
  currentStreak: true,
  longestStreak: true,
  lastResolvedAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const tokenFor = (id: string, version: number) =>
  jwt.sign({ version }, env.JWT_SECRET, {
    subject: id,
    algorithm: 'HS256',
    expiresIn: '7d',
    issuer: 'buglife',
    audience: 'buglife-client',
  });
// Equal-cost comparison also runs for unknown emails.
const dummyHash = await bcrypt.hash('unused-password-for-timing', 12);

export async function register(input: z.infer<typeof registerSchema>) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await db.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: publicUserSelect,
  });
  return { user, token: tokenFor(user.id, 0) };
}

export async function login(input: z.infer<typeof loginSchema>) {
  const account = await db.user.findUnique({ where: { email: input.email } });
  const valid = await bcrypt.compare(
    input.password,
    account?.passwordHash ?? dummyHash,
  );
  if (!account || !valid)
    throw new HttpError(401, 'Invalid email or password.');
  const user = await getMe(account.id);
  return { user, token: tokenFor(account.id, account.tokenVersion) };
}

export async function getMe(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
  if (!user)
    throw new HttpError(
      401,
      'Your account is no longer available. Please sign in again.',
    );
  return user;
}
