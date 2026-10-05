import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import {
  Crown,
  ShieldCheck,
  Code,
  FolderGit2,
  ZoomIn,
  ZoomOut,
  Maximize,
  X,
  Move,
  ArrowUpRight,
  Network,
} from 'lucide-react';
import type {
  ConnectionNode,
  ConnectionEdge,
  RecentFix,
} from '@/types/connections';
import {
  layoutConnections,
  fitConnections,
  WIDTH,
  HEIGHT,
} from './graphLayout';
import type { GraphNode } from './graphLayout';

const categories = [
  'OWNER',
  'REVIEWER',
  'DEVELOPER',
  'PROJECT',
  'FIXES',
] as const;
const colors = {
  OWNER: '#d69b18',
  REVIEWER: '#a277ed',
  DEVELOPER: '#4a90ed',
  PROJECT: '#2bb88e',
  FIXES: '#2bb88e',
};
const labels = {
  OWNER: 'Owners',
  REVIEWER: 'Reviewers',
  DEVELOPER: 'Developers',
  PROJECT: 'Projects',
  FIXES: 'Reviewed fixes',
};
type Camera = { x: number; y: number; scale: number };
type Selection = { kind: 'node' | 'edge'; id: string } | null;

function NodeIcon({
  node,
  ...props
}: {
  node: ConnectionNode;
  size?: number;
  x?: number;
  y?: number;
}) {
  const Icon =
    node.type === 'PROJECT'
      ? FolderGit2
      : node.role === 'OWNER'
        ? Crown
        : node.role === 'REVIEWER'
          ? ShieldCheck
          : Code;
  return <Icon {...props} aria-hidden="true" />;
}

