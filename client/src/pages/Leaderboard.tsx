import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useWorkspace';
import type { Project } from '@/types/workspace';
import { Card } from '@/components/ui/card';
import { Select, Field } from '@/components/ui/form-controls';
import { Loading, ErrorState } from '@/components/WorkspaceState';
interface Entry {
  id: string;
  name: string;
  title: string;
  level: number;
  earnedXp: number;
  resolved: number;
}
export function Leaderboard() {
  const request = useApi();
  const [selected, setSelected] = useState('');
  const [range, setRange] = useState('all');
  const projects = useQuery({
    queryKey: ['workspace', 'projects'],
    queryFn: () => request<Project[]>('/projects'),
  });
  const projectId = selected || projects.data?.[0]?.id;
  const ranking = useQuery({
    queryKey: ['workspace', 'leaderboard', projectId, range],
    queryFn: () =>
      request<Entry[]>(`/projects/${projectId}/leaderboard?range=${range}`),
    enabled: !!projectId,
  });
  return (
    <>
      <h1 className="text-3xl font-semibold">Leaderboard</h1>
      <p className="mb-7 mt-2 text-sm text-muted-foreground">
        Celebrate verified fixes. Rankings use XP earned in this project.
      </p>
      {projects.isPending ? (
        <Loading />
      ) : projects.isError ? (
        <ErrorState
          error={projects.error}
          retry={() => {
            void projects.refetch();
          }}
        />
      ) : !projectId ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Join or create a project to see its leaderboard.
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-4">
            <Field label="Project">
              <Select
                value={projectId}
                onChange={(event) => setSelected(event.target.value)}
              >
                {projects.data.map((project) => (
                  <option value={project.id} key={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Time range">
              <Select
                value={range}
                onChange={(event) => setRange(event.target.value)}
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="all">All time</option>
              </Select>
            </Field>
          </div>
          {ranking.isPending ? (
            <Loading />
          ) : ranking.isError ? (
            <ErrorState
              error={ranking.error}
              retry={() => {
                void ranking.refetch();
              }}
            />
          ) : (
            <Card className="divide-y">
              {ranking.data.map((member, index) => (
                <div key={member.id} className="flex items-center gap-4 p-5">
                  <span className="font-mono text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {member.level} · {member.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {member.earnedXp} XP
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.resolved} rewarded fixes
                    </p>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </>
  );
}
