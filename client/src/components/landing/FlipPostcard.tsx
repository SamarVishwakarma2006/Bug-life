import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Sparkles, Award, Zap, ShieldAlert, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FlipPostcard() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsFlipped((prev) => !prev)}
          className="gap-2 border-paper-border bg-paper/80 font-mono text-xs hover:bg-paper"
        >
          <RotateCw size={14} className={isFlipped ? 'rotate-180 transition-transform' : ''} />
          {isFlipped ? 'Flip to: What BugLife Is' : 'Flip to: Gamification & XP Rules'}
        </Button>
        <span className="text-xs text-muted-foreground">or click the postcard</span>
      </div>

      {/* 3D Postcard container */}
      <div
        className="w-full max-w-3xl perspective-[1200px]"
        onClick={() => setIsFlipped((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsFlipped((prev) => !prev);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Interactive 3D Postcard. Press Enter or Space to flip."
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative min-h-[460px] w-full cursor-pointer rounded-2xl border-2 border-paper-border bg-paper-card p-6 shadow-2xl transition-shadow hover:shadow-primary/10 sm:p-10 transform-style-preserve-3d"
        >
          {/* FRONT: What BugLife Is */}
          <div
            className={`flex h-full flex-col justify-between backface-hidden ${
              isFlipped ? 'pointer-events-none' : ''
            }`}
          >
            <div>
              {/* Postcard Top Row: Stamp & Postmark */}
              <div className="flex items-start justify-between border-b-2 border-dashed border-paper-border pb-6">
                <div>
                  <span className="inline-block rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                    AIRMAIL · FIRST CLASS
                  </span>
                  <h3 className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    What is BugLife?
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    ORIGIN: STUDENT DEVELOPER TEAMS · DESTINATION: ZERO BUGS
                  </p>
                </div>

                {/* Vintage BugLife Stamp */}
                <div className="relative flex h-24 w-20 flex-col items-center justify-center rounded border-2 border-dashed border-destructive/60 bg-destructive/10 p-2 text-center shadow-inner">
                  <div className="absolute -top-3 -right-3 h-10 w-10 rounded-full border border-paper-border bg-paper/90 p-1 text-[9px] font-mono leading-none text-muted-foreground flex items-center justify-center rotate-12">
                    OCT '26
                  </div>
                  <Sparkles className="text-destructive" size={20} />
                  <span className="mt-1 font-serif text-xs font-black uppercase tracking-widest text-destructive">
                    BUG
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">10¢</span>
                </div>
              </div>

              {/* Postcard Body with 2 Columns */}
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
                  <p className="font-serif text-base italic text-muted-foreground">
                    "Because Every Project Has Bugs."
                  </p>
                  <p>
                    Every student developer knows the pain of tracking bugs in messy group chats or
                    clunky enterprise suites built for hundred-person enterprises.
                  </p>
                  <p>
                    <strong>BugLife</strong> gives student engineering teams a clean, focused,
                    Linear-inspired workspace where reporting, triaging, and verifying fixes feels
                    fast and natural.
                  </p>
                </div>

                <div className="rounded-xl border border-paper-border bg-paper/50 p-5 space-y-3">
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                    Core Pillars
                  </h4>
                  <ul className="space-y-2.5 text-xs text-foreground/80">
                    <li className="flex items-start gap-2">
                      <span className="rounded bg-primary/20 p-1 text-primary">✔</span>
                      <span><strong>Role-Governed Safety:</strong> Owners, Reviewers, and Developers have explicit, verified powers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="rounded bg-primary/20 p-1 text-primary">✔</span>
                      <span><strong>Live Synchronization:</strong> Instant board and notification sync powered by Socket.IO rooms.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="rounded bg-primary/20 p-1 text-primary">✔</span>
                      <span><strong>Verified Gamification:</strong> Earn XP, level up, and build fix streaks when reviewers approve your code.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-paper-border pt-4 text-[11px] text-muted-foreground font-mono">
              <span>POSTAL REF: BL-2026-HQ</span>
              <span className="text-primary font-semibold">Click to flip card ↷</span>
            </div>
          </div>

          {/* BACK: Gamification, XP & Leaderboard */}
          <div
            className={`absolute inset-0 flex h-full flex-col justify-between p-6 sm:p-10 backface-hidden rotate-y-180 ${
              !isFlipped ? 'pointer-events-none' : ''
            }`}
          >
            <div>
              <div className="flex items-start justify-between border-b-2 border-dashed border-paper-border pb-4">
                <div>
                  <span className="inline-block rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                    SYSTEM SPECIFICATION · GAMIFICATION
                  </span>
                  <h3 className="mt-2 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    XP, Streaks & Anti-Abuse
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                  <Award size={24} />
                </div>
              </div>

              {/* XP Matrix Grid */}
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {/* Base XP */}
                <div className="rounded-xl border border-paper-border bg-paper/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-primary">
                    <Zap size={14} /> Base XP
                  </div>
                  <ul className="mt-3 space-y-1 text-xs">
                    <li className="flex justify-between"><span>Low:</span> <strong>10 XP</strong></li>
                    <li className="flex justify-between"><span>Medium:</span> <strong>20 XP</strong></li>
                    <li className="flex justify-between"><span>High:</span> <strong>35 XP</strong></li>
                    <li className="flex justify-between text-destructive"><span>Critical:</span> <strong>50 XP</strong></li>
                  </ul>
                </div>

                {/* Speed Bonuses */}
                <div className="rounded-xl border border-paper-border bg-paper/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-primary">
                    <Flame size={14} /> Speed Bonus
                  </div>
                  <ul className="mt-3 space-y-1 text-xs">
                    <li className="flex justify-between"><span>Within 24h:</span> <strong className="text-emerald-500">+10 XP</strong></li>
                    <li className="flex justify-between"><span>Within 1h:</span> <strong className="text-emerald-500">+25 XP</strong></li>
                    <li className="mt-2 text-[11px] text-muted-foreground leading-tight">
                      Calculated from bug creation to approval.
                    </li>
                  </ul>
                </div>

                {/* Anti-Abuse */}
                <div className="rounded-xl border border-paper-border bg-paper/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-destructive">
                    <ShieldAlert size={14} /> Anti-Abuse Rules
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground leading-snug">
                    <li>• No XP for self-approved bugs.</li>
                    <li>• No XP if reporter == assignee.</li>
                    <li>• Awarded once per bug; re-opening pays 0.</li>
                    <li>• Reviewer signature required.</li>
                  </ul>
                </div>
              </div>

              {/* Ranks & Level Formula */}
              <div className="mt-4 rounded-xl border border-paper-border bg-paper/40 p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span className="text-muted-foreground">
                    LEVEL FORMULA: <code className="text-foreground">floor(sqrt(XP / 50)) + 1</code>
                  </span>
                  <span className="text-primary font-semibold">
                    STREAK: 7-DAY ROLLING GAP
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase font-mono">
                  <span className="rounded bg-muted px-2 py-0.5">Lv 1-4: Bug Rookie</span>
                  <span className="rounded bg-muted px-2 py-0.5">Lv 5-9: Debugger</span>
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-primary">Lv 10-19: Bug Slayer</span>
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-primary">Lv 20-29: Bug Hunter</span>
                  <span className="rounded bg-destructive/20 px-2 py-0.5 text-destructive">Lv 30-49: Bug Exterminator</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-500">Lv 50+: Debugging Legend</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-paper-border pt-3 text-[11px] text-muted-foreground font-mono">
              <span>CERTIFIED VERIFIED BY BUGLIFE SERVER</span>
              <span className="text-primary font-semibold">Click to flip card ↷</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
