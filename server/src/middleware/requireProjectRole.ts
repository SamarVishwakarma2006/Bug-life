import type { Prisma, Role } from '@prisma/client';
import { HttpError } from '../utils/errors.js';

export async function requireProjectRole(
  tx: Prisma.TransactionClient,
  userId: string,
  projectId: string,
  roles?: Role[],
) {
  const membership = await tx.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  if (!membership)
    throw new HttpError(404, 'Project not found or you are not a member.');
  if (roles && !roles.includes(membership.role))
    throw new HttpError(403, 'Your project role does not allow this action.');
  return membership;
}
