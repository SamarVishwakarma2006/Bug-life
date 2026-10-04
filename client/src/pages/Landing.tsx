import { Link } from 'react-router-dom';
import { ArrowRight, Bug, Users, Trophy } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
export function Landing() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6">
      <header className="flex h-24 items-center justify-between">
        <Link to="/">
          <Brand />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>
      <main className="py-20 sm:py-28">
        <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-primary">
          Built for student developer teams
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Because Every
          <br />
          Project Has <span className="text-primary">Bugs.</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
          Give your bugs a home. Give your team a shared view. Turn the small
          fixes into something worth celebrating.
        </p>
        <div className="mt-9 flex gap-3">
          <Button asChild>
            <Link to="/register">
              Create your account
              <ArrowRight size={17} />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Open workspace</Link>
          </Button>
        </div>
        <div className="mt-20 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: Bug,
              title: 'A place for every bug',
              text: 'A clear path from reported to resolved. Track projects, assign bugs, and review fixes.',
            },
            {
              icon: Users,
              title: 'Better, together',
              text: 'One team. One shared view. Stay in sync with live boards, comments, and notifications.',
            },
            {
              icon: Trophy,
              title: 'Every fix counts',
              text: 'Build experience as you build better software. Earn XP, unlock achievements, and celebrate verified fixes.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title} className="p-6">
              <Icon className="mb-5 text-primary" size={22} />
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {text}
              </p>
            </Card>
          ))}
        </div>
      </main>
      <footer className="border-t py-6 text-xs text-muted-foreground">
        BugLife · A little less buggy, every day.
      </footer>
    </div>
  );
}
