import { Router } from 'express';
import * as project from '../controllers/projectController.js';
import * as bug from '../controllers/bugController.js';
import { auth } from '../middleware/auth.js';
import { z } from 'zod';
import { idSchema } from '../validators/projects.js';
import { leaderboard } from '../services/statsService.js';
import { analytics } from '../services/dashboardService.js';
export const projectRouter = Router();
projectRouter.use(auth);
projectRouter.get('/:id/analytics', async (req, res) => {
  res.json(
    await analytics(res.locals.userId as string, idSchema.parse(req.params.id)),
  );
});
projectRouter.get('/:id/leaderboard', async (req, res) => {
  res.json(
    await leaderboard(
      res.locals.userId as string,
      idSchema.parse(req.params.id),
      z.enum(['week', 'month', 'all']).default('all').parse(req.query.range),
    ),
  );
});
projectRouter.route('/').get(project.list).post(project.create);
projectRouter
  .route('/:id')
  .get(project.get)
  .put(project.update)
  .delete(project.remove);
projectRouter
  .route('/:id/members')
  .get(project.members)
  .post(project.addMember);
projectRouter
  .route('/:id/members/:userId')
  .patch(project.changeMember)
  .delete(project.removeMember);
projectRouter.get('/:id/activity', project.activity);
projectRouter.route('/:id/bugs').get(bug.list).post(bug.create);
