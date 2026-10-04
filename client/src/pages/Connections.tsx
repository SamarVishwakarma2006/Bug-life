import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Network, List, FolderPlus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { RadialGraph } from '@/components/connections/RadialGraph';
import { RecentFixesPanel } from '@/components/connections/RecentFixesPanel';
import { ConnectionsListView } from '@/components/connections/ConnectionsListView';
import type { ConnectionsResponse } from '@/types/connections';

export function Connections() {
  const { token, user } = useAuth();
  const [days, setDays] = useState(14);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  const { data, isLoading, error } = useQuery<ConnectionsResponse>({
    queryKey: ['connections', days],
    queryFn: () => api<ConnectionsResponse>(`/connections?days=${days}`, {}, token ?? undefined),
    enabled: !!token,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-paper-border/60" />
          <div className="h-9 w-32 animate-pulse rounded bg-paper-border/60" />
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 flex h-[600px] items-center justify-center rounded-2xl border-2 border-paper-border bg-paper-card p-6 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 animate-pulse rounded-full border-4 border-dashed border-primary/40" />
              <p className="font-mono text-xs text-muted-foreground animate-pulse">
                Mapping team connections & project activity…
              </p>
            </div>
          </div>
          <div className="lg:col-span-4 h-[600px] animate-pulse rounded-2xl border-2 border-paper-border bg-paper-card" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-2xl border-2 border-dashed border-destructive/40 bg-destructive/5 p-8 max-w-lg mx-auto space-y-3">
          <p className="font-serif text-lg font-bold text-destructive">
            Failed to load connections graph
          </p>
          <p className="text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Please check your connection and try again.'}
          </p>
        </div>
      </div>
    );
  }

  // Check empty state: user has no projects
  const hasProjects = data.nodes.some((n) => n.type === 'PROJECT');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-paper-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
              <Network size={18} />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Team Connections
            </h1>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Personalized interaction network and live resolution feed
          </p>
        </div>

        {/* View Mode Toggle Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-paper-border bg-paper/60 p-1">
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-xs transition-colors ${
                viewMode === 'graph'
                  ? 'bg-primary font-bold text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Network size={14} /> Radial Graph
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary font-bold text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <List size={14} /> List View
            </button>
          </div>
        </div>
      </div>

      {!hasProjects ? (
        /* Empty State */
        <div className="mx-auto max-w-xl rounded-2xl border-2 border-dashed border-paper-border bg-paper-card p-12 text-center shadow-lg space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-paper-border bg-paper text-primary shadow-inner">
            <Sparkles size={28} />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground">
            Join a Project to See Your Connections
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your connection network maps the teammates you share projects with, bugs you
            collaborate on, and recent fixes verified by reviewers.
          </p>
          <div className="pt-2">
            <Button asChild className="gap-2 font-mono text-xs uppercase tracking-wider">
              <Link to="/projects">
                <FolderPlus size={14} /> Browse or Create Projects
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        /* Active Connections View */
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Main Visual: Radial Graph or Accessible List */}
          <div className="lg:col-span-8">
            {viewMode === 'graph' ? (
              <RadialGraph
                meId={user?.id ?? data.me.id}
                nodes={data.nodes}
                edges={data.edges}
                recentFixes={data.recentFixes}
              />
            ) : (
              <ConnectionsListView
                meId={user?.id ?? data.me.id}
                nodes={data.nodes}
                edges={data.edges}
              />
            )}
          </div>

          {/* Right Column: "Fixed Recently" Live Stream */}
          <div className="lg:col-span-4">
            <RecentFixesPanel
              days={days}
              onDaysChange={setDays}
              fixes={data.recentFixes}
            />
          </div>
        </div>
      )}
    </div>
  );
}
