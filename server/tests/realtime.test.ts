import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { io, type Socket } from 'socket.io-client';
import { app } from '../src/app.js';
import { db } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { attachSockets } from '../src/sockets/index.js';
function event(socket: Socket, name: string) {
  return new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out: ${name}`)),
      4000,
    );
    socket.once(name, (data: unknown) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}
test('authenticated project events, personal notifications, and membership revocation', async () => {
  const run = randomUUID();
  const accounts = await Promise.all(
    ['owner', 'member', 'outside'].map((name) =>
      db.user.create({
        data: {
          name,
          email: `${name}-${run}@example.test`,
          passwordHash: 'test-only',
        },
      }),
    ),
  );
  const [owner, member, outside] = accounts;
  assert(owner && member && outside);
  const project = await db.project.create({
    data: {
      name: 'Socket test',
      key: 'SO',
      ownerId: owner.id,
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: member.id, role: 'DEVELOPER' },
        ],
      },
    },
  });
  const server = createServer(app);
  const sockets = attachSockets(server);
  server.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const token = (id: string) =>
    jwt.sign({}, env.JWT_SECRET, {
      subject: id,
      algorithm: 'HS256',
      expiresIn: '1h',
      issuer: 'buglife',
      audience: 'buglife-client',
    });
  const ownerToken = token(owner.id);
  const peers: Socket[] = [];
  try {
    const denied = io(base, { autoConnect: false, reconnection: false });
    peers.push(denied);
    const deniedEvent = event(denied, 'connect_error');
    denied.connect();
    await deniedEvent;
    const memberSocket = io(base, {
      autoConnect: false,
      auth: { token: token(member.id) },
    });
    peers.push(memberSocket);
    const ready = event(memberSocket, 'ready');
    memberSocket.connect();
    await ready;
    const outsideSocket = io(base, {
      autoConnect: false,
      auth: { token: token(outside.id) },
    });
    peers.push(outsideSocket);
    const outsideReady = event(outsideSocket, 'ready');
    outsideSocket.connect();
    await outsideReady;
    let outsideEvents = 0;
    outsideSocket.on('bug:created', () => outsideEvents++);
    const created = event(memberSocket, 'bug:created');
    const notified = event(memberSocket, 'notification:new');
    const response = await fetch(`${base}/api/projects/${project.id}/bugs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ title: 'Live socket bug', assigneeId: member.id }),
    });
    assert.equal(response.status, 201);
    const payload = (await created) as { id: string };
    const notification = (await notified) as { id: string };
    assert(await db.bug.findUnique({ where: { id: payload.id } }));
    assert(
      await db.notification.findUnique({ where: { id: notification.id } }),
    );
    const revoked = event(memberSocket, 'membership:changed');
    await fetch(`${base}/api/projects/${project.id}/members/${member.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    await revoked;
    let leaked = 0;
    memberSocket.on('bug:created', () => leaked++);
    await fetch(`${base}/api/projects/${project.id}/bugs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ title: 'After revocation' }),
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(leaked, 0);
    assert.equal(outsideEvents, 0);
  } finally {
    peers.forEach((peer) => peer.disconnect());
    await new Promise<void>((resolve) => sockets.close(() => resolve()));
    await db.project.delete({ where: { id: project.id } });
    await db.user.deleteMany({
      where: { id: { in: accounts.map((account) => account.id) } },
    });
    await db.$disconnect();
  }
});
