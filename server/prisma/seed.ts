import bcrypt from 'bcrypt';
import { BugStatus, BugType, Priority } from '@prisma/client';
import { db } from '../src/config/db.js';
import { achievementCatalog } from '../src/services/achievementService.js';
const projectId = 'clbuglifedemoproject000001';
async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);
  const users = await Promise.all(
    ['Samar', 'Rahul', 'Aryan'].map((name) =>
      db.user.upsert({
        where: { email: `${name.toLowerCase()}@demo.dev` },
        update: {},
        create: { name, email: `${name.toLowerCase()}@demo.dev`, passwordHash },
      }),
    ),
  );
  const [samar, rahul, aryan] = users;
  if (!samar || !rahul || !aryan) throw new Error('Missing demo users');
  await db.achievement.createMany({
    data: achievementCatalog,
    skipDuplicates: true,
  });
  await db.$transaction(async (tx) => {
    await tx.project.upsert({
      where: { id: projectId },
      update: {},
      create: {
        id: projectId,
        name: 'Sagar Drishti',
        key: 'SD',
        description:
          'A shared workspace for the Sagar Drishti student development team.',
        ownerId: samar.id,
      },
    });
    await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${projectId} FOR UPDATE`;
    for (const [userId, role] of [
      [samar.id, 'OWNER'],
      [rahul.id, 'REVIEWER'],
      [aryan.id, 'DEVELOPER'],
    ] as const)
      await tx.projectMember.upsert({
        where: { userId_projectId: { userId, projectId } },
        update: {},
        create: { userId, projectId, role },
      });
    const titles = [
      'Login error message is clipped on mobile',
      'Dashboard loads slowly with many projects',
      'Project search ignores mixed case',
      'Avatar image missing after refresh',
      'API timeout is not handled gracefully',
      'Database connection pool fills under load',
      'Keyboard focus escapes the report dialog',
      'Comment timestamps show wrong timezone',
      'Missing input validation on profile form',
      'Notifications show duplicate entries',
      'Board ordering changes after reload',
      'Labels overflow narrow bug cards',
      'Session expiry message needs clarification',
      'Analytics chart has an empty axis label',
      'Password form should prevent double submit',
    ];
    const statuses = Object.values(BugStatus);
    const priorities = Object.values(Priority);
    const types = Object.values(BugType);
    for (let index = 0; index < titles.length; index++) {
      const number = index + 1;
      if (
        await tx.bug.findUnique({
          where: { projectId_number: { projectId, number } },
        })
      )
        continue;
      const status = statuses[index % statuses.length]!;
      const createdAt = new Date(Date.now() - (index + 2) * 86400000);
      const bug = await tx.bug.create({
        data: {
          projectId,
          number,
          title: titles[index]!,
          description: `Demo report: ${titles[index]}.\nSteps: open the affected screen and reproduce the behavior.\nExpected: a clear and consistent experience.`,
          priority: priorities[index % priorities.length]!,
          type: types[index % types.length]!,
          status,
          position: number * 1024,
          labels: index % 2 ? ['frontend'] : ['backend', 'regression'],
          reporterId: index % 2 ? samar.id : rahul.id,
          assigneeId: index % 4 === 0 ? null : aryan.id,
          createdAt,
          dueDate: index % 3 === 0 ? new Date(Date.now() + 5 * 86400000) : null,
          resolvedAt:
            status === 'RESOLVED'
              ? new Date(Date.now() - index * 3600000)
              : null,
          resolvedById: status === 'RESOLVED' ? rahul.id : null,
        },
      });
      await tx.activity.create({
        data: {
          bugId: bug.id,
          actorId: bug.reporterId,
          type: 'CREATED',
          metadata: { title: bug.title, seeded: true },
          createdAt,
        },
      });
      if (index < 4) {
        const comment = await tx.comment.create({
          data: {
            bugId: bug.id,
            authorId: aryan.id,
            body: 'I can reproduce this. Investigating a fix.',
          },
        });
        await tx.activity.create({
          data: {
            bugId: bug.id,
            actorId: aryan.id,
            type: 'COMMENTED',
            metadata: { commentId: comment.id },
          },
        });
      }
    }
    const highest = await tx.bug.aggregate({
      where: { projectId },
      _max: { number: true },
    });
    await tx.project.update({
      where: { id: projectId },
      data: { nextBugNumber: (highest._max.number ?? 0) + 1 },
    });
  });

  // Seed isolated user and project for multi-tenant isolation testing
  const isolatedProjectId = 'clbuglifedemoproject000002';
  const charlie = await db.user.upsert({
    where: { email: 'charlie@isolated.dev' },
    update: {},
    create: {
      name: 'Charlie',
      email: 'charlie@isolated.dev',
      passwordHash,
    },
  });

  await db.$transaction(async (tx) => {
    await tx.project.upsert({
      where: { id: isolatedProjectId },
      update: {},
      create: {
        id: isolatedProjectId,
        name: 'Quantum Canvas',
        key: 'QC',
        description: 'An isolated creative coding playground for Charlie.',
        ownerId: charlie.id,
      },
    });

    await tx.projectMember.upsert({
      where: {
        userId_projectId: { userId: charlie.id, projectId: isolatedProjectId },
      },
      update: {},
      create: {
        userId: charlie.id,
        projectId: isolatedProjectId,
        role: 'OWNER',
      },
    });

    const charlieBugTitles = [
      'Canvas WebGL context lost during tab switch',
      'Shader compiler warning on mobile Safari',
      'Export high-DPI image feature request',
    ];

    for (let i = 0; i < charlieBugTitles.length; i++) {
      const number = i + 1;
      if (
        await tx.bug.findUnique({
          where: { projectId_number: { projectId: isolatedProjectId, number } },
        })
      ) {
        continue;
      }
      const isResolved = i === 1;
      await tx.bug.create({
        data: {
          projectId: isolatedProjectId,
          number,
          title: charlieBugTitles[i]!,
          description: `Isolated project report for ${charlieBugTitles[i]}.`,
          priority: 'MEDIUM',
          type: 'UI',
          status: isResolved ? 'RESOLVED' : 'IN_PROGRESS',
          position: number * 1024,
          labels: ['graphics', 'isolated'],
          reporterId: charlie.id,
          assigneeId: charlie.id,
          resolvedAt: isResolved ? new Date() : null,
          resolvedById: isResolved ? charlie.id : null,
        },
      });
    }

    const isolatedHighest = await tx.bug.aggregate({
      where: { projectId: isolatedProjectId },
      _max: { number: true },
    });
    await tx.project.update({
      where: { id: isolatedProjectId },
      data: { nextBugNumber: (isolatedHighest._max.number ?? 0) + 1 },
    });
  });

  console.log(
    'Demo ready: Sagar Drishti (SD), 15 varied bugs, comments, and six achievements.',
  );
  console.log(
    'samar@demo.dev (owner), rahul@demo.dev (reviewer), aryan@demo.dev (developer). Initial password: password123. Existing accounts and bugs are preserved.',
  );
  console.log(
    'Isolated demo user: charlie@isolated.dev in project Quantum Canvas (QC). Password: password123.',
  );
}
try {
  await main();
} finally {
  await db.$disconnect();
}
