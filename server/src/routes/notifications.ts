import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import * as service from '../services/inboxService.js';
import { idSchema } from '../validators/projects.js';
export const notificationRouter = Router();
notificationRouter.use(auth);
notificationRouter.get('/', async (_req, res) => {
  res.json(await service.list(res.locals.userId as string));
});
notificationRouter.patch('/read-all', async (_req, res) => {
  res.json(await service.read(res.locals.userId as string));
});
notificationRouter.patch('/:id/read', async (req, res) => {
  res.json(
    await service.read(
      res.locals.userId as string,
      idSchema.parse(req.params.id),
    ),
  );
});
