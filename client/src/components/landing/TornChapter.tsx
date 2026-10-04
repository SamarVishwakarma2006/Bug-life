import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface TornChapterProps {
  id: string;
  chapterNumber: number;
  chapterTitle: string;
  children: ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  className?: string;
}

export function TornChapter({
  id,
  chapterNumber,
  chapterTitle,
  children,
  isFirst = false,
  isLast = false,
  className = '',
}: TornChapterProps) {
  const containerRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const tearScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.96, 1, 1, 0.96]);
  const tearOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

  return (
    <motion.section
      ref={containerRef}
      id={id}
      aria-label={`Chapter ${chapterNumber}: ${chapterTitle}`}
      style={
        shouldReduceMotion
          ? undefined
          : {
              scale: tearScale,
              opacity: tearOpacity,
            }
      }
      className={`relative min-h-screen w-full transition-colors ${
        !isFirst ? 'clip-torn-top -mt-8 pt-16 sm:pt-24' : 'pt-8'
      } ${!isLast ? 'clip-torn-bottom pb-20 sm:pb-28' : 'pb-12'} ${className}`}
    >
      {/* Chapter header ribbon */}
      <div className="mx-auto mb-8 flex max-w-6xl items-center justify-between px-6 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="inline-flex items-center gap-2 font-mono">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-paper-border bg-paper/60 font-semibold text-primary">
            {chapterNumber}
          </span>
          Chapter {chapterNumber}
        </span>
        <span className="font-serif italic tracking-normal text-foreground/70">
          {chapterTitle}
        </span>
      </div>

      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </motion.section>
  );
}
