import type { BugStatus, Prisma, Role } from '@prisma/client';
import { db } from '../config/db.js';
import { HttpError } from '../utils/errors.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { inProject, memberUser } from './projectAccess.js';
import { notify } from './notificationService.js';
import type { BugInput, BugEdit, BugFilters } from '../validators/bugs.js';
import { queueEvent } from '../sockets/events.js';
import { awardXP } from './xpService.js';
import { deleteUploadFiles } from '../utils/uploads.js';

export const transitions: Record<BugStatus, BugStatus[]> = {
  BACKLOG: ['TODO'],
  TODO: ['IN_PROGRESS', 'BACKLOG'],
  IN_PROGRESS: ['REVIEW', 'TODO'],
  REVIEW: ['RESOLVED', 'REOPENED', 'IN_PROGRESS'],
  RESOLVED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS'],
};
const include = {
  reporter: { select: memberUser },
  assignee: { select: memberUser },
  project: { select: { id: true, key: true, name: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.BugInclude;
type LockedBug = Prisma.BugGetPayload<{ include: typeof include }>;

async function withBug<T>(
  actor: string,
  id: string,
  work: (
    tx: Prisma.TransactionClient,
    bug: LockedBug,
    role: Role,
  ) => Promise<T>,
) {
  const existing = await db.bug.findFirst({
    where: { id, project: { members: { some: { userId: actor } } } },
    select: { projectId: true },
  });
  if (!existing)
    throw new HttpError(404, 'Bug not found or you do not have access.');
  return inProject(actor, existing.projectId, undefined, async (tx, role) => {
    const bug = await tx.bug.findUnique({ where: { id }, include });
    if (!bug) throw new HttpError(404, 'Bug not found.');
    return work(tx, bug, role);
  });
}
async function validateAssignee(
  tx: Prisma.TransactionClient,
  projectId: string,
  assigneeId: string | null | undefined,
) {
  if (
    assigneeId &&
    !(await tx.projectMember.findUnique({
      where: { userId_projectId: { userId: assigneeId, projectId } },
    }))
  )
    throw new HttpError(400, 'The assignee must be a member of this project.');
}
async function audit(
  tx: Prisma.TransactionClient,
  bugId: string,
  actorId: string,
  type: string,
  metadata: Prisma.InputJsonObject,
) {
  await tx.activity.create({ data: { bugId, actorId, type, metadata } });
  const bug = await tx.bug.findUniqueOrThrow({ where: { id: bugId }, include });
  const name =
    type === 'CREATED'
      ? 'bug:created'
      : type === 'ASSIGNED'
        ? 'bug:assigned'
        : type === 'REOPENED'
          ? 'bug:reopened'
          : type === 'MOVED'
            ? 'bug:moved'
            : type.startsWith('COMMENT')
              ? 'comment:created'
              : 'bug:updated';
  queueEvent(tx, { room: `project:${bug.projectId}`, name, data: bug });
}
export async function list(
  actor: string,
  projectId: string,
  filters: BugFilters,
) {
  await requireProjectRole(db, actor, projectId);
  const { status, priority, assignee, label, q } = filters;
  return db.bug.findMany({
    where: {
      projectId,
      status,
      priority,
      ...(assignee
        ? { assigneeId: assignee === 'unassigned' ? null : assignee }
        : {}),
      ...(label ? { labels: { has: label } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
              ...(/^\d+$/.test(q) && Number(q) <= 2147483647
                ? [{ number: Number(q) }]
                : []),
            ],
          }
        : {}),
    },
    include,
    orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
  });
}
export async function mine(actor: string) {
  return db.bug.findMany({
    where: {
      assigneeId: actor,
      project: { members: { some: { userId: actor } } },
    },
    include,
    orderBy: { updatedAt: 'desc' },
  });
}
export async function get(actor: string, id: string) {
  const bug = await db.bug.findFirst({
    where: { id, project: { members: { some: { userId: actor } } } },
    include: {
      ...include,
      activities: {
        include: { actor: { select: memberUser } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 200,
      },
    },
  });
  if (!bug)
    throw new HttpError(404, 'Bug not found or you do not have access.');
  return bug;
}
export async function create(
  actor: string,
  projectId: string,
  input: BugInput,
) {
  return inProject(actor, projectId, undefined, async (tx) => {
    await validateAssignee(tx, projectId, input.assigneeId);
    const project = await tx.project.update({
      where: { id: projectId },
      data: { nextBugNumber: { increment: 1 } },
    });
    const bug = await tx.bug.create({
      data: {
        ...input,
        projectId,
        reporterId: actor,
        number: project.nextBugNumber - 1,
        position: project.nextBugNumber - 1,
      },
      include,
    });
    await audit(tx, bug.id, actor, 'CREATED', { title: bug.title });
    if (bug.assigneeId)
      await audit(tx, bug.id, actor, 'ASSIGNED', {
        from: null,
        to: bug.assigneeId,
      });
    await notify(
      tx,
      actor,
      [bug.assigneeId],
      bug.id,
      'BUG_ASSIGNED',
      `You were assigned ${project.key}-${bug.number}: ${bug.title}`,
    );
    return bug;
  });
}
export async function update(actor: string, id: string, input: BugEdit) {
  return withBug(actor, id, async (tx, bug) => {
    const updated = await tx.bug.update({
      where: { id },
      data: input,
      include,
    });
    await audit(tx, id, actor, 'UPDATED', {
      before: {
        title: bug.title,
        description: bug.description,
        priority: bug.priority,
        type: bug.type,
        labels: bug.labels,
        dueDate: bug.dueDate?.toISOString() ?? null,
      },
      after: {
        title: updated.title,
        description: updated.description,
        priority: updated.priority,
        type: updated.type,
        labels: updated.labels,
        dueDate: updated.dueDate?.toISOString() ?? null,
      },
    });
    await notify(
      tx,
      actor,
      [bug.reporterId, bug.assigneeId],
      id,
      'BUG_UPDATED',
      `${bug.project.key}-${bug.number} was updated.`,
    );
    return updated;
  });
}
export async function move(
  actor: string,
  id: string,
  status: BugStatus,
  position: number,
) {
  return withBug(actor, id, async (tx, bug, role) => {
    if (!transitions[bug.status].includes(status))
      throw new HttpError(
        400,
        `Cannot move ${bug.status} to ${status}. Allowed: ${transitions[bug.status].join(', ')}.`,
      );
    if (
      (status === 'RESOLVED' || status === 'REOPENED') &&
      role === 'DEVELOPER'
    )
      throw new HttpError(
        403,
        'Only an owner or reviewer can approve or reopen a bug.',
      );
    const updated = await tx.bug.update({
      where: { id },
      data: {
        status,
        position,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
        resolvedById: status === 'RESOLVED' ? actor : null,
      },
      include,
    });
    const reward = status === 'RESOLVED' ? await awardXP(tx, bug, actor) : null;
    await audit(tx, id, actor, status === 'REOPENED' ? 'REOPENED' : 'MOVED', {
      from: bug.status,
      to: status,
    });
    await notify(
      tx,
      actor,
      [bug.reporterId, bug.assigneeId],
      id,
      `BUG_${status}`,
      `${bug.project.key}-${bug.number} moved to ${status.replaceAll('_', ' ')}.`,
    );
    if (reward) {
      const resolved = await tx.bug.findUniqueOrThrow({
        where: { id },
        include,
      });
      queueEvent(tx, {
        room: `project:${bug.projectId}`,
        name: 'bug:resolved',
        data: { bug: resolved, ...reward },
      });
      return resolved;
    }
    return updated;
  });
}
export async function assign(
  actor: string,
  id: string,
  assigneeId: string | null,
) {
  return withBug(actor, id, async (tx, bug) => {
    await validateAssignee(tx, bug.projectId, assigneeId);
    if (bug.assigneeId === assigneeId) return bug;
    const updated = await tx.bug.update({
      where: { id },
      data: { assigneeId },
      include,
    });
    await audit(tx, id, actor, 'ASSIGNED', {
      from: bug.assigneeId,
      to: assigneeId,
    });
    await notify(
      tx,
      actor,
      [bug.assigneeId, assigneeId, bug.reporterId],
      id,
      'BUG_ASSIGNED',
      `Assignment changed for ${bug.project.key}-${bug.number}.`,
    );
    return updated;
  });
}
export async function reorder(
  actor: string,
  id: string,
  status: BugStatus,
  position: number,
) {
  return withBug(actor, id, async (tx, bug) => {
    if (bug.status !== status)
      throw new HttpError(
        409,
        'This bug moved to a different column. Please try again.',
      );
    const updated = await tx.bug.update({
      where: { id },
      data: { position },
      include,
    });
    await audit(tx, id, actor, 'REORDERED', { position });
    return updated;
  });
}
export async function remove(actor: string, id: string) {
  const files = await withBug(actor, id, async (tx, _bug, role) => {
    if (role !== 'OWNER')
      throw new HttpError(403, 'Only the project owner can delete bugs.');
    const attachments = await tx.attachment.findMany({ where: { bugId: id }, select: { path: true } });
    await tx.bug.delete({ where: { id } });
    return attachments.map((attachment) => attachment.path);
  });
  await deleteUploadFiles(files);
  return { success: true };
}
export async function comments(actor: string, id: string) {
  await get(actor, id);
  return db.comment.findMany({
    where: { bugId: id },
    include: { author: { select: memberUser } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}
export async function comment(
  actor: string,
  id: string,
  body: string,
  commentId?: string,
) {
  return withBug(actor, id, async (tx, bug) => {
    if (commentId) {
      const existing = await tx.comment.findFirst({
        where: { id: commentId, bugId: id },
      });
      if (!existing) throw new HttpError(404, 'Comment not found.');
      if (existing.authorId !== actor)
        throw new HttpError(403, 'You can only edit your own comments.');
    }
    const result = commentId
      ? await tx.comment.update({
          where: { id: commentId },
          data: { body },
          include: { author: { select: memberUser } },
        })
      : await tx.comment.create({
          data: { bugId: id, authorId: actor, body },
          include: { author: { select: memberUser } },
        });
    await audit(tx, id, actor, commentId ? 'COMMENT_EDITED' : 'COMMENTED', {
      commentId: result.id,
    });
    const subscribers = await tx.comment.findMany({
      where: {
        bugId: id,
        author: { memberships: { some: { projectId: bug.projectId } } },
      },
      select: { authorId: true },
      distinct: ['authorId'],
    });
    const currentMembers = await tx.projectMember.findMany({
      where: {
        projectId: bug.projectId,
        userId: {
          in: [bug.reporterId, ...(bug.assigneeId ? [bug.assigneeId] : [])],
        },
      },
      select: { userId: true },
    });
    await notify(
      tx,
      actor,
      [
        ...currentMembers.map((member) => member.userId),
        ...subscribers.map((item) => item.authorId),
      ],
      id,
      'COMMENT_CREATED',
      `${commentId ? 'A comment was edited' : 'New comment'} on ${bug.project.key}-${bug.number}.`,
    );
    return result;
  });
}
export async function removeComment(
  actor: string,
  id: string,
  commentId: string,
) {
  return withBug(actor, id, async (tx, _bug, role) => {
    const existing = await tx.comment.findFirst({
      where: { id: commentId, bugId: id },
    });
    if (!existing) throw new HttpError(404, 'Comment not found.');
    if (existing.authorId !== actor && role !== 'OWNER')
      throw new HttpError(403, 'You can only delete your own comments.');
    await tx.comment.delete({ where: { id: commentId } });
    await audit(tx, id, actor, 'COMMENT_DELETED', { commentId });
    return { success: true };
  });
}
