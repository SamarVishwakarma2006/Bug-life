import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { env } from '../config/env.js';
import { setPublisher } from './events.js';
export function attachSockets(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: env.CLIENT_ORIGIN },
    maxHttpBufferSize: 10000,
  });
  io.use(async (socket, next) => {
    try {
      const token: unknown = socket.handshake.auth.token;
      if (typeof token !== 'string') throw new Error('Missing token');
      const payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'buglife',
        audience: 'buglife-client',
      });
      if (typeof payload === 'string' || !payload.sub || !payload.exp)
        throw new Error('Invalid token');
      const user = await db.user.findUnique({
        where: { id: payload.sub },
        select: { tokenVersion: true },
      });
      if (!user || (payload.version ?? 0) !== user.tokenVersion)
        throw new Error('Revoked session');
      socket.data.userId = payload.sub;
      socket.data.expires = payload.exp;
      next();
    } catch {
      next(new Error('Please sign in with a valid session.'));
    }
  });
  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string;
    await socket.join(`user:${userId}`);
    const timer = setTimeout(
      () => socket.disconnect(true),
      Math.max(0, (socket.data.expires as number) * 1000 - Date.now()),
    );
    socket.on('disconnect', () => clearTimeout(timer));
    try {
      const memberships = await db.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });
      if (socket.connected) {
        await socket.join(
          memberships.map((member) => `project:${member.projectId}`),
        );
        socket.emit('ready');
      }
    } catch {
      socket.disconnect(true);
    }
  });
  setPublisher(async (events) => {
    for (const event of events) {
      if (event.room.startsWith('project:')) {
        const projectId = event.room.slice(8);
        // Check current membership at delivery time, including removal of a connected member.
        const members = await db.projectMember.findMany({
          where: { projectId },
          select: { userId: true },
        });
        const allowed = new Set(members.map((member) => member.userId));
        for (const socket of io.sockets.sockets.values()) {
          if (allowed.has(socket.data.userId as string)) {
            await socket.join(event.room);
            socket.emit(event.name, event.data);
          } else if (socket.rooms.has(event.room)) {
            await socket.leave(event.room);
            socket.emit('membership:changed', { projectId });
          }
        }
      } else {
        io.to(event.room).emit(event.name, event.data);
        if (event.name === 'session:revoked')
          io.in(event.room).disconnectSockets(true);
      }
    }
  });
  return io;
}
