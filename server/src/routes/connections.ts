import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { connectionsQuerySchema } from '../validators/connections.js';
import { getConnectionsGraph } from '../services/connectionsService.js';

export const connectionsRouter = Router();

connectionsRouter.get('/', auth, async (req, res, next) => {
  try {
    const query = connectionsQuerySchema.parse(req.query);
    const graph = await getConnectionsGraph(res.locals.userId, query.days);
    res.json(graph);
  } catch (error) {
    next(error);
  }
});
