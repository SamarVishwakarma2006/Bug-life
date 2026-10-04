import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Radio, Trophy, LineChart, Network, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PolaroidData {
  id: string;
  tag: string;
  title: string;
  caption: string;
  details: string[];
  icon: typeof LayoutGrid;
  badgeColor: string;
  accentText: string;
}

const POLAROIDS: PolaroidData[] = [
  {
    id: 'kanban',
    tag: 'WORKFLOW',
    title: 'Fluid Kanban Board',
    caption: 'Drag, drop, and triage at the speed of thought.',
    details: [
      '5 distinct columns: Backlog, To Do, In Progress, Review, Resolved',
      'Instant optimistic updates with automated rollback on server rejection',
      'Fractional position ordering powered by @dnd-kit/sortable',
      'Tags, priority color badges, due dates, and assignee avatars',
    ],
    icon: LayoutGrid,
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-500',
    accentText: 'Drag-and-drop ordering',
  },
  {
    id: 'realtime',
    tag: 'REAL-TIME',
    title: 'Zero-Refresh Socket.IO Sync',
    caption: 'Two windows, one truth. Updates arrive in milliseconds.',
    details: [
      'Authenticated JWT WebSocket handshake on connect',
      'Granular project rooms (project:<id>) and personal rooms (user:<id>)',
      'TanStack Query cache mutations directly applied from socket events',
      'Instant live alerts when assigned, commented, or reviewed',
    ],
    icon: Radio,
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500',
    accentText: 'Live Socket.IO Rooms',
  },
  {
    id: 'gamification',
    tag: 'REWARDS',
    title: 'Gamification & Celebration',
    caption: 'Because fixing difficult bugs deserves recognition.',
    details: [
      'Tiered XP awards on approved bug resolutions (up to 50 XP)',
      '+25 XP speed bonuses for fixes within one hour',
      '7-day rolling streaks with automatic streak recovery logic',
      'Framer Motion "Bug Squashed" celebration overlay with confetti burst',
    ],
    icon: Trophy,
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-500',
    accentText: 'Anti-abuse XP Engine',
  },
  {
    id: 'analytics',
    tag: 'INSIGHTS',
    title: 'Deep Engineering Analytics',
    caption: 'See where time goes and who squashes what.',
    details: [
      'Interactive Recharts visualizations for bug velocity',
      'Bug distribution breakdown by priority, type, and current status',
      'Per-member contribution charts and average resolution speed',
      '30-day historical resolution trendlines',
    ],
    icon: LineChart,
    badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-500',
    accentText: 'Recharts Visualizations',
  },
  {
    id: 'connections',
    tag: 'NETWORK',
    title: 'Interactive Connections Graph',
    caption: 'Your team ecosystem visualized in a live radial network.',
    details: [
      'Dependency-free SVG radial graph centered on you',
      'Distinct role badges: Owner (Crown), Reviewer (Shield), Dev (Code)',
      'Live pulsing badges on edges as recent fixes are approved',
      'Scoped strictly to your shared projects with zero cross-tenant leaks',
    ],
    icon: Network,
    badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-500',
    accentText: 'Radial Teammate Network',
  },
];

export function ShufflingPolaroids() {
  const [cards, setCards] = useState(POLAROIDS);

  const shuffleNext = () => {
    setCards((prev) => {
      const [first, ...rest] = prev;
      return first ? [...rest, first] : prev;
    });
  };

  const activeCard = cards[0];

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex items-center justify-between w-full max-w-2xl px-2">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            FEATURE SHOWCASE
          </span>
          <h3 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Shuffling Polaroids
          </h3>
        </div>
        <Button
          type="button"
          onClick={shuffleNext}
          variant="outline"
          size="sm"
          className="gap-2 border-paper-border bg-paper/80 font-mono text-xs hover:bg-paper"
        >
          Shuffle Next <ArrowRight size={14} />
        </Button>
      </div>

      {/* Polaroid Deck */}
      <div className="relative flex h-[500px] w-full max-w-xl items-center justify-center">
        <AnimatePresence mode="popLayout">
          {cards.slice(0, 4).map((card, index) => {
            const isTop = index === 0;
            // Pre-calculated rotation and translation for realistic Polaroid stack
            const rotation = index === 0 ? 0 : index === 1 ? -4 : index === 2 ? 5 : -2;
            const yOffset = index * 12;
            const scale = 1 - index * 0.05;

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{
                  scale,
                  opacity: 1,
                  y: yOffset,
                  rotate: rotation,
                  zIndex: 30 - index,
                }}
                exit={{
                  x: 300,
                  opacity: 0,
                  rotate: 20,
                  transition: { duration: 0.3 },
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                onClick={isTop ? shuffleNext : undefined}
                className={`absolute w-full cursor-pointer select-none rounded-2xl border-4 border-paper-border bg-paper-card p-6 shadow-2xl transition-shadow hover:shadow-primary/20 sm:p-8 ${
                  !isTop ? 'pointer-events-none' : ''
                }`}
                style={{
                  boxShadow:
                    '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Vintage Tape mark at the top */}
                <div className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rounded-sm border border-paper-border/60 bg-paper/70 backdrop-blur-sm shadow-sm" />

                {/* Polaroid Frame Header */}
                <div className="flex items-center justify-between border-b border-paper-border pb-4">
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${card.badgeColor}`}
                  >
                    {card.tag}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    CARD {POLAROIDS.findIndex((p) => p.id === card.id) + 1} OF {POLAROIDS.length}
                  </span>
                </div>

                {/* Polaroid Content Viewport */}
                <div className="mt-4 rounded-xl border border-paper-border bg-paper/60 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-paper-border bg-paper shadow-sm">
                      <card.icon className="text-primary" size={24} />
                    </div>
                    <div>
                      <h4 className="font-serif text-xl font-bold tracking-tight text-foreground">
                        {card.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">{card.accentText}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm font-medium text-foreground/90 leading-snug">
                    {card.caption}
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-foreground/80">
                    {card.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary font-bold">›</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Polaroid Handwritten Caption footer */}
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span className="font-serif italic text-sm text-foreground/70">
                    "{card.title}"
                  </span>
                  <span className="text-primary font-semibold">Click to shuffle card ↷</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Stack indicators */}
      <div className="mt-8 flex gap-2">
        {POLAROIDS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              const targetIndex = cards.findIndex((c) => c.id === p.id);
              if (targetIndex > 0) {
                setCards((prev) => [
                  ...prev.slice(targetIndex),
                  ...prev.slice(0, targetIndex),
                ]);
              }
            }}
            aria-label={`Jump to ${p.title}`}
            className={`h-2.5 rounded-full transition-all ${
              activeCard?.id === p.id
                ? 'w-8 bg-primary'
                : 'w-2.5 bg-paper-border hover:bg-muted-foreground'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
