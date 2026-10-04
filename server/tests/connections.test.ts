import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { app } from '../src/app.js';
import { db } from '../src/config/db.js';

const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve) => server.once('listening', resolve));
const address = server.address();
assert(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}/api`;

const runId = randomUUID().slice(0, 8);
const emailA = `conn-a-${runId}@example.test`;
const emailB = `conn-b-${runId}@example.test`;
const emailC = `conn-c-${runId}@example.test`;

after(async () => {
  try {
    const users = await db.user.findMany({
      where: { email: { in: [emailA, emailB, emailC] } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    await db.project.deleteMany({
      where: { ownerId: { in: userIds } },
    });
    await db.user.deleteMany({
      where: { id: { in: userIds } },
    });
  } catch (err) {
    console.error('Error during test cleanup:', err);
  } finally {
    await db.$disconnect();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

interface ApiResponse {
  token?: string;
  user?: { id: string; name: string; email: string };
  id?: string;
  xpAwarded?: boolean;
  me?: { id: string; name: string; email: string };
  nodes?: Array<{ id: string; type: string; label: string; role?: string }>;
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    kind: string;
    priority?: string;
    bugKey?: string;
  }>;
  recentFixes?: Array<{
    bugId: string;
    bugKey: string;
    title: string;
    priority: string;
    xpAwarded: boolean;
    resolver: { id: string; name: string };
    reviewer: { id: string; name: string };
  }>;
}

async function apiRequest(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
) {
  const { method = 'GET', body, token } = options;
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = (await response.json()) as ApiResponse;
  return { response, data };
}

test('Connections API: Scoping, Isolation, Recent Fixes with XP, and Auth Enforcement', async () => {
  try {
    // (d) Unauthenticated requests get 401
    const unauth = await apiRequest('/connections');
    assert.equal(
      unauth.response.status,
      401,
      'Unauthenticated request must return 401',
    );

    // Register User A (Owner), User B (Reviewer), and User C (Isolated user in different project)
    const regA = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name: 'User A', email: emailA, password: 'password123' },
    });
    assert.equal(regA.response.status, 201);
    const tokenA = regA.data.token!;
    const userA = regA.data.user!;

    const regB = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name: 'User B', email: emailB, password: 'password123' },
    });
    assert.equal(regB.response.status, 201);
    const tokenB = regB.data.token!;
    const userB = regB.data.user!;

    const regC = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name: 'User C', email: emailC, password: 'password123' },
    });
    assert.equal(regC.response.status, 201);
    const tokenC = regC.data.token!;
    const userC = regC.data.user!;

    // User A creates Project Alpha (Key: PA)
    const projAlpha = await apiRequest('/projects', {
      method: 'POST',
      token: tokenA,
      body: { name: 'Project Alpha', key: 'PA', description: 'Alpha test' },
    });
    assert.equal(projAlpha.response.status, 201);
    const alphaId = projAlpha.data.id!;

    // User A adds User B as REVIEWER in Project Alpha
    const addB = await apiRequest(`/projects/${alphaId}/members`, {
      method: 'POST',
      token: tokenA,
      body: { email: userB.email, role: 'REVIEWER' },
    });
    assert.equal(addB.response.status, 201);

    // User C creates Project Omega (Key: PO) - Completely isolated!
    const projOmega = await apiRequest('/projects', {
      method: 'POST',
      token: tokenC,
      body: { name: 'Project Omega', key: 'PO', description: 'Omega test' },
    });
    assert.equal(projOmega.response.status, 201);
    const omegaId = projOmega.data.id!;

    // (a) User A sees only their connected nodes (self, project Alpha, User B)
    const connA = await apiRequest('/connections?days=14', { token: tokenA });
    assert.equal(connA.response.status, 200);
    assert.equal(connA.data.me?.id, userA.id);

    const nodeIdsA = (connA.data.nodes ?? []).map((n) => n.id);
    assert.ok(nodeIdsA.includes(userA.id), 'User A must see themselves');
    assert.ok(nodeIdsA.includes(alphaId), 'User A must see Project Alpha');
    assert.ok(nodeIdsA.includes(userB.id), 'User A must see teammate User B');

    // (b) An unrelated user C appears nowhere in A's response, and A appears nowhere in C's response
    assert.ok(
      !nodeIdsA.includes(userC.id),
      'Isolated User C must NOT appear in User A graph',
    );
    assert.ok(
      !nodeIdsA.includes(omegaId),
      'Project Omega must NOT appear in User A graph',
    );

    const connC = await apiRequest('/connections', { token: tokenC });
    assert.equal(connC.response.status, 200);
    const nodeIdsC = (connC.data.nodes ?? []).map((n) => n.id);
    assert.ok(nodeIdsC.includes(userC.id), 'User C must see themselves');
    assert.ok(nodeIdsC.includes(omegaId), 'User C must see Project Omega');
    assert.ok(
      !nodeIdsC.includes(userA.id),
      'User A must NOT appear in User C graph',
    );
    assert.ok(
      !nodeIdsC.includes(userB.id),
      'User B must NOT appear in User C graph',
    );
    assert.ok(
      !nodeIdsC.includes(alphaId),
      'Project Alpha must NOT appear in User C graph',
    );

    // (c) A resolved bug produces a recentFixes entry with correct XP, bugKey, resolver, and reviewer
    // User B creates a CRITICAL bug and assigns it to User A
    const createBug = await apiRequest(`/projects/${alphaId}/bugs`, {
      method: 'POST',
      token: tokenB,
      body: {
        title: 'Critical Database Deadlock',
        priority: 'CRITICAL',
        assigneeId: userA.id,
      },
    });
    assert.equal(createBug.response.status, 201);
    const bugId = createBug.data.id!;

    // Move bug through strict state machine: BACKLOG -> TODO -> IN_PROGRESS -> REVIEW -> RESOLVED
    await apiRequest(`/bugs/${bugId}/status`, {
      method: 'PATCH',
      token: tokenA,
      body: { status: 'TODO', position: 1000 },
    });
    await apiRequest(`/bugs/${bugId}/status`, {
      method: 'PATCH',
      token: tokenA,
      body: { status: 'IN_PROGRESS', position: 1000 },
    });
    await apiRequest(`/bugs/${bugId}/status`, {
      method: 'PATCH',
      token: tokenA,
      body: { status: 'REVIEW', position: 1000 },
    });

    // User B (Reviewer) approves: REVIEW -> RESOLVED
    const resolveRes = await apiRequest(`/bugs/${bugId}/status`, {
      method: 'PATCH',
      token: tokenB,
      body: { status: 'RESOLVED', position: 1000 },
    });
    assert.equal(resolveRes.response.status, 200);
    assert.equal(
      resolveRes.data.xpAwarded,
      true,
      'CRITICAL bug resolved by different reviewer awards XP',
    );

    // Verify recentFixes in Connections API
    const connAAfter = await apiRequest('/connections?days=14', {
      token: tokenA,
    });
    assert.equal(connAAfter.response.status, 200);
    const fixes = connAAfter.data.recentFixes ?? [];
    assert.ok(fixes.length >= 1, 'recentFixes must contain the resolved bug');

    const fixEntry = fixes.find((f) => f.bugId === bugId);
    assert.ok(fixEntry, 'Resolved bug must be in recentFixes');
    assert.equal(fixEntry.bugKey, 'PA-1');
    assert.equal(fixEntry.priority, 'CRITICAL');
    assert.equal(fixEntry.xpAwarded, true);
    assert.equal(fixEntry.resolver.id, userA.id);
    assert.equal(fixEntry.reviewer.id, userB.id);

    // Check edge between resolver and reviewer
    const reviewedEdge = (connAAfter.data.edges ?? []).find(
      (e) =>
        e.kind === 'REVIEWED_APPROVED' &&
        e.source === userA.id &&
        e.target === userB.id,
    );
    assert.ok(
      reviewedEdge,
      'REVIEWED_APPROVED edge must exist between resolver and reviewer',
    );
    assert.equal(reviewedEdge.priority, 'CRITICAL');
  } catch (err) {
    console.error('TEST ERROR DETAIL:', err);
    throw err;
  }
});
