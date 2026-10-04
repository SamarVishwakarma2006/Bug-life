import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApi } from '@/hooks/useWorkspace';
import { Card } from '@/components/ui/card';
import { Loading, ErrorState } from '@/components/WorkspaceState';
import { statusLabel } from '@/utils/bugs';
type Count = { name: string; count: number };
interface Data {
  byStatus: Count[];
  byPriority: Count[];
  byType: Count[];
  contributions: Count[];
  resolvedPerDay: { date: string; count: number }[];
  averageResolutionHours: number | null;
}
function Counts({ title, items }: { title: string; items: Count[] }) {
  return (
    <Card className="p-5">
      <h2 className="mb-5 font-semibold">{title}</h2>
      {!items.length ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No bugs yet.
        </p>
      ) : (
        <>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={items.map((item) => ({
                  ...item,
                  name: statusLabel(item.name),
                }))}
                margin={{ left: -20, right: 8 }}
              >
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {items
              .map((item) => `${statusLabel(item.name)}: ${item.count}`)
              .join(' · ')}
          </p>
        </>
      )}
    </Card>
  );
}
export function Analytics({ projectId }: { projectId: string }) {
  const request = useApi();
  const query = useQuery({
    queryKey: ['workspace', 'analytics', projectId],
    queryFn: () => request<Data>(`/projects/${projectId}/analytics`),
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
  const data = query.data;
  return (
    <>
      <Card className="mb-5 p-5">
        <p className="text-sm text-muted-foreground">Average resolution time</p>
        <p className="mt-2 text-2xl font-semibold">
          {data.averageResolutionHours === null
            ? 'No resolved bugs yet'
            : `${data.averageResolutionHours.toFixed(1)} hours`}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Based on currently resolved bugs; daily counts use UTC.
        </p>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <Counts title="Bugs by status" items={data.byStatus} />
        <Counts title="Bugs by priority" items={data.byPriority} />
        <Counts title="Bugs by type" items={data.byType} />
        <Counts title="Resolved by assignee" items={data.contributions} />
        <Card className="p-5 xl:col-span-2">
          <h2 className="mb-5 font-semibold">
            Resolved per day · Last 30 days
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.resolvedPerDay}
                margin={{ left: -20, right: 20 }}
              >
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date: string) => date.slice(5)}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}
