import { Router } from 'express';
import * as bug from '../controllers/bugController.js';
import { auth } from '../middleware/auth.js';
export const bugRouter = Router();
bugRouter.use(auth);
bugRouter.get('/mine', bug.mine);
bugRouter.route('/:id').get(bug.get).put(bug.update).delete(bug.remove);
bugRouter.patch('/:id/status', bug.move);
bugRouter.patch('/:id/position', bug.reorder);
bugRouter.patch('/:id/assign', bug.assign);
bugRouter.route('/:id/comments').get(bug.comments).post(bug.comment);
bugRouter
  .route('/:id/comments/:commentId')
  .put(bug.editComment)
  .delete(bug.removeComment);
