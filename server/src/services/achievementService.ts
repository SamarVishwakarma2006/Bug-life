import type { Prisma } from '@prisma/client';
import { queueEvent } from '../sockets/events.js';
export const achievementCatalog = [
  {
    key: 'FIRST_BLOOD',
    name: 'First Blood',
    description: 'Earn XP for your first resolved bug.',
    icon: 'flag',
  },
  {
    key: 'BUG_SLAYER',
    name: 'Bug Slayer',
    description: 'Earn XP for 10 resolved bugs.',
    icon: 'sword',
  },
  {
    key: 'BUG_EXTERMINATOR',
    name: 'Bug Exterminator',
    description: 'Earn XP for 100 resolved bugs.',
    icon: 'shield',
  },
  {
    key: 'CRITICAL_HIT',
    name: 'Critical Hit',
    description: 'Resolve a critical bug.',
    icon: 'target',
  },
  {
    key: 'ON_FIRE',
    name: 'On Fire',
    description: 'Earn XP for 5 bugs in 7 days.',
    icon: 'flame',
  },
  {
    key: 'SPEED_DEMON',
    name: 'Speed Demon',
    description: 'Resolve a bug within one hour.',
    icon: 'zap',
  },
];
export async function checkAchievements(
  tx: Prisma.TransactionClient,
  userId: string,
  critical: boolean,
  fast: boolean,
  now: Date,
) {
  await tx.achievement.createMany({
    data: achievementCatalog,
    skipDuplicates: true,
  });
  const count = await tx.xPTransaction.count({ where: { userId } });
  const recent = await tx.xPTransaction.count({
    where: {
      userId,
      createdAt: { gte: new Date(now.getTime() - 7 * 86400000) },
    },
  });
  const keys = [
    'FIRST_BLOOD',
    ...(count >= 10 ? ['BUG_SLAYER'] : []),
    ...(count >= 100 ? ['BUG_EXTERMINATOR'] : []),
    ...(critical ? ['CRITICAL_HIT'] : []),
    ...(fast ? ['SPEED_DEMON'] : []),
    ...(recent >= 5 ? ['ON_FIRE'] : []),
  ];
  const missing = await tx.achievement.findMany({
    where: { key: { in: keys }, users: { none: { userId } } },
  });
  for (const achievement of missing) {
    await tx.userAchievement.create({
      data: { userId, achievementId: achievement.id, unlockedAt: now },
    });
    queueEvent(tx, {
      room: `user:${userId}`,
      name: 'achievement:unlocked',
      data: achievement,
    });
  }
  return missing;
}
