import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApi, useWorkspaceMutation } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-controls';
import { Loading, ErrorState } from '@/components/WorkspaceState';
interface Attachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
}
const origin = new URL(
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
).origin;
function ImagePreview({ file }: { file: Attachment }) {
  const { token } = useAuth();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    void fetch(`${origin}/uploads/${file.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Image unavailable.');
        const blob = await response.blob();
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : 'Image unavailable.',
          );
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, token]);
  return (
    <div className="rounded-lg border p-3">
      {url ? (
        <a href={url} download={file.filename}>
          <img
            className="h-36 w-full rounded object-contain"
            src={url}
            alt={file.filename}
          />
        </a>
      ) : (
        <p className="py-8 text-center text-xs text-muted-foreground">
          {error || 'Loading image…'}
        </p>
      )}
      <p className="mt-2 break-all text-xs">{file.filename}</p>
      <p className="text-xs text-muted-foreground">
        {Math.ceil(file.size / 1024)} KB
      </p>
    </div>
  );
}
const schema = z.object({
  file: z
    .custom<FileList>((value) => value instanceof FileList)
    .refine(
      (value) =>
        value.length === 1 && !!value[0] && value[0].size <= 5 * 1024 * 1024,
      'Choose one image, up to 5 MB.',
    ),
});
export function Attachments({ bugId }: { bugId: string }) {
  const request = useApi();
  const { token } = useAuth();
  const query = useQuery({
    queryKey: ['workspace', 'attachments', bugId],
    queryFn: () => request<Attachment[]>(`/bugs/${bugId}/attachments`),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const upload = useWorkspaceMutation(
    async ({ file }: z.infer<typeof schema>) => {
      const body = new FormData();
      body.append('file', file[0]!);
      const response = await fetch(`${origin}/api/bugs/${bugId}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const result = (await response.json()) as { error?: { message: string } };
      if (!response.ok)
        throw new Error(result.error?.message ?? 'Upload failed.');
      return result;
    },
    () => reset(),
  );
  return (
    <Card className="p-6">
      <h2 className="mb-4 font-semibold">Attachments</h2>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : query.data.length ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {query.data.map((file) => (
            <ImagePreview file={file} key={file.id} />
          ))}
        </div>
      ) : (
        <p className="mb-5 text-sm text-muted-foreground">
          No screenshots attached yet.
        </p>
      )}
      <form
        onSubmit={handleSubmit((values) => upload.mutate(values))}
        className="space-y-3"
      >
        <Field
          label="Image (PNG, JPEG, GIF, WebP; max 5 MB)"
          error={errors.file?.message}
        >
          <Input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            {...register('file')}
          />
        </Field>
        <ErrorState error={upload.error} />
        <Button size="sm" type="submit" disabled={upload.isPending}>
          {upload.isPending ? 'Uploading…' : 'Upload image'}
        </Button>
      </form>
    </Card>
  );
}
