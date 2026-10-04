import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Brand } from '@/components/layout/Brand';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { TornChapter } from '@/components/landing/TornChapter';
import { FlipPostcard } from '@/components/landing/FlipPostcard';
import { ShufflingPolaroids } from '@/components/landing/ShufflingPolaroids';
import { RouteMap } from '@/components/landing/RouteMap';
import { PostcardForm } from '@/components/landing/PostcardForm';

export function Landing() {
  const { user, loading } = useAuth();

  // Logged-in users go straight to their dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors overflow-x-hidden">
      {/* Persistent Navigation Header */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-paper-border/60 bg-background/80 px-6 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <Brand />
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="border-paper-border font-mono text-xs">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="font-mono text-xs">
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Main Chapter Flow */}
      <main className="relative">
        {/* CHAPTER 1: COVER */}
        <TornChapter
          id="chapter-cover"
          chapterNumber={1}
          chapterTitle="The Cover"
          isFirst
          className="bg-paper"
        >
          <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center text-center">
            {/* Postmark & Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-paper-border bg-paper-card px-4 py-1.5 shadow-sm">
              <Sparkles className="text-primary" size={14} />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                Built For Student Developer Teams
              </span>
            </div>

            <h1 className="mt-8 font-serif text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              Because Every
              <br />
              Project Has <span className="text-primary italic">Bugs.</span>
            </h1>

            <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Give your bugs a home. Give your team a shared view.
              Turn the daily grind of fixing bugs into an experience worth celebrating.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2 font-mono text-sm uppercase tracking-wider shadow-lg">
                <Link to="/register">
                  Get Started Free
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-paper-border bg-paper-card/80 font-mono text-sm hover:bg-paper-card"
              >
                <Link to="/login">Log In to Workspace</Link>
              </Button>
            </div>

            {/* Scroll Down Prompt */}
            <div className="mt-16 flex flex-col items-center gap-2 font-mono text-xs text-muted-foreground">
              <span>SCROLL DOWN TO TEAR OPEN CHAPTERS</span>
              <ChevronDown size={18} className="animate-bounce text-primary" />
            </div>
          </div>
        </TornChapter>

        {/* CHAPTER 2: FLIP POSTCARD */}
        <TornChapter
          id="chapter-postcard"
          chapterNumber={2}
          chapterTitle="The Postcard"
          className="bg-card"
        >
          <FlipPostcard />
        </TornChapter>

        {/* CHAPTER 3: SHUFFLING POLAROIDS */}
        <TornChapter
          id="chapter-polaroids"
          chapterNumber={3}
          chapterTitle="The Polaroids"
          className="bg-paper"
        >
          <ShufflingPolaroids />
        </TornChapter>

        {/* CHAPTER 4: ANIMATED ROUTE MAP */}
        <TornChapter
          id="chapter-route"
          chapterNumber={4}
          chapterTitle="The Lifecycle Route"
          className="bg-card"
        >
          <RouteMap />
        </TornChapter>

        {/* CHAPTER 5: SEND-A-POSTCARD FORM */}
        <TornChapter
          id="chapter-form"
          chapterNumber={5}
          chapterTitle="Dispatch & Contact"
          isLast
          className="bg-paper"
        >
          <PostcardForm />
        </TornChapter>
      </main>

      {/* Footer */}
      <footer className="border-t border-paper-border bg-background py-8 text-center text-xs text-muted-foreground font-mono">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>BugLife · "Because Every Project Has Bugs."</span>
          <span>Designed with Linear/GitHub aesthetic for student engineering teams.</span>
        </div>
      </footer>
    </div>
  );
}
