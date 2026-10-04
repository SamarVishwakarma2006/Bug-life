import type { Prisma, Role } from '@prisma/client';
import { db } from '../config/db.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { beginEvents, flushEvents, queueEvent } from '../sockets/events.js';

export async function inProject<T>(
  userId: string,
  projectId: string,
  roles: Role[] | undefined,
  work: (tx: Prisma.TransactionClient, role: Role) => Promise<T>,
): Promise<T> {
  const committed = await db.$transaction(
    async (tx) => {
      // Serialize project writes so membership changes, numbering, and status checks cannot race.
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId} FOR UPDATE`;
      const member = await requireProjectRole(tx, userId, projectId, roles);
      const events = beginEvents(tx);
      const result = await work(tx, member.role);
      queueEvent(tx, {
        room: `project:${projectId}`,
        name: 'project:updated',
        data: { projectId },
      });
      return { result, events };
    },
    { maxWait: 10000, timeout: 15000 },
  );
  await flushEvents(committed.events);
  return committed.result;
}

export const memberUser = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;