export function RadialGraph({
  meId,
  nodes,
  edges,
  recentFixes,
}: {
  meId: string;
  nodes: ConnectionNode[];
  edges: ConnectionEdge[];
  recentFixes: RecentFix[];
}) {
  const reducedMotion = useReducedMotion();
  const [hidden, setHidden] = useState<string[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [camera, setCamera] = useState<Camera | null>(null);
  const [panning, setPanning] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    camera: Camera;
    moved: boolean;
  } | null>(null);
  const positioned = useMemo(
    () => layoutConnections(nodes, meId),
    [nodes, meId],
  );
  const visible = positioned.filter(
    (n) =>
      n.id === meId ||
      !hidden.includes(
        n.type === 'PROJECT' ? 'PROJECT' : (n.role ?? 'DEVELOPER'),
      ),
  );
  const map = new Map(visible.map((n) => [n.id, n]));
  const visibleEdges = edges.filter(
    (e) =>
      map.has(e.source) &&
      map.has(e.target) &&
      !(hidden.includes('FIXES') && e.kind === 'REVIEWED_APPROVED'),
  );
  const overview = fitConnections(visible);
  const nodeScale = Math.min(2, Math.max(1, 1.5 / overview.scale));
  const view = camera ?? overview;
  const selectedNode =
    selection?.kind === 'node' ? map.get(selection.id) : undefined;
  const selectedEdge =
    selection?.kind === 'edge'
      ? visibleEdges.find((e) => e.id === selection.id)
      : undefined;
  const connections = selectedNode
    ? visibleEdges.filter(
        (e) => e.source === selectedNode.id || e.target === selectedNode.id,
      )
    : [];
  const neighbors = new Set(connections.flatMap((e) => [e.source, e.target]));
  const selectedFix = selectedEdge?.bugKey
    ? recentFixes.find((f) => f.bugKey === selectedEdge.bugKey)
    : undefined;
  const controlClass =
    'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm hover:bg-muted disabled:opacity-40';

  function reset() {
    setCamera(null);
    setSelection(null);
  }
  function focusNode(node: GraphNode) {
    const scale = Math.max(
      overview.scale,
      Math.min(4, (WIDTH / (svgRef.current?.clientWidth ?? WIDTH)) * 1.2),
      1.8,
    );
    setSelection({ kind: 'node', id: node.id });
    setCamera({
      x: WIDTH / 2 - node.x * scale,
      y: HEIGHT / 2 - node.y * scale,
      scale,
    });
  }
  function focusEdge(edge: ConnectionEdge) {
    const endpoints = [map.get(edge.source), map.get(edge.target)].filter(
      (n): n is GraphNode => !!n,
    );
    setSelection({ kind: 'edge', id: edge.id });
    setCamera(fitConnections(endpoints));
  }
  function zoom(factor: number) {
    const scale = Math.max(
      overview.scale * 0.5,
      Math.min(4, view.scale * factor),
    );
    const ratio = scale / view.scale;
    setCamera({
      x: WIDTH / 2 - (WIDTH / 2 - view.x) * ratio,
      y: HEIGHT / 2 - (HEIGHT / 2 - view.y) * ratio,
      scale,
    });
  }
  function point(clientX: number, clientY: number) {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = clientX;
    p.y = clientY;
    return p.matrixTransform(matrix.inverse());
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      aria-label="Connections explorer"
      onKeyDown={(e) => {
        if (e.key === 'Escape') reset();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 sm:px-6">
        <div>
          <h2 className="font-semibold">Your team, connected</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {visible.length} nodes · {visibleEdges.length} connections · Click
            to explore
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Graph filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={!hidden.includes(category)}
              onClick={() => {
                setHidden((current) =>
                  current.includes(category)
                    ? current.filter((c) => c !== category)
                    : [...current, category],
                );
                reset();
              }}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${hidden.includes(category) ? 'border-border text-muted-foreground opacity-50' : 'border-border bg-muted text-foreground'}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: colors[category] }}
              />
              {labels[category]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative min-w-0 bg-background">
          <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
            <button
              className={controlClass}
              onClick={() => zoom(1.35)}
              aria-label="Zoom in"
              disabled={view.scale >= 4}
            >
              <ZoomIn size={16} />
            </button>
            <button
              className={controlClass}
              onClick={() => zoom(1 / 1.35)}
              aria-label="Zoom out"
              disabled={view.scale <= overview.scale * 0.5}
            >
              <ZoomOut size={16} />
            </button>
            <button className={controlClass} onClick={reset}>
              <Maximize size={15} /> Fit graph
            </button>
            <span
              className="flex items-center rounded-lg bg-card/90 px-2 font-mono text-xs text-muted-foreground"
              aria-label="Zoom level"
            >
              {Math.round((view.scale / overview.scale) * 100)}%
            </span>
          </div>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className={`h-[520px] w-full touch-none select-none sm:h-[640px] ${panning ? 'cursor-grabbing' : 'cursor-grab'}`}
            role="region"
            tabIndex={0}
            aria-label="Interactive connections graph. Tab to nodes or connections and press Enter to zoom. Drag the background to pan. Escape fits the graph."
            onKeyDown={(e) => {
              const moves: Record<string, [number, number]> = {
                ArrowLeft: [80, 0],
                ArrowRight: [-80, 0],
                ArrowUp: [0, 80],
                ArrowDown: [0, -80],
              };
              const delta = moves[e.key];
              if (delta) {
                e.preventDefault();
                setCamera({
                  ...view,
                  x: view.x + delta[0],
                  y: view.y + delta[1],
                });
              }
            }}
            onPointerDown={(e) => {
              if (
                e.button !== 0 ||
                (e.target as Element).closest('[data-interactive]')
              )
                return;
              const p = point(e.clientX, e.clientY);
              drag.current = { x: p.x, y: p.y, camera: view, moved: false };
              setPanning(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const start = drag.current;
              if (!start) return;
              const p = point(e.clientX, e.clientY);
              if (Math.hypot(p.x - start.x, p.y - start.y) > 5)
                start.moved = true;
              if (start.moved)
                setCamera({
                  ...start.camera,
                  x: start.camera.x + p.x - start.x,
                  y: start.camera.y + p.y - start.y,
                });
            }}
            onPointerUp={(e) => {
              const start = drag.current;
              drag.current = null;
              setPanning(false);
              if (e.currentTarget.hasPointerCapture(e.pointerId))
                e.currentTarget.releasePointerCapture(e.pointerId);
              if (start && !start.moved) {
                const scale = Math.min(4, start.camera.scale * 1.6);
                setCamera({
                  x:
                    WIDTH / 2 -
                    ((start.x - start.camera.x) / start.camera.scale) * scale,
                  y:
                    HEIGHT / 2 -
                    ((start.y - start.camera.y) / start.camera.scale) * scale,
                  scale,
                });
              }
            }}
            onPointerCancel={() => {
              drag.current = null;
              setPanning(false);
            }}
          >
            <defs>
              <pattern
                id="connection-dots"
                width="28"
                height="28"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1" className="fill-border" />
              </pattern>
            </defs>
            <rect width={WIDTH} height={HEIGHT} fill="url(#connection-dots)" />
            <g
              transform={`translate(${view.x},${view.y}) scale(${view.scale})`}
              style={{ transformOrigin: '0px 0px', transition: panning || reducedMotion ? 'none' : 'transform 450ms cubic-bezier(0.22,1,0.36,1)' }}
            >
              {visibleEdges.map((edge, index) => {
                const a = map.get(edge.source)!;
                const b = map.get(edge.target)!;
                const bend = 0.12 + (index % 3) * 0.04;
                const d =
                  a.id === b.id
                    ? `M ${a.x + 24} ${a.y - 20} C ${a.x + 130} ${a.y - 150} ${a.x - 130} ${a.y - 150} ${a.x - 24} ${a.y - 20}`
                    : `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2 + (a.y - b.y) * bend} ${(a.y + b.y) / 2 + (b.x - a.x) * bend} ${b.x} ${b.y}`;
                const active =
                  selectedEdge?.id === edge.id ||
                  (selectedNode &&
                    (edge.source === selectedNode.id ||
                      edge.target === selectedNode.id));
                return (
                  <g
                    key={edge.id}
                    data-interactive="true"
                    role="button"
                    tabIndex={0}
                    aria-label={`${a.label} to ${b.label}: ${edge.bugKey ?? edge.kind.replaceAll('_', ' ').toLowerCase()}`}
                    aria-pressed={selectedEdge?.id === edge.id}
                    onClick={() => focusEdge(edge)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        focusEdge(edge);
                      }
                    }}
                    className="group cursor-pointer focus:outline-none"
                  >
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="18"
                    />
                    <path
                      d={d}
                      fill="none"
                      stroke={
                        active
                          ? 'hsl(var(--primary))'
                          : edge.kind === 'REVIEWED_APPROVED'
                            ? '#2bb88e'
                            : 'hsl(var(--muted-foreground))'
                      }
                      strokeWidth={active ? 3 : 1.5}
                      strokeDasharray={
                        edge.kind === 'MEMBER_OF' ? '5 7' : undefined
                      }
                      opacity={selection && !active ? 0.12 : active ? 1 : 0.35}
                      className="transition-opacity group-hover:opacity-100 group-focus:opacity-100 group-focus:stroke-primary"
                    />
                  </g>
                );
              })}
              {visible.map((node) => {
                const active = selectedNode?.id === node.id;
                const color =
                  node.id === meId
                    ? 'hsl(var(--primary))'
                    : colors[
                        node.type === 'PROJECT'
                          ? 'PROJECT'
                          : (node.role ?? 'DEVELOPER')
                      ];
                return (
                  <g
                    key={node.id}
                    data-interactive="true"
                    transform={`translate(${node.x},${node.y}) scale(${nodeScale})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Explore ${node.label}, ${node.type === 'PROJECT' ? 'project' : (node.role?.toLowerCase() ?? 'teammate')}`}
                    aria-pressed={active}
                    onClick={() => focusNode(node)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        focusNode(node);
                      }
                    }}
                    className="group cursor-pointer focus:outline-none"
                    opacity={
                      selectedNode && !neighbors.has(node.id) && !active
                        ? 0.35
                        : 1
                    }
                  >
                    <title>{node.label}</title>
                    <circle
                      r="52"
                      fill={color}
                      opacity={active ? 0.18 : 0.06}
                      className="group-hover:opacity-25 group-focus:opacity-30"
                    />
                    <circle
                      r="38"
                      className="fill-card"
                      stroke={color}
                      strokeWidth={active ? 3 : 2}
                    />
                    <g style={{ color }}>
                      <NodeIcon node={node} x={-12} y={-12} size={24} />
                    </g>
                    <rect
                      x="-98"
                      y="48"
                      width="196"
                      height="42"
                      rx="8"
                      className="fill-background"
                      opacity="0.94"
                    />
                    <text
                      y="65"
                      textAnchor="middle"
                      className="fill-foreground text-[18px] font-semibold"
                    >
                      {node.label.length > 18
                        ? node.label.slice(0, 16) + '…'
                        : node.label}
                      {node.id === meId ? ' · You' : ''}
                    </text>
                    <text
                      y="83"
                      textAnchor="middle"
                      className="fill-muted-foreground text-[12px] uppercase tracking-wider"
                    >
                      {node.type === 'PROJECT'
                        ? node.key
                        : (node.role ?? 'Teammate')}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-card/90 px-3 py-2 text-xs text-muted-foreground">
            <Move size={13} /> Drag to pan · Click a node or line to explore
          </div>
        </div>
        <aside
          className={`min-w-0 border-t border-border bg-card p-5 xl:border-l xl:border-t-0 ${selectedNode || selectedEdge ? 'fixed bottom-4 left-4 right-4 z-30 max-h-[35vh] overflow-y-auto rounded-xl border shadow-xl xl:static xl:max-h-none xl:rounded-none xl:border-0 xl:border-l xl:shadow-none' : ''}`}
          aria-label="Connection details"
        >
          {selectedNode || selectedEdge ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {selectedNode ? 'Node details' : 'Connection details'}
                </span>
                <button
                  onClick={reset}
                  aria-label="Close details and fit graph"
                  className="rounded p-2 hover:bg-muted"
                >
                  <X size={16} />
                </button>
              </div>
              {selectedNode ? (
                <>
                  <h3 className="break-words text-xl font-semibold">
                    {selectedNode.label}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedNode.type === 'PROJECT'
                      ? `Project · ${selectedNode.key ?? ''}`
                      : `${selectedNode.role ?? 'Teammate'} · Level ${selectedNode.level ?? 1} · ${selectedNode.xp ?? 0} XP`}
                  </p>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Connected to · {neighbors.size ? neighbors.size - 1 : 0}
                  </p>
                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    {visible
                      .filter(
                        (n) => n.id !== selectedNode.id && neighbors.has(n.id),
                      )
                      .map((n) => (
                        <button
                          key={n.id}
                          onClick={() => focusNode(n)}
                          className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left text-sm hover:bg-muted"
                        >
                          <NodeIcon node={n} size={17} />
                          <span className="min-w-0 flex-1 truncate">
                            {n.label}
                          </span>
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                    {connections.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No connections match the current filters.
                      </p>
                    )}
                  </div>
                  {selectedNode.type === 'PROJECT' && (
                    <Link
                      to={`/projects/${selectedNode.id}`}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                      Open project <ArrowUpRight size={15} />
                    </Link>
                  )}
                  {selectedNode.id === meId && (
                    <Link
                      to="/profile"
                      className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline"
                    >
                      Open your profile
                    </Link>
                  )}
                </>
              ) : (
                selectedEdge && (
                  <>
                    <h3 className="text-lg font-semibold">
                      {selectedEdge.kind.replaceAll('_', ' ').toLowerCase()}
                    </h3>
                    <p className="mt-3 break-words text-sm">
                      {map.get(selectedEdge.source)?.label}{' '}
                      <span className="text-muted-foreground">→</span>{' '}
                      {map.get(selectedEdge.target)?.label}
                    </p>
                    {selectedEdge.role && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Project role: {selectedEdge.role}
                      </p>
                    )}
                    {selectedEdge.bugKey && (
                      <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
                        <p className="font-mono text-sm font-semibold">
                          {selectedEdge.bugKey}
                        </p>
                        <p className="mt-2 text-sm">{selectedFix?.title}</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {selectedEdge.priority} · {selectedEdge.xp ?? 0} XP
                        </p>
                        {selectedFix && (
                          <Link
                            to={`/bugs/${selectedFix.bugId}`}
                            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            Open bug <ArrowUpRight size={14} />
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                )
              )}
            </>
          ) : (
            <div className="flex h-full min-h-40 flex-col justify-center">
              <Network size={32} className="mb-5 text-primary" />
              <h3 className="text-lg font-semibold">Explore your network</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Select a teammate, project or connecting line. The graph zooms
                into that area and shows its details here.
              </p>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Use the filters to simplify the view. Fit graph brings everyone
                back into view. Keyboard: Tab, Enter and Escape.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
