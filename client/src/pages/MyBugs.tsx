import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useWorkspace';
import type { Bug } from '@/types/workspace';
import { BugList } from '@/components/bugs/BugList';
import { Loading, ErrorState } from '@/components/WorkspaceState';
export function MyBugs() {
  const request = useApi();
  const query = useQuery({
    queryKey: ['workspace', 'my-bugs'],
    queryFn: () => request<Bug[]>('/bugs/mine'),
  });
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">My Bugs</h1>
      <p className="mb-7 mt-2 text-sm text-muted-foreground">
        Bugs assigned to you across your projects.
      </p>
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
        <BugList bugs={query.data} />
      )}
    </>
  );
}
