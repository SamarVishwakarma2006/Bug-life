import type { Prisma } from '@prisma/client';
import { queueEvent } from '../sockets/events.js';
export async function notify(
  tx: Prisma.TransactionClient,
  actorId: string,
  recipients: (string | null)[],
  bugId: string,
  type: string,
  message: string,
) {
  const users = [
    ...new Set(recipients.filter((id): id is string => !!id && id !== actorId)),
  ];
  const members = await tx.projectMember.findMany({
    where: {
      userId: { in: users },
      project: { bugs: { some: { id: bugId } } },
    },
    select: { userId: true },
  });
  for (const { userId } of members) {
    const notification = await tx.notification.create({
      data: { userId, bugId, type, message },
    });
    queueEvent(tx, {
      room: `user:${userId}`,
      name: 'notification:new',
      data: notification,
    });
  }
}
