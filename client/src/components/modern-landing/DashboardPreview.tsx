import { Link } from 'react-router-dom';
import {
  Bell, Bug, FolderKanban, LayoutDashboard, Network, Plus,
  Search, Settings, Trophy, UserRound, ArrowUpRight,
} from 'lucide-react';

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Projects', icon: FolderKanban, to: '/projects' },
  { label: 'Connections', icon: Network, to: '/connections' },
  { label: 'My Bugs', icon: Bug, to: '/my-bugs' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
  { label: 'Leaderboard', icon: Trophy, to: '/leaderboard' },
  { label: 'Profile', icon: UserRound, to: '/profile' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

export default function DashboardPreview({ mounted }: { mounted: boolean }) {
  return (
    <div
      aria-label="BugLife dashboard preview"
      className="flex text-[#F5F5F0] font-ibm-mono text-left"
      style={{ opacity: mounted ? 1 : 0, transition: 'opacity 600ms ease' }}
    >
      <aside className="hidden lg:flex w-[200px] shrink-0 flex-col border-r border-[#2D2D2D] bg-[#111111] p-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-grotesk text-xl font-bold">
          <Bug size={26} className="text-[#FFD600]" /> BugLife
          <span className="border border-[#333] p-1 text-[8px] font-ibm-mono text-[#888]">BETA</span>
        </Link>
        <div className="mt-5 border border-[#2D2D2D] bg-[#161616] p-3">
          <p className="text-[11px] text-[#F5F5F0]">Personal workspace</p>
          <p className="mt-2 text-[9px] leading-4 text-[#888]">Let’s make better software.</p>
        </div>
        <p className="mb-3 mt-6 text-[9px] tracking-[2px] text-[#888]">WORKSPACE</p>
        <nav aria-label="Dashboard preview navigation" className="space-y-1">
          {navigation.map(({ label, icon: Icon, to }) => (
            <Link key={to} to={to} className={`flex items-center gap-3 px-3 py-2.5 text-[10px] transition-colors hover:text-[#FFD600] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFD600] ${label === 'Dashboard' ? 'border-l-2 border-[#FFD600] bg-[#FFD600]/10 text-[#FFD600]' : 'text-[#888]'}`}>
              <Icon size={14} /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-[#2D2D2D] pt-5">
          <p className="text-[10px] text-[#FFD600]">Your team. Every fix.</p>
          <p className="mt-2 text-[9px] leading-4 text-[#888]">A fresh start for your team’s next big idea.</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-[#0F0F0F]">
        <div className="flex items-center justify-between gap-3 border-b border-[#2D2D2D] px-5 py-4 text-[10px] sm:px-7">
          <p><span className="text-[#888]">Workspace / </span>Dashboard</p>
          <div className="flex items-center gap-4 text-[#888]">
            <Link to="/dashboard" aria-label="Search your workspace" className="flex items-center gap-2 hover:text-[#FFD600]"><Search size={14} /><span className="hidden sm:inline">Search…</span></Link>
            <Link to="/notifications" aria-label="View notifications" className="hover:text-[#FFD600]"><Bell size={14} /></Link>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-[8px] tracking-[2px] text-[#FFD600]">YOUR WORKSPACE, AT A GLANCE</p>
              <h2 className="mt-3 font-grotesk text-[25px] font-bold tracking-tight sm:text-[28px]">Welcome back, teammate.</h2>
              <p className="mt-2 text-[10px] text-[#888]">Your bugs, team activity, and progress in one place.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[9px]">
              <Link to="/dashboard?report=bug" className="flex items-center gap-2 border border-[#3D3D3D] px-3 py-3 hover:border-[#FFD600] focus-visible:outline focus-visible:outline-[#FFD600]"><Plus size={12} />Report bug</Link>
              <Link to="/projects" className="bg-[#FFD600] px-3 py-3 font-bold text-[#0A0A0A] hover:bg-[#e6c200] focus-visible:outline focus-visible:outline-[#F5F5F0]">Open projects</Link>
            </div>
          </div>

          <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {['Assigned to you', 'Open critical bugs', 'Resolved in your projects', 'Your total XP'].map((label) => (
              <div key={label} className="border border-[#2D2D2D] bg-[#161616] p-4">
                <p className="text-[9px] leading-4 text-[#888]">{label}</p>
                <p className="mt-3 font-grotesk text-3xl text-[#FFD600]" aria-label="Available after signing in">—</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <section className="sm:col-span-2">
              <h3 className="mb-3 font-grotesk text-sm font-semibold">Your open bugs</h3>
              <div className="flex min-h-[180px] flex-col items-center justify-center border border-[#2D2D2D] bg-[#111111] p-6 text-center">
                <Bug size={24} className="mb-4 text-[#FFD600]" />
                <p className="font-grotesk text-sm font-semibold">Your next fix starts here</p>
                <p className="mt-2 text-[9px] leading-5 text-[#888]">Sign in to see your assigned bugs<br />or report a new issue.</p>
                <Link to="/dashboard" className="mt-4 flex items-center gap-2 text-[9px] text-[#FFD600] hover:underline">Open dashboard <ArrowUpRight size={12} /></Link>
              </div>
            </section>
            <section>
              <h3 className="mb-3 font-grotesk text-sm font-semibold">Recent activity</h3>
              <div className="min-h-[180px] border border-[#2D2D2D] bg-[#111111] p-4">
                <div className="mb-4 h-2 w-2 bg-[#FFD600]" />
                <p className="text-[10px] leading-5">Keep up with your team.</p>
                <p className="mt-3 text-[9px] leading-5 text-[#888]">Bug reports, comments, and updates from your projects appear here.</p>
              </div>
            </section>
          </div>
          <p className="mt-5 text-[8px] tracking-[2px] text-[#666]">WORKSPACE PREVIEW // SIGN IN FOR YOUR LIVE DATA</p>
        </div>
      </div>
    </div>
  );
}
