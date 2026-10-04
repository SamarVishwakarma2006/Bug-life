import { z } from 'zod';

export const feedbackSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Please enter a valid email address').max(254),
    message: z
      .string()
      .trim()
      .min(5, 'Message must be at least 5 characters')
      .max(2000, 'Message cannot exceed 2000 characters'),
  })
  .strict();

export type FeedbackInput = z.infer<typeof feedbackSchema>;
