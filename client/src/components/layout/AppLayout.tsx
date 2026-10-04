import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  Bug,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import { Brand } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { NotificationBell } from '@/pages/Notifications';
import { levelTitle } from '@/utils/levels';
import { CommandPalette } from './CommandPalette';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/my-bugs', label: 'My Bugs', icon: Bug },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
];
export function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const current = navigation.find(
    (item) =>
      location.pathname === item.to ||
      location.pathname.startsWith(`${item.to}/`),
  );
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-background/80 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r bg-sidebar md:visible md:translate-x-0',
          open ? 'visible translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex h-20 items-center justify-between px-5">
          <NavLink
            to="/dashboard"
            onClick={() => setOpen(false)}
            aria-label="BugLife dashboard"
          >
            <Brand />
          </NavLink>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </Button>
        </div>
        <div className="mx-4 mb-7 flex items-center gap-3 rounded-lg border bg-card p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-xs font-semibold">
            {user?.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-medium">Personal workspace</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Let’s make better software.
            </p>
          </div>
        </div>
        <p className="mb-2 px-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Workspace
        </p>
        <nav aria-label="Main navigation" className="space-y-1 px-3">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <div className="mb-4 rounded-lg border p-3">
            <p className="flex items-center gap-2 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Your team. Every fix.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              A fresh start for your team’s next big idea.
            </p>
          </div>
          <div className="flex items-center gap-3 border-t pt-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {user?.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">
                Level {user?.level} · {levelTitle(user?.level ?? 1)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>
      <div className="md:pl-60">
        <header className="flex h-16 items-center justify-between border-b px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={19} />
            </Button>
            <span className="text-sm text-muted-foreground">
              Workspace <span className="mx-3 text-border">/</span>
              <span className="text-foreground">
                {current?.label ??
                  (location.pathname.startsWith('/bugs/')
                    ? 'Bug details'
                    : 'Page not found')}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CommandPalette />
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-7xl px-5 py-9 sm:px-8 lg:px-12"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
