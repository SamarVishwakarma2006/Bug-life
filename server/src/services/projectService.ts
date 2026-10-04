import type { Role } from '@prisma/client';
import type { z } from 'zod';
import { db } from '../config/db.js';
import { HttpError } from '../utils/errors.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { inProject, memberUser } from './projectAccess.js';
import { deleteUploadFiles } from '../utils/uploads.js';
import type { memberSchema, projectSchema } from '../validators/projects.js';

const projectInclude = {
  members: { include: { user: { select: memberUser } } },
  _count: { select: { bugs: true } },
};
export async function list(userId: string) {
  return db.project.findMany({
    where: { members: { some: { userId } } },
    include: projectInclude,
    orderBy: { createdAt: 'desc' },
  });
}
export async function get(userId: string, id: string) {
  const project = await db.project.findFirst({
    where: { id, members: { some: { userId } } },
    include: projectInclude,
  });
  if (!project)
    throw new HttpError(404, 'Project not found or you are not a member.');
  return project;
}
export async function create(
  userId: string,
  input: z.infer<typeof projectSchema>,
) {
  return db.project.create({
    data: {
      ...input,
      ownerId: userId,
      members: { create: { userId, role: 'OWNER' } },
    },
    include: projectInclude,
  });
}
export async function update(
  userId: string,
  id: string,
  input: z.infer<typeof projectSchema>,
) {
  return inProject(userId, id, ['OWNER'], (tx) =>
    tx.project.update({ where: { id }, data: input, include: projectInclude }),
  );
}
export async function remove(userId: string, id: string) {
  const files = await inProject(userId, id, ['OWNER'], async (tx) => {
    const attachments = await tx.attachment.findMany({ where: { bug: { projectId: id } }, select: { path: true } });
    await tx.project.delete({ where: { id } });
    return attachments.map((attachment) => attachment.path);
  });
  await deleteUploadFiles(files);
  return { success: true };
}
export async function members(userId: string, id: string) {
  await requireProjectRole(db, userId, id);
  return db.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: memberUser } },
    orderBy: { id: 'asc' },
  });
}
export async function addMember(
  userId: string,
  id: string,
  input: z.infer<typeof memberSchema>,
) {
  return inProject(userId, id, ['OWNER'], async (tx) => {
    const account = await tx.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (!account)
      throw new HttpError(
        404,
        'No registered account has that email. Ask your teammate to register first.',
      );
    const existing = await tx.projectMember.findUnique({
      where: { userId_projectId: { userId: account.id, projectId: id } },
    });
    if (existing)
      throw new HttpError(409, 'This user is already a project member.');
    return tx.projectMember.create({
      data: { projectId: id, userId: account.id, role: input.role },
      include: { user: { select: memberUser } },
    });
  });
}
export async function changeMember(
  userId: string,
  id: string,
  targetId: string,
  role: Exclude<Role, 'OWNER'> | null,
) {
  return inProject(userId, id, ['OWNER'], async (tx) => {
    const where = { userId_projectId: { userId: targetId, projectId: id } };
    const member = await tx.projectMember.findUnique({ where });
    if (!member) throw new HttpError(404, 'Member not found.');
    if (member.role === 'OWNER')
      throw new HttpError(
        400,
        'The project owner cannot be removed or demoted.',
      );
    if (role)
      return tx.projectMember.update({
        where,
        data: { role },
        include: { user: { select: memberUser } },
      });
    const assigned = await tx.bug.findMany({
      where: { projectId: id, assigneeId: targetId },
      select: { id: true },
    });
    await tx.bug.updateMany({
      where: { projectId: id, assigneeId: targetId },
      data: { assigneeId: null },
    });
    if (assigned.length)
      await tx.activity.createMany({
        data: assigned.map((bug) => ({
          bugId: bug.id,
          actorId: userId,
          type: 'ASSIGNED',
          metadata: {
            from: targetId,
            to: null,
            reason: 'Member removed from project',
          },
        })),
      });
    await tx.projectMember.delete({ where });
    return { success: true };
  });
}
export async function activity(userId: string, id: string) {
  await requireProjectRole(db, userId, id);
  return db.activity.findMany({
    where: { bug: { projectId: id } },
    include: {
      actor: { select: memberUser },
      bug: { select: { id: true, number: true, title: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 200,
  });
}
