import type { ConnectionNode } from '@/types/connections';

export type GraphNode = ConnectionNode & { x: number; y: number };
export const WIDTH = 1200;
export const HEIGHT = 760;

// Grow each ring with its population so labels never collapse into a fixed circle.
export function layoutConnections(
  nodes: ConnectionNode[],
  meId: string,
): GraphNode[] {
  const result: GraphNode[] = [];
  const me = nodes.find((node) => node.id === meId);
  if (me) result.push({ ...me, x: 0, y: 0 });
  let radius = 300;
  for (const type of ['USER', 'PROJECT'] as const) {
    const group = nodes
      .filter((node) => node.type === type && node.id !== meId)
      .sort((a, b) => a.id.localeCompare(b.id));
    if (!group.length) continue;
    radius = Math.max(radius, (group.length * 420) / (2 * Math.PI));
    group.forEach((node, i) => {
      const angle =
        (2 * Math.PI * i) / group.length +
        (type === 'PROJECT' ? Math.PI / 2 : -Math.PI / 4);
      result.push({
        ...node,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    });
    radius += 420;
  }
  return result;
}

export function fitConnections(nodes: GraphNode[]) {
  if (!nodes.length) return { x: WIDTH / 2, y: HEIGHT / 2, scale: 1 };
  const left = Math.min(...nodes.map((n) => n.x)) - 220;
  const right = Math.max(...nodes.map((n) => n.x)) + 220;
  const top = Math.min(...nodes.map((n) => n.y)) - 150;
  const bottom = Math.max(...nodes.map((n) => n.y)) + 180;
  const scale = Math.min(1.25, WIDTH / (right - left), HEIGHT / (bottom - top));
  return {
    x: WIDTH / 2 - ((left + right) / 2) * scale,
    y: HEIGHT / 2 - ((top + bottom) / 2) * scale,
    scale,
  };
}
