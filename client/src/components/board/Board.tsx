import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MessageSquare } from 'lucide-react';
import { useApi } from '@/hooks/useWorkspace';
import type { Bug, Status } from '@/types/workspace';
import { statusLabel } from '@/utils/bugs';
import { Loading, ErrorState } from '@/components/WorkspaceState';
import { Button } from '@/components/ui/button';
const columns: Status[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'RESOLVED',
];
const columnFor = (status: Status): Status =>
  status === 'REOPENED' ? 'TODO' : status;
const keyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const rect = args.context.collisionRect;
  if (rect && ['ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
    const candidates = columns
      .map((id) => args.context.droppableRects.get(id))
      .filter(
        (item) =>
          item &&
          (event.code === 'ArrowRight'
            ? item.left > rect.left + 20
            : item.right < rect.right - 20),
      );
    candidates.sort(
      (a, b) => Math.abs(a!.left - rect.left) - Math.abs(b!.left - rect.left),
    );
    const target = candidates[0];
    if (target)
      return {
        x: args.currentCoordinates.x + target.left - rect.left + 12,
        y: args.currentCoordinates.y + target.top - rect.top + 48,
      };
    return undefined;
  }
  return sortableKeyboardCoordinates(event, args);
};
function BugCard({ bug, disabled }: { bug: Bug; disabled: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bug.id, disabled });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-card p-3 ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          {bug.project.key}-{bug.number}
        </span>
        <button
          {...attributes}
          {...listeners}
          aria-label={`Drag ${bug.project.key}-${bug.number}`}
          className="touch-none rounded p-1 text-muted-foreground"
        >
          <GripVertical size={16} />
        </button>
      </div>
      <Link
        to={`/bugs/${bug.id}`}
        className="mt-2 block break-words text-sm font-medium hover:text-primary"
      >
        {bug.title}
      </Link>
      <div className="mt-3 flex flex-wrap gap-1">
        {bug.status === 'REOPENED' && (
          <span className="rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
            Reopened
          </span>
        )}
        {bug.labels.map((label) => (
          <span
            key={label}
            className="rounded bg-secondary px-1.5 py-0.5 text-xs"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className={bug.priority === 'CRITICAL' ? 'text-destructive' : ''}>
          {statusLabel(bug.priority)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {bug._count.comments}
        </span>
        <span
          title={bug.assignee?.name ?? 'Unassigned'}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground"
        >
          {bug.assignee?.name.slice(0, 1) ?? '–'}
        </span>
      </div>
      {bug.dueDate && (
        <p className="mt-2 text-xs text-muted-foreground">
          Due {bug.dueDate.slice(0, 10)}
        </p>
      )}
    </article>
  );
}
function Column({
  status,
  bugs,
  disabled,
}: {
  status: Status;
  bugs: Bug[];
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`min-h-80 w-64 shrink-0 rounded-lg border p-3 ${isOver ? 'border-primary bg-accent/30' : 'bg-muted/40'}`}
    >
      <h2 className="mb-4 flex justify-between text-xs font-semibold uppercase tracking-wide">
        {statusLabel(status)}
        <span className="text-muted-foreground">{bugs.length}</span>
      </h2>
      <SortableContext
        items={bugs.map((bug) => bug.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {bugs.map((bug) => (
            <BugCard key={bug.id} bug={bug} disabled={disabled} />
          ))}
        </div>
      </SortableContext>
      {!bugs.length && (
        <p className="py-10 text-center text-xs text-muted-foreground">
          Drop a bug here
        </p>
      )}
    </section>
  );
}
export function Board({ projectId }: { projectId: string }) {
  const request = useApi();
  const cache = useQueryClient();
  const key = ['workspace', 'board', projectId];
  const [toast, setToast] = useState('');
  const query = useQuery({
    queryKey: key,
    queryFn: () => request<Bug[]>(`/projects/${projectId}/bugs`),
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  );
  const mutation = useMutation({
    mutationFn: ({
      bug,
      status,
      position,
    }: {
      bug: Bug;
      status: Status;
      position: number;
    }) =>
      request(
        `/bugs/${bug.id}/${bug.status === status ? 'position' : 'status'}`,
        'PATCH',
        { status, position },
      ),
    onMutate: async ({ bug, status, position }) => {
      setToast('');
      await cache.cancelQueries({ queryKey: key });
      const before = cache.getQueryData<Bug[]>(key);
      cache.setQueryData<Bug[]>(key, (old) =>
        old?.map((item) =>
          item.id === bug.id ? { ...item, status, position } : item,
        ),
      );
      return { before };
    },
    onError: (error, _variables, context) => {
      if (context?.before) cache.setQueryData(key, context.before);
      setToast(error.message);
    },
    onSettled: () => cache.invalidateQueries({ queryKey: ['workspace'] }),
  });
  function dropped({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || mutation.isPending) return;
    const bug = query.data?.find((item) => item.id === active.id);
    if (!bug) return;
    const target = query.data?.find((item) => item.id === over.id);
    const column = target ? columnFor(target.status) : (over.id as Status);
    if (!columns.includes(column)) return;
    const status = columnFor(bug.status) === column ? bug.status : column;
    const all = (query.data ?? [])
      .filter((item) => columnFor(item.status) === column)
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    const oldIndex = all.findIndex((item) => item.id === bug.id);
    const targetIndex = all.findIndex((item) => item.id === over.id);
    const remaining = all.filter((item) => item.id !== bug.id);
    const index =
      targetIndex < 0
        ? remaining.length
        : oldIndex >= 0
          ? targetIndex
          : remaining.findIndex((item) => item.id === over.id);
    const before = remaining[index - 1]?.position ?? 0;
    const after = remaining[index]?.position;
    const position = after === undefined ? before + 1024 : (before + after) / 2;
    mutation.mutate({ bug, status, position });
  }
  if (query.isPending) return <Loading />;
  if (query.isError)
    return (
      <ErrorState
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  return (
    <>
      <p className="mb-4 text-xs text-muted-foreground">
        Drag a card’s handle, or focus it and use Space and arrow keys. Invalid
        moves are rolled back.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={dropped}
      >
        <div className="flex gap-4 overflow-x-auto pb-5">
          {columns.map((status) => (
            <Column
              key={status}
              status={status}
              disabled={mutation.isPending}
              bugs={query.data
                .filter((bug) => columnFor(bug.status) === status)
                .sort(
                  (a, b) => a.position - b.position || a.id.localeCompare(b.id),
                )}
            />
          ))}
        </div>
      </DndContext>
      {toast && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-destructive bg-card p-4 text-sm shadow-lg"
        >
          <p>{toast}</p>
          <Button size="sm" variant="ghost" onClick={() => setToast('')}>
            Dismiss
          </Button>
        </div>
      )}
    </>
  );
}
