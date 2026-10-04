import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, RefreshCw, GitCommit, Play, Search } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  description: string;
  allowedNext: string[];
  rules: string;
  icon: typeof GitCommit;
  color: string;
}

const STATIONS: Station[] = [
  {
    id: 'BACKLOG',
    name: 'Backlog',
    code: 'STATION 1',
    x: 80,
    y: 220,
    description: 'Bugs are captured, numbered sequentially (e.g., SD-14), and safely logged.',
    allowedNext: ['TODO'],
    rules: 'Developers or Reviewers can create bugs. Position ordering is initialized.',
    icon: Search,
    color: 'text-zinc-500 border-zinc-500 bg-zinc-500/10',
  },
  {
    id: 'TODO',
    name: 'To Do',
    code: 'STATION 2',
    x: 230,
    y: 220,
    description: 'Prioritized for immediate execution. Ready for sprint assignment.',
    allowedNext: ['IN_PROGRESS', 'BACKLOG'],
    rules: 'Any project member can move bugs into Todo from Backlog or Reopened.',
    icon: Play,
    color: 'text-blue-500 border-blue-500 bg-blue-500/10',
  },
  {
    id: 'IN_PROGRESS',
    name: 'In Progress',
    code: 'STATION 3',
    x: 390,
    y: 220,
    description: 'Assignee is actively writing fixes, reproducing tests, and inspecting logs.',
    allowedNext: ['REVIEW', 'TODO'],
    rules: 'Assignee develops the patch. Reopened bugs arrive here for triage.',
    icon: GitCommit,
    color: 'text-amber-500 border-amber-500 bg-amber-500/10',
  },
  {
    id: 'REVIEW',
    name: 'Review',
    code: 'STATION 4',
    x: 550,
    y: 220,
    description: 'Fix submitted for verification. Gatekeeper approval required.',
    allowedNext: ['RESOLVED', 'REOPENED', 'IN_PROGRESS'],
    rules: 'Developers CANNOT approve their own bugs. Must be reviewed by Reviewer or Owner.',
    icon: AlertCircle,
    color: 'text-purple-500 border-purple-500 bg-purple-500/10',
  },
  {
    id: 'RESOLVED',
    name: 'Resolved',
    code: 'DESTINATION',
    x: 710,
    y: 220,
    description: 'Approved and verified. Anti-abuse XP is awarded to assignee.',
    allowedNext: ['REOPENED'],
    rules: 'Triggers live Bug Squashed toast, updates streaks, and unlocks achievements.',
    icon: CheckCircle2,
    color: 'text-emerald-500 border-emerald-500 bg-emerald-500/10',
  },
  {
    id: 'REOPENED',
    name: 'Reopened',
    code: 'DETOUR',
    x: 470,
    y: 360,
    description: 'Regression detected or fix failed verification. Loops back to In Progress.',
    allowedNext: ['IN_PROGRESS'],
    rules: 'Only Reviewers and Owners can reopen. Previously awarded XP is NOT revoked or repaid.',
    icon: RefreshCw,
    color: 'text-rose-500 border-rose-500 bg-rose-500/10',
  },
];

