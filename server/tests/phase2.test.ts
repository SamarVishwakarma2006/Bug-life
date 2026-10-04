import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { BugStatus } from '@prisma/client';
import { app } from '../src/app.js';
import { db } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const run = randomUUID();
const users = await Promise.all(
  ['owner', 'developer', 'reviewer', 'outsider'].map((name) =>
    db.user.create({
      data: {
        name,
        email: `${name}-${run}@example.test`,
        passwordHash: 'unused-in-token-auth-tests',
      },
    }),
  ),
);
const [owner, developer, reviewer, outsider] = users;
assert(owner && developer && reviewer && outsider);
const tokens = users.map((user) =>
  jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'buglife',
    audience: 'buglife-client',
  }),
);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve) => server.once('listening', resolve));
const address = server.address();
assert(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}/api`;
const projects: string[] = [];
after(async () => {
  await db.project.deleteMany({ where: { id: { in: projects } } });
  await db.user.deleteMany({
    where: { id: { in: users.map((user) => user.id) } },
  });
  await db.$disconnect();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});
async function request<
  T = {
    id: string;
    number: number;
    status: BugStatus;
    error?: { message: string };
  },
>(
  index: number,
  path: string,
  method = 'GET',
  body?: unknown,
  expected = 200,
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens[index]}`,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  assert.equal(response.status, expected, `${method} ${path}: ${text}`);
  assert(!text.includes('passwordHash'), 'Private user fields must not leak.');
  return JSON.parse(text) as T;
}

