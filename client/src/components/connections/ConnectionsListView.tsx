import { useNavigate } from 'react-router-dom';
import { Crown, ShieldCheck, Code, FolderGit2, ExternalLink } from 'lucide-react';
import type { ConnectionNode, ConnectionEdge } from '@/types/connections';

interface ConnectionsListViewProps {
  meId: string;
  nodes: ConnectionNode[];
  edges: ConnectionEdge[];
}

export function ConnectionsListView({
  meId,
  nodes,
  edges,
}: ConnectionsListViewProps) {
  const navigate = useNavigate();

  const teammates = nodes.filter((n) => n.type === 'USER');
  const projects = nodes.filter((n) => n.type === 'PROJECT');

  return (
    <div className="space-y-8 rounded-2xl border-2 border-paper-border bg-paper-card p-6 shadow-xl">
      {/* Teammates Section */}
      <div>
        <h4 className="font-serif text-xl font-bold text-foreground">
          Teammates & Collaborators ({teammates.length})
        </h4>
        <p className="font-mono text-xs text-muted-foreground">
          Engineers sharing active project workspaces with you
        </p>

        <div className="mt-4 divide-y divide-paper-border overflow-hidden rounded-xl border border-paper-border bg-paper/40">
          {teammates.map((user) => {
            const isMe = user.id === meId;
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-paper/80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-paper-border bg-paper shadow-sm">
                    {user.role === 'OWNER' ? (
                      <Crown size={18} className="text-amber-500" />
                    ) : user.role === 'REVIEWER' ? (
                      <ShieldCheck size={18} className="text-purple-500" />
                    ) : (
                      <Code size={18} className="text-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-foreground">
                        {user.label}
                      </span>
                      {isMe && (
                        <span className="rounded bg-primary/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-primary">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground uppercase">
                      {user.role ?? 'DEVELOPER'} · LEVEL {user.level ?? 1} ({user.xp ?? 0} XP)
                    </span>
                  </div>
                </div>

                <div className="font-mono text-xs text-muted-foreground">
                  {edges.filter((e) => e.source === user.id && e.kind === 'MEMBER_OF').length} Projects
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <h4 className="font-serif text-xl font-bold text-foreground">
          Shared Projects ({projects.length})
        </h4>
        <p className="font-mono text-xs text-muted-foreground">
          Workspaces you have access to
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-paper-border bg-paper/50 p-4 transition-all hover:border-primary hover:bg-paper hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-paper-border bg-paper">
                  <FolderGit2 size={20} className="text-emerald-500" />
                </div>
                <div>
                  <h5 className="font-serif font-bold text-foreground">
                    {project.label}
                  </h5>
                  <span className="font-mono text-xs text-primary font-semibold">
                    KEY: {project.key}
                  </span>
                </div>
              </div>

              <ExternalLink size={16} className="text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
