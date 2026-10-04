import { db } from '../config/db.js';
import { HttpError } from '../utils/errors.js';
import { flushEvents } from '../sockets/events.js';
export async function list(userId: string) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
export async function read(userId: string, id?: string) {
  const result = await db.notification.updateMany({
    where: { userId, ...(id ? { id } : { read: false }) },
    data: { read: true },
  });
  if (id && !result.count) throw new HttpError(404, 'Notification not found.');
  await flushEvents([
    { room: `user:${userId}`, name: 'notification:read', data: { id } },
  ]);
  return { success: true };
}
