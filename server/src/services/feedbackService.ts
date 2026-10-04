import { db } from '../config/db.js';
import type { FeedbackInput } from '../validators/feedback.js';

export async function createFeedback(data: FeedbackInput) {
  return db.feedback.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      message: data.message,
    },
  });
}
