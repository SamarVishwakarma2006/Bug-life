import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, Select } from '@/components/ui/form-controls';
import { Loading, ErrorState } from '@/components/WorkspaceState';
import { BugForm } from '@/components/bugs/BugForm';
import { useApi } from '@/hooks/useWorkspace';
import type { Project, Person } from '@/types/workspace';
interface Results {
  bugs: {
    id: string;
    title: string;
    number: number;
    project: { key: string };
  }[];
  projects: { id: string; name: string; key: string }[];
  members: Person[];
}
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const request = useApi();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setMode('search');
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(q.trim()), 200);
    return () => clearTimeout(timer);
  }, [q]);
  const projects = useQuery({
    queryKey: ['workspace', 'projects'],
    queryFn: () => request<Project[]>('/projects'),
    enabled: open,
  });
  const results = useQuery({
    queryKey: ['workspace', 'search', search],
    queryFn: () => request<Results>(`/search?q=${encodeURIComponent(search)}`),
    enabled: open && !!search,
  });
  const project =
    projects.data?.find((item) => item.id === selected) ?? projects.data?.[0];
  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };
  return (
    <>
      <Button
        variant="ghost"
        className="gap-2 text-muted-foreground"
        aria-label="Search and commands"
        onClick={() => {
          setMode('search');
          setOpen(true);
        }}
      >
        <Search size={17} />
        <span className="hidden lg:inline">Search…</span>
        <kbd className="hidden rounded border px-1.5 py-0.5 text-xs sm:inline">
          Ctrl K
        </kbd>
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={mode === 'create' ? 'Create Bug' : 'Search and commands'}
        description={
          mode === 'create'
            ? 'Choose a project and report a bug.'
            : 'Find bugs, projects, and teammates. Use Tab to navigate commands.'
        }
      >
        {mode === 'create' ? (
          <>
            {projects.isPending ? (
              <Loading />
            ) : projects.isError ? (
              <ErrorState error={projects.error} />
            ) : project ? (
              <>
                <Field label="Project">
                  <Select
                    value={project.id}
                    onChange={(event) => setSelected(event.target.value)}
                  >
                    {projects.data.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="mt-5">
                  <BugForm
                    key={project.id}
                    projectId={project.id}
                    members={project.members}
                    onSuccess={() => go(`/projects/${project.id}?tab=bugs`)}
                  />
                </div>
              </>
            ) : (
              <Button onClick={() => go('/projects')}>
                Create a project first
              </Button>
            )}
          </>
        ) : (
          <>
            <Input
              ref={input}
              aria-label="Global search"
              placeholder="Search bugs, projects, or members…"
              maxLength={200}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              autoFocus
            />
            {!q && (
              <div className="my-4 grid gap-1">
                {[
                  ['Create Bug', () => setMode('create')],
                  ['Search Bug', () => input.current?.focus()],
                  ['Open Project', () => go('/projects')],
                  ['My Bugs', () => go('/my-bugs')],
                  ['Notifications', () => go('/notifications')],
                  ['Leaderboard', () => go('/leaderboard')],
                ].map(([label, action]) => (
                  <Button
                    key={String(label)}
                    variant="ghost"
                    className="justify-start"
                    onClick={action as () => void}
                  >
                    {label as string}
                  </Button>
                ))}
              </div>
            )}
            {search &&
              (results.isPending ? (
                <Loading />
              ) : results.isError ? (
                <ErrorState
                  error={results.error}
                  retry={() => {
                    void results.refetch();
                  }}
                />
              ) : (
                <div className="mt-4 space-y-2">
                  {results.data.bugs.map((bug) => (
                    <Button
                      key={bug.id}
                      variant="ghost"
                      className="h-auto w-full justify-start whitespace-normal text-left"
                      onClick={() => go(`/bugs/${bug.id}`)}
                    >
                      {bug.project.key}-{bug.number} · {bug.title}
                    </Button>
                  ))}
                  {results.data.projects.map((project) => (
                    <Button
                      key={project.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => go(`/projects/${project.id}`)}
                    >
                      {project.key} · {project.name}
                    </Button>
                  ))}
                  {results.data.members.map((member) => (
                    <p key={member.id} className="px-4 py-2 text-sm">
                      {member.name}
                      <span className="block text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </p>
                  ))}
                  {!results.data.bugs.length &&
                    !results.data.projects.length &&
                    !results.data.members.length && (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No accessible results found.
                      </p>
                    )}
                </div>
              ))}
          </>
        )}
      </Dialog>
    </>
  );
}
