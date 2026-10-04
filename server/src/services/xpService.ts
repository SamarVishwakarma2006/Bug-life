import type { Bug, Prisma } from '@prisma/client';
import { checkAchievements } from './achievementService.js';
import { queueEvent } from '../sockets/events.js';
export function levelTitle(level: number) {
  return level >= 50
    ? 'Debugging Legend'
    : level >= 30
      ? 'Bug Exterminator'
      : level >= 20
        ? 'Bug Hunter'
        : level >= 10
          ? 'Bug Slayer'
          : level >= 5
            ? 'Debugger'
            : 'Bug Rookie';
}
export async function awardXP(
  tx: Prisma.TransactionClient,
  bug: Bug,
  approverId: string,
  now = new Date(),
) {
  if (
    bug.status !== 'REVIEW' ||
    bug.xpAwarded ||
    !bug.assigneeId ||
    bug.assigneeId === approverId ||
    bug.assigneeId === bug.reporterId
  )
    return {
      xpGained: 0,
      streak: 0,
      recipientId: bug.assigneeId,
      achievements: [],
    };
  // User lock prevents lost XP/streak updates when different projects resolve simultaneously.
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${bug.assigneeId} FOR UPDATE`;
  const user = await tx.user.findUniqueOrThrow({
    where: { id: bug.assigneeId },
  });
  const age = Math.max(0, now.getTime() - bug.createdAt.getTime());
  const base = { LOW: 10, MEDIUM: 20, HIGH: 35, CRITICAL: 50 }[bug.priority];
  const xpGained = base + (age <= 3600000 ? 25 : age <= 86400000 ? 10 : 0);
  const xp = user.xp + xpGained;
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  // A streak counts awarded resolutions, not days. A gap over seven days resets it to one.
  const streak =
    user.lastResolvedAt &&
    now.getTime() - user.lastResolvedAt.getTime() <= 7 * 86400000
      ? user.currentStreak + 1
      : 1;
  await tx.user.update({
    where: { id: user.id },
    data: {
      xp,
      level,
      currentStreak: streak,
      longestStreak: Math.max(user.longestStreak, streak),
      lastResolvedAt: now,
    },
  });
  await tx.bug.update({ where: { id: bug.id }, data: { xpAwarded: true } });
  await tx.xPTransaction.create({
    data: {
      userId: user.id,
      bugId: bug.id,
      amount: xpGained,
      reason: `${bug.priority}: ${base} base + ${xpGained - base} speed bonus`,
      createdAt: now,
    },
  });
  const achievements = await checkAchievements(
    tx,
    user.id,
    bug.priority === 'CRITICAL',
    age <= 3600000,
    now,
  );
  queueEvent(tx, {
    room: `project:${bug.projectId}`,
    name: 'leaderboard:updated',
    data: { projectId: bug.projectId },
  });
  queueEvent(tx, {
    room: `user:${user.id}`,
    name: 'profile:updated',
    data: { xp, level, currentStreak: streak },
  });
  return { xpGained, streak, level, recipientId: user.id, achievements };
}
