import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Landing } from '@/pages/Landing';
import { AuthPage } from '@/pages/AuthPage';
import { Dashboard } from '@/pages/LiveDashboard';
import { Settings } from '@/pages/Settings';
import { NotFound } from '@/pages/NotFound';
import { Projects } from '@/pages/Projects';
import { Project } from '@/pages/Project';
import { BugDetail } from '@/pages/BugDetail';
import { MyBugs } from '@/pages/MyBugs';
import { Notifications } from '@/pages/Notifications';
import { Leaderboard } from '@/pages/Leaderboard';
import { Profile } from '@/pages/Profile';
import { Connections } from '@/pages/Connections';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage key="login" mode="login" />} />
      <Route
        path="/register"
        element={<AuthPage key="register" mode="register" />}
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<Project />} />
          <Route path="/bugs/:id" element={<BugDetail />} />
          <Route path="/my-bugs" element={<MyBugs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/workspace/connections" element={<Connections />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
