import { mkdirSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { db } from '../config/db.js';
import { inProject } from './projectAccess.js';
import { HttpError } from '../utils/errors.js';
import { queueEvent } from '../sockets/events.js';
import { uploadsDir } from '../utils/uploads.js';
export { uploadsDir };
mkdirSync(uploadsDir, { recursive: true });
const publicAttachment = (item: {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}) => ({
  id: item.id,
  filename: item.filename,
  mimeType: item.mimeType,
  size: item.size,
  createdAt: item.createdAt,
});
export async function list(userId: string, bugId: string) {
  const bug = await db.bug.findFirst({
    where: { id: bugId, project: { members: { some: { userId } } } },
    select: { id: true },
  });
  if (!bug) throw new HttpError(404, 'Bug not found.');
  return (
    await db.attachment.findMany({
      where: { bugId },
      orderBy: { createdAt: 'asc' },
    })
  ).map(publicAttachment);
}
export async function upload(
  userId: string,
  bugId: string,
  file?: Express.Multer.File,
) {
  if (!file)
    throw new HttpError(
      400,
      'Choose a PNG, JPEG, GIF, or WebP image (max 5 MB).',
    );
  try {
    const bytes = await readFile(file.path);
    const mime = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? 'image/png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? 'image/jpeg'
        : ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString())
          ? 'image/gif'
          : bytes.subarray(0, 4).toString() === 'RIFF' &&
              bytes.subarray(8, 12).toString() === 'WEBP'
            ? 'image/webp'
            : null;
    if (!mime || mime !== file.mimetype)
      throw new HttpError(
        400,
        'The file contents must match a supported image type.',
      );
    const bug = await db.bug.findFirst({
      where: { id: bugId, project: { members: { some: { userId } } } },
      select: { projectId: true },
    });
    if (!bug) throw new HttpError(404, 'Bug not found.');
    return await inProject(userId, bug.projectId, undefined, async (tx) => {
      const attachment = await tx.attachment.create({
        data: {
          bugId,
          uploadedById: userId,
          filename: file.originalname.slice(0, 200),
          path: file.filename,
          mimeType: mime,
          size: file.size,
        },
      });
      await tx.activity.create({
        data: {
          bugId,
          actorId: userId,
          type: 'ATTACHMENT_ADDED',
          metadata: {
            attachmentId: attachment.id,
            filename: attachment.filename,
          },
        },
      });
      queueEvent(tx, {
        room: `project:${bug.projectId}`,
        name: 'attachments:updated',
        data: { bugId },
      });
      return publicAttachment(attachment);
    });
  } catch (error) {
    await unlink(file.path).catch(() => {});
    throw error;
  }
}
export async function download(userId: string, id: string) {
  const attachment = await db.attachment.findFirst({
    where: { id, bug: { project: { members: { some: { userId } } } } },
  });
  if (!attachment) throw new HttpError(404, 'Attachment not found.');
  return attachment;
}
