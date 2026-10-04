import 'dotenv/config';
import { z } from 'zod';

export const env = z
  .object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
    PORT: z.coerce.number().int().positive().default(4000),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  })
  .parse(process.env);
