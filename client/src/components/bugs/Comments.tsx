import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApi, useWorkspaceMutation } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import type { Comment } from '@/types/workspace';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Field, Textarea } from '@/components/ui/form-controls';
import { Loading, ErrorState } from '@/components/WorkspaceState';
const schema = z.object({
  body: z.string().trim().min(1, 'Write a comment first.').max(5000),
});
function CommentForm({
  bugId,
  comment,
  onSuccess,
}: {
  bugId: string;
  comment?: Comment;
  onSuccess?: () => void;
}) {
  const request = useApi();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { body: comment?.body ?? '' },
  });
  const save = useWorkspaceMutation(
    (values: z.infer<typeof schema>) =>
      request(
        `/bugs/${bugId}/comments${comment ? `/${comment.id}` : ''}`,
        comment ? 'PUT' : 'POST',
        values,
      ),
    () => {
      reset({ body: '' });
      onSuccess?.();
    },
  );
  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={handleSubmit((values) => save.mutate(values))}
    >
      <Field
        label={comment ? 'Edit comment' : 'Add a comment'}
        error={errors.body?.message}
      >
        <Textarea
          {...register('body')}
          placeholder="Share reproduction steps or an update…"
        />
      </Field>
      <ErrorState error={save.error} />
      <Button size="sm" type="submit" disabled={save.isPending}>
        {save.isPending ? 'Saving…' : comment ? 'Save comment' : 'Post comment'}
      </Button>
    </form>
  );
}
export function Comments({
  bugId,
  isOwner,
}: {
  bugId: string;
  isOwner: boolean;
}) {
  const request = useApi();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState<Comment | null>(null);
  const query = useQuery({
    queryKey: ['workspace', 'comments', bugId],
    queryFn: () => request<Comment[]>(`/bugs/${bugId}/comments`),
  });
  const remove = useWorkspaceMutation(
    (id: string) => request(`/bugs/${bugId}/comments/${id}`, 'DELETE'),
    () => setDeleting(null),
  );
  return (
    <Card className="p-6">
      <h2 className="mb-5 font-semibold">Comments</h2>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <div className="mb-6 space-y-5">
          {!query.data.length && (
            <p className="text-sm text-muted-foreground">
              No comments yet. Start the conversation.
            </p>
          )}
          {query.data.map((comment) => (
            <article key={comment.id} className="border-b pb-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{comment.author.name}</span>
                <time
                  className="text-muted-foreground"
                  dateTime={comment.createdAt}
                >
                  {new Date(comment.createdAt).toLocaleString()}
                </time>
                <div className="ml-auto flex gap-1">
                  {comment.authorId === user?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(comment)}
                    >
                      Edit
                    </Button>
                  )}
                  {(comment.authorId === user?.id || isOwner) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        remove.reset();
                        setDeleting(comment);
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                {comment.body}
              </p>
            </article>
          ))}
        </div>
      )}
      <CommentForm bugId={bugId} />
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Edit your comment"
        description="Update the message you shared with your team."
      >
        {editing && (
          <CommentForm
            key={editing.id}
            bugId={bugId}
            comment={editing}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null);
        }}
        title="Delete comment?"
        description="This comment will be permanently removed. Its activity entry remains."
      >
        <ErrorState error={remove.error} />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setDeleting(null)}
            disabled={remove.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={remove.isPending}
            onClick={() => deleting && remove.mutate(deleting.id)}
          >
            Delete comment
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
