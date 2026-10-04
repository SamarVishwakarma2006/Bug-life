import { db } from '../config/db.js';
import { requireProjectRole } from '../middleware/requireProjectRole.js';
import { memberUser } from './projectAccess.js';
import { levelTitle } from './xpService.js';
export async function leaderboard(
  userId: string,
  projectId: string,
  range: 'week' | 'month' | 'all',
) {
  await requireProjectRole(db, userId, projectId);
  const since =
    range === 'all'
      ? undefined
      : new Date(Date.now() - (range === 'week' ? 7 : 30) * 86400000);
  const [members, totals] = await Promise.all([
    db.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { ...memberUser, level: true, xp: true } } },
    }),
    db.xPTransaction.groupBy({
      by: ['userId'],
      where: { bug: { projectId }, createdAt: { gte: since } },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);
  return members
    .map(({ user }) => ({
      ...user,
      title: levelTitle(user.level),
      earnedXp:
        totals.find((item) => item.userId === user.id)?._sum.amount ?? 0,
      resolved: totals.find((item) => item.userId === user.id)?._count.id ?? 0,
    }))
    .sort((a, b) => b.earnedXp - a.earnedXp || a.name.localeCompare(b.name));
}
export async function profile(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      ...memberUser,
      xp: true,
      level: true,
      currentStreak: true,
      longestStreak: true,
      lastResolvedAt: true,
      createdAt: true,
      achievements: {
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      },
    },
  });
}
