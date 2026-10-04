import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import * as service from '../services/dashboardService.js';
export const dashboardRouter = Router();
dashboardRouter.get('/dashboard', auth, async (_req, res) => {
  res.json(await service.dashboard(res.locals.userId as string));
});
dashboardRouter.get('/search', auth, async (req, res) => {
  res.json(
    await service.search(
      res.locals.userId as string,
      z.string().trim().max(200).default('').parse(req.query.q),
    ),
  );
});
