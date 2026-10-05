import type { ReactNode } from 'react';
import { Bug } from 'lucide-react';
import { Link } from 'react-router-dom';

const layers = [
  { image: 'back', size: '2000px', opacity: 0.5, reverse: false },
  { image: 'middle', size: '1000px', opacity: 0.6, reverse: true },
  { image: 'front', size: '800px', opacity: 0.8, reverse: false },
];

/** Shared animated shell for both account flows. Content stays in normal flow. */
export function LoginHero({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#09090b] text-white">
      <style>{`
        @keyframes auth-orbit { to { transform: rotate(360deg); } }
        .auth-orbit { animation: auth-orbit 60s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .auth-orbit { animation: none; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 overflow-hidden"
      >
        {layers.map((layer) => (
          <div
            key={layer.image}
            className="absolute inset-0 auth-orbit"
            style={{ animationDirection: layer.reverse ? 'reverse' : 'normal' }}
          >
            <img
              src={`/login/${layer.image}.png`}
              alt=""
              className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
              style={{
                width: layer.size,
                height: layer.size,
                opacity: layer.opacity,
              }}
            />
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,#09090b_5%,rgba(9,9,11,0.92)_40%,rgba(9,9,11,0.65)_100%)]"
      />
      <header className="px-6 py-5 sm:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded text-sm font-semibold text-zinc-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Bug size={20} className="text-[#0079da]" aria-hidden="true" />
          BugLife <span className="ml-2 font-normal text-zinc-400">/ Home</span>
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-12 pt-6 sm:pb-16">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 shadow-lg ring-1 ring-white/10">
          <Bug className="h-7 w-7 text-[#0079da]" aria-hidden="true" />
        </div>
        <h1 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mb-8 mt-3 text-center text-sm leading-6 text-zinc-400">
          {subtitle}
        </p>
        {children}
      </div>
    </main>
  );
}
