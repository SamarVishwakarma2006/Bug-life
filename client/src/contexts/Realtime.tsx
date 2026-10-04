import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { connectSocket } from '@/services/socket';
import type { Bug } from '@/types/workspace';
import { BugSquashed, type Celebration } from '@/components/BugSquashed';
export function Realtime({ children }: { children: ReactNode }) {
  const { token, user, logout } = useAuth();
  const cache = useQueryClient();
  const [connected, setConnected] = useState(true);
  const [reward, setReward] = useState<Celebration | null>(null);
  useEffect(() => {
    if (!reward) return;
    const timer = setTimeout(() => setReward(null), 1500);
    return () => clearTimeout(timer);
  }, [reward]);
  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    const refresh = () => {
      void cache.invalidateQueries({ queryKey: ['workspace'] });
    };
    const bugChanged = (bug: Bug) => {
      cache.setQueryData<Bug>(['workspace', 'bug', bug.id], (old) =>
        old ? { ...old, ...bug } : undefined,
      );
      refresh();
    };
    socket.on('ready', () => {
      setConnected(true);
      refresh();
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    for (const event of [
      'bug:created',
      'bug:updated',
      'bug:assigned',
      'bug:moved',
      'bug:reopened',
      'comment:created',
    ])
      socket.on(event, bugChanged);
    for (const event of [
      'project:updated',
      'notification:new',
      'notification:read',
      'leaderboard:updated',
      'achievement:unlocked',
      'attachments:updated',
    ])
      socket.on(event, refresh);
    socket.on('session:revoked', logout);
    socket.on('membership:changed', () => {
      void cache.resetQueries({ queryKey: ['workspace'] });
    });
    socket.on('profile:updated', () => {
      void cache.invalidateQueries({ queryKey: ['auth'] });
      refresh();
    });
    socket.on(
      'bug:resolved',
      (data: Celebration & { bug: Bug; recipientId: string | null }) => {
        bugChanged(data.bug);
        if (data.recipientId === user?.id && data.xpGained > 0) setReward(data);
      },
    );
    socket.on('connections:fix', (newFix: import('@/types/connections').RecentFix) => {
      cache.setQueriesData<import('@/types/connections').ConnectionsResponse>(
        { queryKey: ['connections'] },
        (old) => {
          if (!old) return old;
          if (old.recentFixes.some((f) => f.bugId === newFix.bugId)) return old;

          const edgeId = `approved:${newFix.bugId}:${newFix.resolver.id}:${newFix.reviewer.id}`;
          const newEdge: import('@/types/connections').ConnectionEdge = {
            id: edgeId,
            source: newFix.resolver.id,
            target: newFix.reviewer.id,
            kind: 'REVIEWED_APPROVED',
            bugKey: newFix.bugKey,
            priority: newFix.priority,
            xp: newFix.xpAwarded
              ? newFix.priority === 'CRITICAL'
                ? 50
                : newFix.priority === 'HIGH'
                ? 35
                : newFix.priority === 'MEDIUM'
                ? 20
                : 10
              : 0,
            at: newFix.resolvedAt,
          };

          return {
            ...old,
            edges: [newEdge, ...old.edges.filter((e) => e.id !== edgeId)],
            recentFixes: [newFix, ...old.recentFixes],
          };
        },
      );
    });
    return () => {
      socket.disconnect();
    };
  }, [token, cache, user?.id, logout]);
  return (
    <>
      {token && !connected && (
        <p
          role="status"
          className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded border bg-card px-4 py-2 text-xs shadow-lg"
        >
          Live updates disconnected. Reconnecting…
        </p>
      )}
      {children}
      {reward && token && <BugSquashed reward={reward} />}
    </>
  );
}
