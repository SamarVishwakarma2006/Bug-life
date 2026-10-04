import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  ShieldCheck,
  Code,
  FolderGit2,
  Sparkles,
  Zap,
  ExternalLink,
  Filter,
} from 'lucide-react';
import type {
  ConnectionNode,
  ConnectionEdge,
  RecentFix,
} from '@/types/connections';

interface RadialGraphProps {
  meId: string;
  nodes: ConnectionNode[];
  edges: ConnectionEdge[];
  recentFixes: RecentFix[];
}

interface PositionedNode extends ConnectionNode {
  x: number;
  y: number;
  ring: number;
}

export function RadialGraph({
  meId,
  nodes,
  edges,
  recentFixes,
}: RadialGraphProps) {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<PositionedNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ConnectionEdge | null>(null);

  // Filter toggles
  const [showOwners, setShowOwners] = useState(true);
  const [showReviewers, setShowReviewers] = useState(true);
  const [showDevelopers, setShowDevelopers] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [showFixes, setShowFixes] = useState(true);

  // Deterministic radial layout geometry
  const positionedNodes = useMemo(() => {
    const cx = 400;
    const cy = 400;
    const r1 = 150; // Ring 1: Direct teammates sharing projects with me
    const r2 = 255; // Ring 2: Projects
    const r3 = 345; // Ring 3: Outer ring teammates reached through other projects

    const me = nodes.find((n) => n.id === meId);
    const projects = nodes
      .filter((n) => n.type === 'PROJECT')
      .sort((a, b) => a.id.localeCompare(b.id));

    // Find direct teammates vs secondary teammates
    const myProjectIds = new Set(
      edges.filter((e) => e.source === meId && e.kind === 'MEMBER_OF').map((e) => e.target),
    );

    const teammates = nodes
      .filter((n) => n.type === 'USER' && n.id !== meId)
      .sort((a, b) => a.id.localeCompare(b.id));

    const ring1Teammates: ConnectionNode[] = [];
    const ring3Teammates: ConnectionNode[] = [];

    for (const t of teammates) {
      const userProjects = edges
        .filter((e) => e.source === t.id && e.kind === 'MEMBER_OF')
        .map((e) => e.target);
      const sharesDirectProject = userProjects.some((pId) => myProjectIds.has(pId));
      if (sharesDirectProject) {
        ring1Teammates.push(t);
      } else {
        ring3Teammates.push(t);
      }
    }

    const result: PositionedNode[] = [];

    // Center Node: ME
    if (me) {
      result.push({ ...me, x: cx, y: cy, ring: 0 });
    }

    // Ring 1: Direct teammates
    ring1Teammates.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / Math.max(ring1Teammates.length, 1) - Math.PI / 2;
      result.push({
        ...node,
        x: cx + r1 * Math.cos(angle),
        y: cy + r1 * Math.sin(angle),
        ring: 1,
      });
    });

    // Ring 2: Projects
    projects.forEach((node, i) => {
      const offset = Math.PI / Math.max(projects.length, 1);
      const angle = (2 * Math.PI * i) / Math.max(projects.length, 1) - Math.PI / 2 + offset;
      result.push({
        ...node,
        x: cx + r2 * Math.cos(angle),
        y: cy + r2 * Math.sin(angle),
        ring: 2,
      });
    });

    // Ring 3: Outer ring teammates
    ring3Teammates.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / Math.max(ring3Teammates.length, 1) - Math.PI / 2;
      result.push({
        ...node,
        x: cx + r3 * Math.cos(angle),
        y: cy + r3 * Math.sin(angle),
        ring: 3,
      });
    });

    return result;
  }, [meId, nodes, edges]);

  // Lookup map for fast edge endpoint coordinate queries
  const nodeCoordMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    for (const n of positionedNodes) {
      map.set(n.id, n);
    }
    return map;
  }, [positionedNodes]);

  // Filtered nodes
  const visibleNodes = useMemo(() => {
    return positionedNodes.filter((n) => {
      if (n.id === meId) return true;
      if (n.type === 'PROJECT') return showProjects;
      if (n.role === 'OWNER') return showOwners;
      if (n.role === 'REVIEWER') return showReviewers;
      if (n.role === 'DEVELOPER') return showDevelopers;
      return true;
    });
  }, [positionedNodes, meId, showProjects, showOwners, showReviewers, showDevelopers]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  // Filtered edges
  const visibleEdges = useMemo(() => {
    return edges.filter((e) => {
      if (!visibleNodeIds.has(e.source) || !visibleNodeIds.has(e.target)) return false;
      if (e.kind === 'REVIEWED_APPROVED' && !showFixes) return false;
      return true;
    });
  }, [edges, visibleNodeIds, showFixes]);

  // Map bugKey to fix data for fast edge hover details
  const fixByBugKey = useMemo(() => {
    const map = new Map<string, RecentFix>();
    for (const f of recentFixes) {
      map.set(f.bugKey, f);
    }
    return map;
  }, [recentFixes]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Interactive Legend & Filter Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 w-full rounded-xl border border-paper-border bg-paper/60 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground font-mono">
          <Filter size={14} className="text-primary" />
          <span>FILTER GRAPH:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Owner Filter */}
          <button
            type="button"
            onClick={() => setShowOwners((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all ${
              showOwners
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-500 font-semibold'
                : 'border-paper-border text-muted-foreground opacity-50'
            }`}
          >
            <Crown size={12} /> Owners
          </button>

          {/* Reviewer Filter */}
          <button
            type="button"
            onClick={() => setShowReviewers((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all ${
              showReviewers
                ? 'border-purple-500/50 bg-purple-500/10 text-purple-500 font-semibold'
                : 'border-paper-border text-muted-foreground opacity-50'
            }`}
          >
            <ShieldCheck size={12} /> Reviewers
          </button>

          {/* Developer Filter */}
          <button
            type="button"
            onClick={() => setShowDevelopers((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all ${
              showDevelopers
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-500 font-semibold'
                : 'border-paper-border text-muted-foreground opacity-50'
            }`}
          >
            <Code size={12} /> Developers
          </button>

          {/* Project Filter */}
          <button
            type="button"
            onClick={() => setShowProjects((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all ${
              showProjects
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500 font-semibold'
                : 'border-paper-border text-muted-foreground opacity-50'
            }`}
          >
            <FolderGit2 size={12} /> Projects
          </button>

          {/* Recent Fixes Filter */}
          <button
            type="button"
            onClick={() => setShowFixes((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all ${
              showFixes
                ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                : 'border-paper-border text-muted-foreground opacity-50'
            }`}
          >
            <Zap size={12} /> Fixed Bugs
          </button>
        </div>
      </div>

      {/* SVG Radial Graph Canvas */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border-2 border-paper-border bg-paper-card shadow-2xl">
        <svg
          viewBox="0 0 800 800"
          className="w-full h-auto select-none"
          role="region"
          aria-label="Interactive Radial Connections Graph. Use Tab to move through teammates and projects, Enter to select, Escape to clear."
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelectedNode(null);
              setSelectedEdge(null);
            }
          }}
        >
          <defs>
            {/* Subtle Dotted Paper Texture Pattern */}
            <pattern
              id="radialDotGrid"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" className="fill-paper-border opacity-70" />
            </pattern>

            {/* Glowing filter for center ME node */}
            <filter id="glowMe" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Dotted Paper Surface */}
          <rect width="800" height="800" fill="url(#radialDotGrid)" rx="16" />

          {/* Concentric Guide Rings */}
          <circle
            cx="400"
            cy="400"
            r="150"
            fill="none"
            stroke="hsl(var(--paper-border))"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="opacity-70"
          />
          <circle
            cx="400"
            cy="400"
            r="255"
            fill="none"
            stroke="hsl(var(--paper-border))"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="opacity-70"
          />
          <circle
            cx="400"
            cy="400"
            r="345"
            fill="none"
            stroke="hsl(var(--paper-border))"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="opacity-70"
          />

          {/* Ring Labels */}
          <text
            x="400"
            y="242"
            textAnchor="middle"
            className="fill-muted-foreground/60 font-mono text-[9px] uppercase font-semibold"
          >
            Ring 1 · Direct Teammates
          </text>
          <text
            x="400"
            y="138"
            textAnchor="middle"
            className="fill-muted-foreground/60 font-mono text-[9px] uppercase font-semibold"
          >
            Ring 2 · Shared Projects
          </text>
          <text
            x="400"
            y="48"
            textAnchor="middle"
            className="fill-muted-foreground/60 font-mono text-[9px] uppercase font-semibold"
          >
            Ring 3 · Extended Network
          </text>

          {/* CURVED EDGES */}
          <g id="edges-layer">
            {visibleEdges.map((edge) => {
              const src = nodeCoordMap.get(edge.source);
              const tgt = nodeCoordMap.get(edge.target);
              if (!src || !tgt) return null;

              // Quadratic bezier curve control point offset
              const midX = (src.x + tgt.x) / 2 + (src.y - tgt.y) * 0.15;
              const midY = (src.y + tgt.y) / 2 + (tgt.x - src.x) * 0.15;

              const isFix = edge.kind === 'REVIEWED_APPROVED';
              const isSelected = selectedEdge?.id === edge.id;

              return (
                <g key={edge.id} className="cursor-pointer" onClick={() => setSelectedEdge(edge)}>
                  {/* Outer glow stroke for selected edge */}
                  {isSelected && (
                    <path
                      d={`M ${src.x} ${src.y} Q ${midX} ${midY} ${tgt.x} ${tgt.y}`}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="5"
                      strokeOpacity="0.4"
                    />
                  )}

                  {/* Base Curved Line */}
                  <path
                    d={`M ${src.x} ${src.y} Q ${midX} ${midY} ${tgt.x} ${tgt.y}`}
                    fill="none"
                    stroke={
                      isFix
                        ? '#10b981'
                        : edge.kind === 'MEMBER_OF'
                        ? 'hsl(var(--paper-border))'
                        : '#3b82f6'
                    }
                    strokeWidth={isFix ? 2.5 : 1.5}
                    strokeDasharray={edge.kind === 'MEMBER_OF' ? '3 3' : undefined}
                    className="transition-all hover:stroke-primary hover:stroke-width-3"
                    opacity={isSelected ? 1 : isFix ? 0.9 : 0.6}
                  />

                  {/* Pulsing Fix Badge on REVIEWED_APPROVED edge */}
                  {isFix && edge.bugKey && (
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const fix = fixByBugKey.get(edge.bugKey!);
                        if (fix) {
                          navigate(`/bugs/${fix.bugId}`);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <circle r="14" className="fill-emerald-500/20 animate-ping" />
                      <rect
                        x="-30"
                        y="-10"
                        width="60"
                        height="20"
                        rx="10"
                        className="fill-card stroke-emerald-500 stroke-1.5 shadow-md"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        className="fill-emerald-500 font-mono text-[9px] font-bold"
                      >
                        {edge.bugKey} +{edge.xp}XP
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* NODES LAYER */}
          <g id="nodes-layer">
            {visibleNodes.map((node) => {
              const isMe = node.id === meId;
              const isSelected = selectedNode?.id === node.id;
              const isProject = node.type === 'PROJECT';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.label} (${node.type}${node.role ? `, ${node.role}` : ''})`}
                  onClick={() => {
                    setSelectedNode(node);
                    if (isProject) {
                      navigate(`/projects/${node.id}`);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedNode(node);
                      if (isProject) {
                        navigate(`/projects/${node.id}`);
                      }
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  {/* Glowing halo for ME node */}
                  {isMe && (
                    <>
                      <circle r="36" className="fill-primary/20 animate-pulse" />
                      <circle
                        r="30"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="animate-spin-slow"
                      />
                    </>
                  )}

                  {/* Active Selection Ring */}
                  {isSelected && !isMe && (
                    <circle r="26" className="fill-primary/30 animate-pulse" />
                  )}

                  {/* Node Circle Shape */}
                  <circle
                    r={isMe ? 24 : isProject ? 20 : 18}
                    className={`transition-colors shadow-lg ${
                      isMe
                        ? 'fill-primary stroke-primary-foreground stroke-2'
                        : isProject
                        ? 'fill-card stroke-emerald-500 stroke-2'
                        : node.role === 'OWNER'
                        ? 'fill-card stroke-amber-500 stroke-2'
                        : node.role === 'REVIEWER'
                        ? 'fill-card stroke-purple-500 stroke-2'
                        : 'fill-card stroke-blue-500 stroke-2'
                    }`}
                  />

                  {/* Icon Inside Node */}
                  {isMe ? (
                    <text
                      y="4"
                      textAnchor="middle"
                      className="fill-primary-foreground font-serif font-black text-xs"
                    >
                      YOU
                    </text>
                  ) : isProject ? (
                    <FolderGit2
                      x="-8"
                      y="-8"
                      size={16}
                      className="text-emerald-500 pointer-events-none"
                    />
                  ) : node.role === 'OWNER' ? (
                    <Crown
                      x="-8"
                      y="-8"
                      size={16}
                      className="text-amber-500 pointer-events-none"
                    />
                  ) : node.role === 'REVIEWER' ? (
                    <ShieldCheck
                      x="-8"
                      y="-8"
                      size={16}
                      className="text-purple-500 pointer-events-none"
                    />
                  ) : (
                    <Code
                      x="-8"
                      y="-8"
                      size={16}
                      className="text-blue-500 pointer-events-none"
                    />
                  )}

                  {/* Node Label Below */}
                  <text
                    y={isMe ? 38 : isProject ? 34 : 32}
                    textAnchor="middle"
                    className={`font-serif text-[11px] font-bold ${
                      isMe
                        ? 'fill-primary text-xs font-black'
                        : isSelected
                        ? 'fill-primary'
                        : 'fill-foreground'
                    }`}
                  >
                    {node.label}
                  </text>

                  {/* Subtext: Key for project, Role for teammate */}
                  <text
                    y={isMe ? 49 : isProject ? 45 : 43}
                    textAnchor="middle"
                    className="font-mono text-[9px] uppercase font-medium fill-muted-foreground"
                  >
                    {isMe
                      ? `LV ${node.level ?? 1} · ${node.xp ?? 0}XP`
                      : isProject
                      ? `KEY: ${node.key}`
                      : node.role}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Drawer / Info Card overlay */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md rounded-xl border border-paper-border bg-paper-card/95 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-paper-border bg-paper">
                    {selectedNode.id === meId ? (
                      <Sparkles className="text-primary" size={20} />
                    ) : selectedNode.type === 'PROJECT' ? (
                      <FolderGit2 className="text-emerald-500" size={20} />
                    ) : selectedNode.role === 'OWNER' ? (
                      <Crown className="text-amber-500" size={20} />
                    ) : selectedNode.role === 'REVIEWER' ? (
                      <ShieldCheck className="text-purple-500" size={20} />
                    ) : (
                      <Code className="text-blue-500" size={20} />
                    )}
                  </div>
                  <div>
                    <h5 className="font-serif text-base font-bold text-foreground">
                      {selectedNode.label}
                    </h5>
                    <p className="font-mono text-xs text-muted-foreground uppercase">
                      {selectedNode.type === 'PROJECT'
                        ? `PROJECT (KEY: ${selectedNode.key})`
                        : `${selectedNode.role ?? 'MEMBER'} · LEVEL ${selectedNode.level ?? 1} (${selectedNode.xp ?? 0} XP)`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Dismiss details"
                >
                  ✕
                </button>
              </div>

              {selectedNode.type === 'PROJECT' ? (
                <div className="mt-3 flex items-center justify-between border-t border-paper-border pt-2 text-xs">
                  <span className="text-muted-foreground font-mono">Shared Team Workspace</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${selectedNode.id}`)}
                    className="inline-flex items-center gap-1 font-mono font-semibold text-primary hover:underline"
                  >
                    Open Project <ExternalLink size={12} />
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between border-t border-paper-border pt-2 text-xs">
                  <span className="text-muted-foreground font-mono">Teammate in Shared Projects</span>
                  <span className="text-primary font-semibold font-mono">
                    {selectedNode.id === meId ? 'Your Profile' : 'Connected Teammate'}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Selected Edge Details overlay */}
          {selectedEdge && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute top-4 right-4 sm:max-w-xs rounded-xl border border-paper-border bg-paper-card/95 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[10px] font-bold uppercase text-primary">
                  {selectedEdge.kind.replace('_', ' ')}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEdge(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {selectedEdge.bugKey && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {selectedEdge.bugKey}
                    </span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-bold text-emerald-500">
                      +{selectedEdge.xp} XP
                    </span>
                  </div>
                  {selectedEdge.priority && (
                    <span className="inline-block rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-[10px] uppercase font-bold text-destructive">
                      {selectedEdge.priority}
                    </span>
                  )}
                  {fixByBugKey.get(selectedEdge.bugKey) && (
                    <button
                      type="button"
                      onClick={() => {
                        const fix = fixByBugKey.get(selectedEdge.bugKey!);
                        if (fix) navigate(`/bugs/${fix.bugId}`);
                      }}
                      className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                    >
                      View Bug Details <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
