import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { projectRouter } from './routes/projects.js';
import { bugRouter } from './routes/bugs.js';
import { notificationRouter } from './routes/notifications.js';
import { dashboardRouter } from './routes/dashboard.js';
import { attachmentRouter } from './routes/attachments.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '32kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/bugs', bugRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api', dashboardRouter);
app.use(attachmentRouter);
app.use((_req, res) =>
  res.status(404).json({ error: { message: 'Route not found.' } }),
);
app.use(errorHandler);
