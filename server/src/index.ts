import { app } from './app.js';
import { env } from './config/env.js';
import { db } from './config/db.js';
import { createServer } from 'node:http';
import { attachSockets } from './sockets/index.js';

await db.$connect();
const server = createServer(app);
const io = attachSockets(server);
server.listen(env.PORT, () =>
  console.log(`BugLife API: http://localhost:${env.PORT}`),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    io.close();
    server.close(() => {
      void db.$disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
