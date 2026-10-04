import bcrypt from 'bcrypt';
import { db } from '../config/db.js';
import { publicUserSelect } from './authService.js';
import { HttpError } from '../utils/errors.js';
import { flushEvents } from '../sockets/events.js';
export async function updateProfile(
  id: string,
  input: { name: string; email: string },
) {
  return {
    user: await db.user.update({
      where: { id },
      data: input,
      select: publicUserSelect,
    }),
  };
}
export async function changePassword(
  id: string,
  currentPassword: string,
  password: string,
) {
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new HttpError(400, 'Current password is incorrect.');
  const passwordHash = await bcrypt.hash(password, 12);
  const changed = await db.user.updateMany({
    where: { id, passwordHash: user.passwordHash },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
  if (!changed.count)
    throw new HttpError(
      409,
      'Your password changed in another session. Sign in again.',
    );
  await flushEvents([
    { room: `user:${id}`, name: 'session:revoked', data: {} },
  ]);
  return { success: true };
}
