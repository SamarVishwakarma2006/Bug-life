import { motion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
export interface Celebration {
  xpGained: number;
  streak: number;
  achievements: { name: string }[];
}
export function BugSquashed({ reward }: { reward: Celebration }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/50"
      role="status"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 1] }}
        transition={{ duration: 1.5, times: [0, 0.15, 0.8, 1] }}
        className="rounded-xl border border-primary bg-card p-8 text-center shadow-lg"
      >
        <CheckCheck className="mx-auto mb-4 text-primary" size={40} />
        <h2 className="text-2xl font-bold tracking-tight">BUG SQUASHED</h2>
        <p className="mt-3 text-3xl font-semibold text-primary">
          +{reward.xpGained} XP
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {reward.streak} bug streak
        </p>
        {reward.achievements.map((achievement) => (
          <p key={achievement.name} className="mt-2 text-sm">
            Unlocked: {achievement.name}
          </p>
        ))}
      </motion.div>
    </div>
  );
}
