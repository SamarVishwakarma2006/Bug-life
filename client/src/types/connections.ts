export type Role = 'OWNER' | 'DEVELOPER' | 'REVIEWER';

export interface ConnectionNode {
  id: string;
  type: 'USER' | 'PROJECT';
  label: string;
  role?: Role;
  avatarUrl?: string;
  level?: number;
  xp?: number;
  key?: string;
  // Computed layout attributes
  x?: number;
  y?: number;
  ring?: number;
}

export interface ConnectionEdge {
  id: string;
  source: string;
  target: string;
  kind: 'MEMBER_OF' | 'ASSIGNED' | 'REVIEWED_APPROVED';
  role?: string;
  bugKey?: string;
  priority?: string;
  xp?: number;
  at?: string;
}

export interface RecentFix {
  bugId: string;
  bugKey: string;
  title: string;
  priority: string;
  xpAwarded: boolean;
  resolvedAt: string;
  resolver: {
    id: string;
    name: string;
  };
  reviewer: {
    id: string;
    name: string;
  };
}

export interface ConnectionsResponse {
  me: {
    id: string;
    name: string;
    email: string;
    level: number;
    xp: number;
  };
  nodes: ConnectionNode[];
  edges: ConnectionEdge[];
  recentFixes: RecentFix[];
}
