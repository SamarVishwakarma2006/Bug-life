import { PrismaClient } from '@prisma/client';
import './env.js';
export const db = new PrismaClient();
