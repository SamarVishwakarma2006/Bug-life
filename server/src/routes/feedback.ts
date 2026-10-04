import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { feedbackRateLimit } from '../middleware/rateLimit.js';
import { feedbackSchema } from '../validators/feedback.js';
import { createFeedback } from '../services/feedbackService.js';

export const feedbackRouter = Router();

feedbackRouter.post(
  '/',
  feedbackRateLimit,
  validate(feedbackSchema),
  async (req, res, next) => {
    try {
      await createFeedback(req.body);
      res.status(201).json({
        success: true,
        message: 'Thank you for your feedback!',
      });
    } catch (error) {
      next(error);
    }
  },
);