test('Phase 2 project, role, bug lifecycle, audit, and concurrency integration', async (t) => {
  const project = await request(
    0,
    '/projects',
    'POST',
    {
      name: 'Lifecycle test',
      key: 'LT',
      description: 'Disposable test project',
    },
    201,
  );
  projects.push(project.id);
  const path = `/projects/${project.id}`;
  await request(
    0,
    `${path}/members`,
    'POST',
    { email: developer.email, role: 'DEVELOPER' },
    201,
  );
  await request(
    0,
    `${path}/members`,
    'POST',
    { email: reviewer.email, role: 'REVIEWER' },
    201,
  );
  const input = {
    title: 'Payment API returns 500',
    description: 'Reproduce on checkout.',
    priority: 'CRITICAL',
    type: 'API',
    labels: ['checkout'],
    dueDate: '2026-12-01T00:00:00.000Z',
    assigneeId: developer.id,
  };
  const bug = await request(0, `${path}/bugs`, 'POST', input, 201);
  const bugPath = `/bugs/${bug.id}`;
  assert.equal(bug.number, 1);
  assert.equal(bug.status, 'BACKLOG');

  await t.test(
    'project access is private and ownership cannot be escalated',
    async () => {
      await request(3, path, 'GET', undefined, 404);
      await request(3, `${path}/bugs`, 'GET', undefined, 404);
      await request(3, `${path}/members`, 'GET', undefined, 404);
      await request(3, `${path}/activity`, 'GET', undefined, 404);
      await request(3, bugPath, 'GET', undefined, 404);
      await request(3, `${bugPath}/comments`, 'GET', undefined, 404);
      const ownProjects = await request<{ id: string }[]>(3, '/projects');
      assert(!ownProjects.some((item) => item.id === project.id));
      await request(1, path, 'DELETE', undefined, 403);
      await request(1, path, 'PUT', { name: 'Hijack', key: 'HI' }, 403);
      await request(
        1,
        `${path}/members`,
        'POST',
        { email: outsider.email, role: 'REVIEWER' },
        403,
      );
      await request(
        1,
        `${path}/members/${developer.id}`,
        'PATCH',
        { role: 'REVIEWER' },
        403,
      );
      await request(
        0,
        `${path}/members/${owner.id}`,
        'PATCH',
        { role: 'DEVELOPER' },
        400,
      );
      await request(0, `${path}/members/${owner.id}`, 'DELETE', undefined, 400);
      await request(
        0,
        `${path}/members`,
        'POST',
        { email: outsider.email, role: 'OWNER' },
        400,
      );
      await request(
        0,
        `${path}/members`,
        'POST',
        { email: developer.email, role: 'REVIEWER' },
        409,
      );
      await request(
        0,
        `${path}/members`,
        'POST',
        { email: `missing-${run}@example.test`, role: 'DEVELOPER' },
        404,
      );
      await request(
        0,
        '/projects',
        'POST',
        { name: 'Invalid', key: 'bad-key' },
        400,
      );
    },
  );

  await t.test(
    'numbering is atomic, per project, and failures do not consume numbers',
    async () => {
      await request(
        0,
        `${path}/bugs`,
        'POST',
        { ...input, assigneeId: outsider.id },
        400,
      );
      const concurrent = await Promise.all(
        Array.from({ length: 12 }, (_, index) =>
          request(
            1,
            `${path}/bugs`,
            'POST',
            { title: `Concurrent bug ${index}` },
            201,
          ),
        ),
      );
      assert.deepEqual(
        concurrent.map((item) => item.number).sort((a, b) => a - b),
        Array.from({ length: 12 }, (_, index) => index + 2),
      );
      const other = await request(
        1,
        '/projects',
        'POST',
        { name: 'Different role', key: 'DR' },
        201,
      );
      projects.push(other.id);
      const otherBug = await request(
        1,
        `/projects/${other.id}/bugs`,
        'POST',
        { title: 'A separate project' },
        201,
      );
      assert.equal(otherBug.number, 1);
      await request(1, `/projects/${other.id}`, 'PUT', {
        name: 'Developer owns this one',
        key: 'DR',
      });
      await request(0, `/bugs/${otherBug.id}`, 'GET', undefined, 404);
      await request(1, `/bugs/${otherBug.id}`, 'DELETE');
      const second = await request(
        1,
        `/projects/${other.id}/bugs`,
        'POST',
        { title: 'Number not reused' },
        201,
      );
      assert.equal(second.number, 2);
    },
  );

  await t.test(
    'filters, assignment, edits, and direct-write validation',
    async () => {
      const filtered = await request<{ id: string }[]>(
        1,
        `${path}/bugs?priority=CRITICAL&status=BACKLOG&label=checkout&assignee=${developer.id}&q=PAYMENT`,
      );
      assert.deepEqual(
        filtered.map((item) => item.id),
        [bug.id],
      );
      const mine = await request<{ id: string }[]>(1, '/bugs/mine');
      assert(mine.some((item) => item.id === bug.id));
      await request(1, `${path}/bugs?status=INVALID`, 'GET', undefined, 400);
      await request(
        1,
        `${path}/bugs`,
        'POST',
        { title: 'Forbidden status injection', status: 'RESOLVED' },
        400,
      );
      await request(1, bugPath, 'PUT', { ...input, status: 'RESOLVED' }, 400);
      await request(
        1,
        `${bugPath}/assign`,
        'PATCH',
        { assigneeId: outsider.id },
        400,
      );
      await request(1, `${bugPath}/assign`, 'PATCH', {
        assigneeId: reviewer.id,
      });
      await request(1, `${bugPath}/assign`, 'PATCH', {
        assigneeId: developer.id,
      });
      const edit = { ...input, assigneeId: undefined };
      await request(1, bugPath, 'PUT', {
        ...edit,
        description: 'Updated reproduction details',
      });
      await request(
        1,
        `${bugPath}/status`,
        'PATCH',
        { status: 'TODO', position: -1 },
        400,
      );
      await request(1, bugPath, 'DELETE', undefined, 403);
      await request(2, bugPath, 'DELETE', undefined, 403);
    },
  );

  await t.test(
    'complete lifecycle and concurrent moves reject stale transitions',
    async () => {
      const before = await db.activity.count({ where: { bugId: bug.id } });
      await request(
        0,
        `${bugPath}/status`,
        'PATCH',
        { status: 'RESOLVED', position: 0 },
        400,
      );
      assert.equal(
        await db.activity.count({ where: { bugId: bug.id } }),
        before,
      );
      const concurrent = await Promise.all(
        [0, 1].map((index) =>
          fetch(`${base}${bugPath}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokens[index]}`,
            },
            body: JSON.stringify({ status: 'TODO', position: 1 }),
          }),
        ),
      );
      assert.deepEqual(
        concurrent.map((response) => response.status).sort(),
        [200, 400],
      );
      await request(1, `${bugPath}/status`, 'PATCH', {
        status: 'IN_PROGRESS',
        position: 1,
      });
      await request(1, `${bugPath}/status`, 'PATCH', {
        status: 'REVIEW',
        position: 1,
      });
      await request(
        1,
        `${bugPath}/status`,
        'PATCH',
        { status: 'RESOLVED', position: 1 },
        403,
      );
      await request(
        1,
        `${bugPath}/status`,
        'PATCH',
        { status: 'REOPENED', position: 1 },
        403,
      );
      await request(2, `${bugPath}/status`, 'PATCH', {
        status: 'RESOLVED',
        position: 1,
      });
      const resolved = await db.bug.findUniqueOrThrow({
        where: { id: bug.id },
      });
      assert(resolved.resolvedAt);
      assert.equal(resolved.resolvedById, reviewer.id);
      assert.equal(resolved.xpAwarded, true);
      assert.equal(
        await db.xPTransaction.count({ where: { bugId: bug.id } }),
        1,
      );
      await request(2, `${bugPath}/status`, 'PATCH', {
        status: 'REOPENED',
        position: 1,
      });
      assert.equal(
        (await db.bug.findUniqueOrThrow({ where: { id: bug.id } })).resolvedAt,
        null,
      );
      await request(1, `${bugPath}/status`, 'PATCH', {
        status: 'IN_PROGRESS',
        position: 1,
      });
      await request(1, `${bugPath}/status`, 'PATCH', {
        status: 'REVIEW',
        position: 1,
      });
      await request(0, `${bugPath}/status`, 'PATCH', {
        status: 'RESOLVED',
        position: 1,
      });
    },
  );

  await t.test(
    'every allowed and disallowed status pair is enforced',
    async () => {
      const allowed: Record<BugStatus, BugStatus[]> = {
        BACKLOG: ['TODO'],
        TODO: ['IN_PROGRESS', 'BACKLOG'],
        IN_PROGRESS: ['REVIEW', 'TODO'],
        REVIEW: ['RESOLVED', 'REOPENED', 'IN_PROGRESS'],
        RESOLVED: ['REOPENED'],
        REOPENED: ['IN_PROGRESS'],
      };
      const probe = await request(
        0,
        `${path}/bugs`,
        'POST',
        { title: 'Transition matrix probe' },
        201,
      );
      for (const from of Object.keys(allowed) as BugStatus[])
        for (const to of Object.keys(allowed) as BugStatus[]) {
          await db.bug.update({
            where: { id: probe.id },
            data: { status: from },
          });
          await request(
            0,
            `/bugs/${probe.id}/status`,
            'PATCH',
            { status: to, position: 0 },
            allowed[from].includes(to) ? 200 : 400,
          );
        }
    },
  );

  await t.test(
    'comments are scoped and changes create audit records and notifications',
    async () => {
      const comment = await request(
        1,
        `${bugPath}/comments`,
        'POST',
        { body: 'Reproduced in checkout.' },
        201,
      );
      await request(
        2,
        `${bugPath}/comments/${comment.id}`,
        'PUT',
        { body: 'Not my comment' },
        403,
      );
      await request(
        2,
        `${bugPath}/comments/${comment.id}`,
        'DELETE',
        undefined,
        403,
      );
      await request(
        3,
        `${bugPath}/comments`,
        'POST',
        { body: 'Outsider comment' },
        404,
      );
      await request(1, `${bugPath}/comments/${comment.id}`, 'PUT', {
        body: 'Updated: reproduced on both browsers.',
      });
      const otherBug = await request(
        0,
        `${path}/bugs`,
        'POST',
        { title: 'Comment boundary probe' },
        201,
      );
      await request(
        1,
        `/bugs/${otherBug.id}/comments/${comment.id}`,
        'DELETE',
        undefined,
        404,
      );
      await request(1, `${bugPath}/comments/${comment.id}`, 'DELETE');
      assert.equal(await db.comment.count({ where: { id: comment.id } }), 0);
      const events = await db.activity.findMany({ where: { bugId: bug.id } });
      for (const type of [
        'CREATED',
        'ASSIGNED',
        'UPDATED',
        'MOVED',
        'REOPENED',
        'COMMENTED',
        'COMMENT_EDITED',
        'COMMENT_DELETED',
      ])
        assert(
          events.some((event) => event.type === type),
          `Missing ${type}`,
        );
      assert(
        (await db.notification.count({
          where: { bugId: bug.id, userId: developer.id },
        })) > 0,
      );
      const history = await request<{ id: string }[]>(0, `${path}/activity`);
      assert(history.length > 0);
    },
  );

  await t.test(
    'role updates take effect and removal revokes access and clears assignments',
    async () => {
      await request(0, `${path}/members/${reviewer.id}`, 'PATCH', {
        role: 'DEVELOPER',
      });
      await request(
        2,
        `${bugPath}/status`,
        'PATCH',
        { status: 'REOPENED', position: 0 },
        403,
      );
      await request(0, `${path}/members/${reviewer.id}`, 'PATCH', {
        role: 'REVIEWER',
      });
      await request(2, `${bugPath}/status`, 'PATCH', {
        status: 'REOPENED',
        position: 0,
      });
      await request(0, `${path}/members/${developer.id}`, 'DELETE');
      assert.equal(
        (await db.bug.findUniqueOrThrow({ where: { id: bug.id } })).assigneeId,
        null,
      );
      await request(1, bugPath, 'GET', undefined, 404);
      await request(
        1,
        `${path}/bugs`,
        'POST',
        { title: 'Removed user report' },
        404,
      );
      const mine = await request<{ id: string }[]>(1, '/bugs/mine');
      assert(!mine.some((item) => item.id === bug.id));
      await request(
        0,
        `${bugPath}/assign`,
        'PATCH',
        { assigneeId: developer.id },
        400,
      );
      const before = await db.notification.count({
        where: { userId: developer.id, bugId: bug.id },
      });
      await request(
        0,
        `${bugPath}/comments`,
        'POST',
        { body: 'After removal.' },
        201,
      );
      assert.equal(
        await db.notification.count({
          where: { userId: developer.id, bugId: bug.id },
        }),
        before,
      );
    },
  );

  await t.test(
    'owners can delete bugs and projects with dependent data',
    async () => {
      await request(0, bugPath, 'DELETE');
      await request(0, bugPath, 'GET', undefined, 404);
      await request(0, path, 'DELETE');
      assert.equal(await db.bug.count({ where: { projectId: project.id } }), 0);
      assert.equal(
        await db.projectMember.count({ where: { projectId: project.id } }),
        0,
      );
      await request(0, path, 'GET', undefined, 404);
    },
  );
});
