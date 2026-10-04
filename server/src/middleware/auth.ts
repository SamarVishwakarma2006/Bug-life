import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
import { db } from '../config/db.js';

export const auth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return next(new HttpError(401, 'Please sign in to continue.'));
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'buglife',
      audience: 'buglife-client',
    });
    if (typeof payload === 'string' || !payload.sub)
      throw new Error('Missing subject');
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true },
    });
    if (!user || (payload.version ?? 0) !== user.tokenVersion)
      throw new Error('Revoked session');
    res.locals.userId = payload.sub;
    next();
  } catch {
    next(
      new HttpError(
        401,
        'Your session is invalid or expired. Please sign in again.',
      ),
    );
  }
};
