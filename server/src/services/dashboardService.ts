import { db } from '../config/db.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { memberUser } from './projectAccess.js';
import { publicUserSelect } from './authService.js';
export async function dashboard(userId: string) {
  const membership = { project: { members: { some: { userId } } } };
  const [user, assigned, criticalCount, resolvedCount, recentActivity] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: publicUserSelect }),
    db.bug.findMany({ where: { ...membership, assigneeId: userId, status: { not: 'RESOLVED' } }, include: { project: { select: { id: true, name: true, key: true } }, assignee: { select: memberUser }, reporter: { select: memberUser }, _count: { select: { comments: true } } }, orderBy: { updatedAt: 'desc' } }),
    db.bug.count({ where: { ...membership, priority: 'CRITICAL', status: { not: 'RESOLVED' } } }),
    db.bug.count({ where: { ...membership, status: 'RESOLVED' } }),
    db.activity.findMany({ where: { bug: membership }, include: { actor: { select: memberUser }, bug: { select: { id: true, number: true, title: true, project: { select: { key: true } } } } }, orderBy: { createdAt: 'desc' }, take: 15 }),
  ]);
  return { user, assigned, criticalCount, resolvedCount, recentActivity };
}
export async function analytics(userId: string, projectId: string) {
  await requireProjectRole(db, userId, projectId);
  const bugs = await db.bug.findMany({ where: { projectId }, select: { status: true, priority: true, type: true, createdAt: true, resolvedAt: true, assigneeId: true } });
  const members = await db.projectMember.findMany({ where: { projectId }, include: { user: { select: memberUser } } });
  const countBy = (field: 'status' | 'priority' | 'type') => { const totals: Record<string, number> = {}; for (const bug of bugs) totals[bug[field]] = (totals[bug[field]] ?? 0) + 1; return Object.entries(totals).map(([name, count]) => ({ name, count })); };
  const resolved = bugs.filter((bug) => bug.status === 'RESOLVED' && bug.resolvedAt);
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const resolvedPerDay = Array.from({ length: 30 }, (_, index) => { const date = new Date(today.getTime() - (29 - index) * 86400000).toISOString().slice(0, 10); return { date, count: resolved.filter((bug) => bug.resolvedAt!.toISOString().startsWith(date)).length }; });
  return { byStatus: countBy('status'), byPriority: countBy('priority'), byType: countBy('type'), resolvedPerDay, averageResolutionHours: resolved.length ? resolved.reduce((sum, bug) => sum + (bug.resolvedAt!.getTime() - bug.createdAt.getTime()) / 3600000, 0) / resolved.length : null, contributions: members.map(({ user }) => ({ name: user.name, userId: user.id, count: resolved.filter((bug) => bug.assigneeId === user.id).length })) };
}
export async function search(userId: string, q: string) {
  if (!q) return { bugs: [], projects: [], members: [] };
  const membership = { members: { some: { userId } } };
  const keyMatch = /^([A-Z][A-Z0-9]{1,7})-(\d+)$/i.exec(q);
  const [bugs, projects, members] = await Promise.all([
    db.bug.findMany({ where: { project: membership, OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, ...(keyMatch && Number(keyMatch[2]) <= 2147483647 ? [{ number: Number(keyMatch[2]), project: { key: { equals: keyMatch[1], mode: 'insensitive' as const } } }] : [])] }, select: { id: true, title: true, number: true, project: { select: { id: true, key: true, name: true } } }, take: 15 }),
    db.project.findMany({ where: { ...membership, OR: [{ name: { contains: q, mode: 'insensitive' } }, { key: { contains: q, mode: 'insensitive' } }] }, select: { id: true, name: true, key: true }, take: 10 }),
    db.user.findMany({ where: { memberships: { some: { project: membership } }, OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }, select: memberUser, take: 10 }),
  ]);
  return { bugs, projects, members };
}
