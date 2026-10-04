import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../utils/errors.js';
import { MulterError } from 'multer';

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  if (error instanceof MulterError) {
    res
      .status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      .json({
        error: {
          message:
            error.code === 'LIMIT_FILE_SIZE'
              ? 'Images must be 5 MB or smaller.'
              : 'Upload exactly one image using the file field.',
        },
      });
  } else if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Please check your input.',
        details: error.flatten(),
      },
    });
  } else if (error instanceof HttpError) {
    res.status(error.status).json({
      error: {
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    const target = error.meta?.target;
    res.status(409).json({
      error: {
        message:
          Array.isArray(target) && target.includes('email')
            ? 'An account with this email already exists.'
            : 'This record already exists. Refresh and try again.',
      },
    });
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  ) {
    res
      .status(404)
      .json({ error: { message: 'The requested record no longer exists.' } });
  } else if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: { message: 'Invalid JSON body.' } });
  } else if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    res.status(413).json({ error: { message: 'Request body is too large.' } });
  } else {
    console.error(error);
    res
      .status(500)
      .json({ error: { message: 'Something went wrong. Please try again.' } });
  }
};
