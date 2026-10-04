import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { db } from '../src/config/db.js';
import { move } from '../src/services/bugService.js';
import { levelTitle } from '../src/services/xpService.js';
test('XP anti-abuse, speed bonuses, streaks, achievements and concurrent awards', async () => {
  const run = randomUUID();
  const users = await Promise.all(
    ['owner', 'reporter', 'assignee'].map((name) =>
      db.user.create({
        data: {
          name,
          email: `${name}-${run}@example.test`,
          passwordHash: 'test-only',
        },
      }),
    ),
  );
  const [owner, reporter, assignee] = users;
  assert(owner && reporter && assignee);
  const projects = await Promise.all(
    [0, 1].map((index) =>
      db.project.create({
        data: {
          name: `XP ${index}`,
          key: 'XP',
          ownerId: owner.id,
          members: {
            create: users.map((user) => ({
              userId: user.id,
              role:
                user.id === owner.id
                  ? ('OWNER' as const)
                  : ('DEVELOPER' as const),
            })),
          },
        },
      }),
    ),
  );
  let number = 0;
  async function bug(
    projectId = projects[0]!.id,
    assigned: string | null = assignee!.id,
    reported = reporter!.id,
    ageHours = 0,
  ) {
    return db.bug.create({
      data: {
        projectId,
        number: ++number,
        title: 'XP verification',
        priority: 'CRITICAL',
        status: 'REVIEW',
        reporterId: reported,
        assigneeId: assigned,
        createdAt: new Date(Date.now() - ageHours * 3600000),
      },
    });
  }
  try {
    for (const [assigned, reported] of [
      [null, reporter.id],
      [owner.id, reporter.id],
      [assignee.id, assignee.id],
    ] as const) {
      const item = await bug(undefined, assigned, reported);
      await move(owner.id, item.id, 'RESOLVED', 0);
      assert.equal(
        await db.xPTransaction.count({ where: { bugId: item.id } }),
        0,
      );
    }
    const first = await bug();
    await move(owner.id, first.id, 'RESOLVED', 0);
    assert.equal(
      (await db.user.findUniqueOrThrow({ where: { id: assignee.id } })).xp,
      75,
    );
    const achievements = await db.userAchievement.findMany({
      where: { userId: assignee.id },
      include: { achievement: true },
    });
    assert.deepEqual(achievements.map((item) => item.achievement.key).sort(), [
      'CRITICAL_HIT',
      'FIRST_BLOOD',
      'SPEED_DEMON',
    ]);
    await move(owner.id, first.id, 'REOPENED', 0);
    await move(assignee.id, first.id, 'IN_PROGRESS', 0);
    await move(assignee.id, first.id, 'REVIEW', 0);
    await move(owner.id, first.id, 'RESOLVED', 0);
    assert.equal(
      await db.xPTransaction.count({ where: { bugId: first.id } }),
      1,
    );
    for (const [age, amount] of [
      [2, 60],
      [25, 50],
    ] as const) {
      const item = await bug(undefined, undefined, undefined, age);
      await move(owner.id, item.id, 'RESOLVED', 0);
      assert.equal(
        (await db.xPTransaction.findFirstOrThrow({ where: { bugId: item.id } }))
          .amount,
        amount,
      );
    }
    const parallel = await Promise.all(
      projects.map((project) => bug(project.id)),
    );
    await Promise.all(
      parallel.map((item) => move(owner.id, item.id, 'RESOLVED', 0)),
    );
    const updated = await db.user.findUniqueOrThrow({
      where: { id: assignee.id },
    });
    assert.equal(updated.xp, 335);
    assert.equal(updated.level, Math.floor(Math.sqrt(335 / 50)) + 1);
    assert.equal(updated.currentStreak, 5);
    assert(
      await db.userAchievement.findFirst({
        where: { userId: assignee.id, achievement: { key: 'ON_FIRE' } },
      }),
    );
    await db.user.update({
      where: { id: assignee.id },
      data: { lastResolvedAt: new Date(Date.now() - 8 * 86400000) },
    });
    const reset = await bug();
    const attempts = await Promise.allSettled([
      move(owner.id, reset.id, 'RESOLVED', 0),
      move(owner.id, reset.id, 'RESOLVED', 0),
    ]);
    assert.equal(
      attempts.filter((attempt) => attempt.status === 'fulfilled').length,
      1,
    );
    const streak = await db.user.findUniqueOrThrow({
      where: { id: assignee.id },
    });
    assert.equal(streak.currentStreak, 1);
    assert.equal(streak.longestStreak, 5);
    assert.equal(levelTitle(1), 'Bug Rookie');
    assert.equal(levelTitle(5), 'Debugger');
    assert.equal(levelTitle(10), 'Bug Slayer');
    assert.equal(levelTitle(20), 'Bug Hunter');
    assert.equal(levelTitle(30), 'Bug Exterminator');
    assert.equal(levelTitle(50), 'Debugging Legend');
  } finally {
    await db.project.deleteMany({
      where: { id: { in: projects.map((project) => project.id) } },
    });
    await db.user.deleteMany({
      where: { id: { in: users.map((user) => user.id) } },
    });
    await db.$disconnect();
  }
});
