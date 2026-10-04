import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { useApi } from '@/hooks/useWorkspace';
import type { User } from '@/types/auth';
import { levelTitle } from '@/utils/levels';
import { Card } from '@/components/ui/card';
import { Loading, ErrorState } from '@/components/WorkspaceState';
interface ProfileData extends User {
  achievements: {
    id: string;
    unlockedAt: string;
    achievement: { name: string; description: string };
  }[];
}
export function Profile() {
  const request = useApi();
  const query = useQuery({
    queryKey: ['workspace', 'profile'],
    queryFn: () => request<ProfileData>('/auth/profile'),
  });
  if (query.isPending) return <Loading />;
  if (query.isError)
    return (
      <ErrorState
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const user = query.data;
  return (
    <>
      <h1 className="text-3xl font-semibold">{user.name}</h1>
      <p className="mt-2 text-muted-foreground">
        {levelTitle(user.level)} · Level {user.level}
      </p>
      <div className="my-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Total XP', user.xp],
          ['Next level at', user.level ** 2 * 50],
          ['Current streak', user.currentStreak],
          ['Longest streak', user.longestStreak],
        ].map(([name, value]) => (
          <Card className="p-5" key={name}>
            <p className="text-xs text-muted-foreground">{name}</p>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <h2 className="mb-4 text-lg font-semibold">Achievements</h2>
      {!user.achievements.length ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Your first achievement is waiting. Resolve a teammate’s bug and get it
          reviewed.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.achievements.map((item) => (
            <Card key={item.id} className="p-5">
              <Trophy size={24} className="mb-3 text-primary" />
              <h3 className="font-semibold">{item.achievement.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.achievement.description}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Unlocked {new Date(item.unlockedAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        A streak counts rewarded bug resolutions with no gap longer than seven
        days.
      </p>
    </>
  );
}