export function RouteMap() {
  const [selectedStation, setSelectedStation] = useState<Station>(STATIONS[2]!);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-wider text-primary">
          STATE MACHINE TRANSIT MAP
        </span>
        <h3 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          The Bug Lifecycle Route
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Strict server-side validation. Allowed transitions are mathematically enforced —
          invalid transitions return a clear 400 error.
        </p>
      </div>

      {/* Route Map Visualizer */}
      <div className="w-full max-w-4xl rounded-2xl border-2 border-paper-border bg-paper-card p-6 shadow-xl sm:p-8">
        <div className="relative overflow-x-auto pb-4">
          <svg
            viewBox="0 0 800 440"
            className="w-full min-w-[700px] h-auto select-none"
            aria-label="Bug Lifecycle Transit Map"
          >
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#71717a" />
                <stop offset="25%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="75%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              {/* Arrow marker for detour */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#f43f5e" />
              </marker>
            </defs>

            {/* Dotted Grid Paper Backdrop */}
            <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" className="fill-paper-border" />
            </pattern>
            <rect width="800" height="440" fill="url(#dotGrid)" rx="16" opacity="0.6" />

            {/* Main Lifecycle Highway Track (Shadow) */}
            <path
              d="M 80 220 L 710 220"
              fill="none"
              stroke="hsl(var(--paper-border))"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Main Lifecycle Highway Track (Colored Line) */}
            <motion.path
              d="M 80 220 L 710 220"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />

            {/* Detour Route: Review/Resolved -> Reopened -> In Progress */}
            {/* Detour branch 1: From Review (550, 220) to Reopened (470, 360) */}
            <path
              d="M 550 220 Q 560 330 470 360"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeDasharray="6 6"
              markerEnd="url(#arrowhead)"
            />

            {/* Detour branch 2: From Reopened (470, 360) to In Progress (390, 220) */}
            <path
              d="M 470 360 Q 380 330 390 220"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeDasharray="6 6"
              markerEnd="url(#arrowhead)"
            />

            {/* Detour Label */}
            <text
              x="535"
              y="320"
              fill="#f43f5e"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              DETOUR IF REJECTED
            </text>

            {/* Stations */}
            {STATIONS.map((station) => {
              const isSelected = selectedStation.id === station.id;
              const isDetour = station.id === 'REOPENED';

              return (
                <g
                  key={station.id}
                  onClick={() => setSelectedStation(station)}
                  className="cursor-pointer"
                >
                  {/* Active highlight glow */}
                  {isSelected && (
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r="28"
                      className="fill-primary/20 animate-pulse"
                    />
                  )}

                  {/* Outer station ring */}
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r="18"
                    className={`${
                      isSelected
                        ? 'fill-card stroke-primary stroke-[3]'
                        : isDetour
                        ? 'fill-card stroke-rose-500 stroke-2'
                        : 'fill-card stroke-paper-border stroke-2 hover:stroke-foreground'
                    } transition-colors`}
                  />

                  {/* Inner station dot */}
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r="8"
                    className={
                      isSelected
                        ? 'fill-primary'
                        : isDetour
                        ? 'fill-rose-500'
                        : 'fill-muted-foreground'
                    }
                  />

                  {/* Station Code */}
                  <text
                    x={station.x}
                    y={isDetour ? station.y + 36 : station.y - 32}
                    textAnchor="middle"
                    className="font-mono text-[9px] uppercase font-bold fill-muted-foreground"
                  >
                    {station.code}
                  </text>

                  {/* Station Name */}
                  <text
                    x={station.x}
                    y={isDetour ? station.y + 50 : station.y - 18}
                    textAnchor="middle"
                    className={`font-serif text-xs font-bold ${
                      isSelected ? 'fill-primary text-sm' : 'fill-foreground'
                    }`}
                  >
                    {station.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Station Details Card */}
        <div className="mt-6 rounded-xl border border-paper-border bg-paper/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-border pb-4">
            <div className="flex items-center gap-3">
              <span className={`rounded-lg border p-2 ${selectedStation.color}`}>
                <selectedStation.icon size={20} />
              </span>
              <div>
                <span className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">
                  {selectedStation.code}
                </span>
                <h4 className="font-serif text-xl font-bold tracking-tight text-foreground">
                  {selectedStation.name}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">ALLOWED NEXT:</span>
              <div className="flex gap-1.5">
                {selectedStation.allowedNext.map((next) => (
                  <span
                    key={next}
                    className="rounded bg-primary/20 px-2 py-0.5 font-mono text-xs font-semibold text-primary"
                  >
                    {next}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <span className="font-mono font-semibold uppercase text-muted-foreground">
                Lifecycle Stage:
              </span>
              <p className="mt-1 text-sm text-foreground/90">{selectedStation.description}</p>
            </div>
            <div>
              <span className="font-mono font-semibold uppercase text-primary">
                Enforced Server Rules:
              </span>
              <p className="mt-1 text-sm text-foreground/90">{selectedStation.rules}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
