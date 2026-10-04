import { unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
export const uploadsDir = resolve('uploads');
export async function deleteUploadFiles(files: string[]) {
  await Promise.all(files.map(async (file) => { const path = resolve(uploadsDir, file); if (dirname(path) !== uploadsDir) throw new Error('Invalid stored attachment path'); try { await unlink(path); } catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) console.error('Could not clean up attachment', error); } }));
}
