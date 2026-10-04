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
const email = `phase1-${randomUUID()}@example.test`;
after(async () => {
  await db.user.deleteMany({ where: { email } });
  await db.$disconnect();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

async function request(path: string, body?: unknown, token?: string) {
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = (await response.json()) as {
    token?: string;
    user?: {
      id: string;
      email: string;
      xp: number;
      level: number;
      passwordHash?: string;
    };
    error?: { message: string };
  };
  return { response, data };
}

test('registration, login, JWT protection, validation, and credential safety', async () => {
  assert.equal((await request('/auth/me')).response.status, 401);
  assert.equal(
    (await request('/auth/me', undefined, 'invalid-token')).response.status,
    401,
  );
  assert.equal(
    (
      await request('/auth/register', {
        name: 'A',
        email: 'invalid',
        password: 'short',
      })
    ).response.status,
    400,
  );
  assert.equal(
    (
      await request('/auth/register', {
        name: 'Test User',
        email,
        password: '🙂'.repeat(20),
      })
    ).response.status,
    400,
  );
  const registration = await request('/auth/register', {
    name: ' Test User ',
    email: email.toUpperCase(),
    password: 'password123',
  });
  assert.equal(registration.response.status, 201);
  assert.equal(registration.data.user?.email, email);
  assert.equal(registration.data.user?.xp, 0);
  assert.equal(registration.data.user?.level, 1);
  assert.equal(registration.data.user?.passwordHash, undefined);
  assert(registration.data.token);
  const stored = await db.user.findUniqueOrThrow({ where: { email } });
  assert.notEqual(stored.passwordHash, 'password123');
  assert(stored.passwordHash.startsWith('$2b$12$'));
  assert.equal(
    (
      await request('/auth/register', {
        name: 'Test User',
        email,
        password: 'password123',
      })
    ).response.status,
    409,
  );
  const me = await request('/auth/me', undefined, registration.data.token);
  assert.equal(me.response.status, 200);
  assert.equal(me.data.user?.id, registration.data.user?.id);
  assert.equal(me.data.user?.passwordHash, undefined);
  const badLogin = await request('/auth/login', {
    email,
    password: 'not-the-password',
  });
  assert.equal(badLogin.response.status, 401);
  assert.equal(badLogin.data.error?.message, 'Invalid email or password.');
  const login = await request('/auth/login', {
    email,
    password: 'password123',
  });
  assert.equal(login.response.status, 200);
  assert(login.data.token);
  assert.equal(login.data.user?.passwordHash, undefined);
  assert.equal((await request('/not-a-route')).response.status, 404);
  const malformed = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(malformed.status, 400);
  const allowed = await fetch(`${base}/health`, {
    headers: { Origin: 'http://localhost:5173' },
  });
  assert.equal(
    allowed.headers.get('access-control-allow-origin'),
    'http://localhost:5173',
  );
  assert.equal(allowed.headers.get('x-content-type-options'), 'nosniff');
  const blocked = await fetch(`${base}/health`, {
    headers: { Origin: 'https://untrusted.example' },
  });
  assert.notEqual(
    blocked.headers.get('access-control-allow-origin'),
    'https://untrusted.example',
  );
  for (let attempt = 0; attempt < 20; attempt++)
    await request('/auth/login', {});
  const limited = await request('/auth/login', {});
  assert.equal(limited.response.status, 429);
  assert(limited.data.error?.message);
});
