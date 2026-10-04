import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Zap, Clock } from 'lucide-react';
import type { RecentFix } from '@/types/connections';

interface RecentFixesPanelProps {
  days: number;
  onDaysChange: (days: number) => void;
  fixes: RecentFix[];
}

export function RecentFixesPanel({
  days,
  onDaysChange,
  fixes,
}: RecentFixesPanelProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col rounded-2xl border-2 border-paper-border bg-paper-card p-5 shadow-xl">
      {/* Header and 7/14/30 Day Filter Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-border pb-4">
        <div>
          <h4 className="font-serif text-lg font-bold text-foreground">
            Fixed Recently
          </h4>
          <p className="font-mono text-xs text-muted-foreground">
            Live stream of approved bug resolutions
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-paper-border bg-paper/60 p-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDaysChange(d)}
              className={`rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                days === d
                  ? 'bg-primary font-bold text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* List of Recent Fixes */}
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto max-h-[560px] pr-1">
        {fixes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
            <CheckCircle2 size={32} className="opacity-40" />
            <p className="font-serif text-sm">No bugs resolved in the last {days} days.</p>
            <p className="font-mono text-xs text-muted-foreground/80">
              When a reviewer approves a fix, it pulses on the graph live.
            </p>
          </div>
        ) : (
          fixes.map((fix) => {
            const dateStr = new Date(fix.resolvedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={fix.bugId}
                onClick={() => navigate(`/bugs/${fix.bugId}`)}
                className="group cursor-pointer rounded-xl border border-paper-border bg-paper/50 p-3.5 transition-all hover:border-primary/60 hover:bg-paper hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                      {fix.bugKey}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        fix.priority === 'CRITICAL'
                          ? 'bg-destructive/20 text-destructive'
                          : fix.priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {fix.priority}
                    </span>
                  </div>

                  {fix.xpAwarded && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-500">
                      <Zap size={11} />
                      +{fix.priority === 'CRITICAL' ? 50 : fix.priority === 'HIGH' ? 35 : fix.priority === 'MEDIUM' ? 20 : 10} XP
                    </span>
                  )}
                </div>

                <p className="mt-1.5 line-clamp-2 font-serif text-sm font-medium text-foreground/90">
                  {fix.title}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-paper-border/60 pt-2 text-[11px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1 truncate max-w-[200px]">
                    <span className="truncate text-foreground font-medium">{fix.resolver.name}</span>
                    <ArrowRight size={10} className="text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground font-medium">{fix.reviewer.name}</span>
                  </div>

                  <span className="inline-flex items-center gap-1 shrink-0">
                    <Clock size={11} /> {dateStr}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
