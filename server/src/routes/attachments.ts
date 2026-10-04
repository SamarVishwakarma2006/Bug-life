import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { auth } from '../middleware/auth.js';
import { idSchema } from '../validators/projects.js';
import { HttpError } from '../utils/errors.js';
import * as service from '../services/attachmentService.js';
const upload = multer({
  storage: multer.diskStorage({
    destination: service.uploadsDir,
    filename: (_req, _file, callback) => callback(null, randomUUID()),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (
      !['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(
        file.mimetype,
      )
    )
      callback(new HttpError(400, 'Images only: PNG, JPEG, GIF, or WebP.'));
    else callback(null, true);
  },
});
export const attachmentRouter = Router();
attachmentRouter.get('/api/bugs/:id/attachments', auth, async (req, res) => {
  res.json(
    await service.list(
      res.locals.userId as string,
      idSchema.parse(req.params.id),
    ),
  );
});
attachmentRouter.post(
  '/api/bugs/:id/attachments',
  auth,
  (req, _res, next) => {
    idSchema.parse(req.params.id);
    next();
  },
  upload.single('file'),
  async (req, res) => {
    res
      .status(201)
      .json(
        await service.upload(
          res.locals.userId as string,
          idSchema.parse(req.params.id),
          req.file,
        ),
      );
  },
);
attachmentRouter.get('/uploads/:id', auth, async (req, res) => {
  const file = await service.download(
    res.locals.userId as string,
    idSchema.parse(req.params.id),
  );
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Cache-Control', 'private, no-store');
  res.sendFile(resolve(service.uploadsDir, file.path));
});
