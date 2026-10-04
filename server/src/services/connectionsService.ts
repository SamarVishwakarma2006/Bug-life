import { db } from '../config/db.js';
import { HttpError } from '../utils/errors.js';
import {
  connectionsResponseSchema,
  type ConnectionNode,
  type ConnectionEdge,
  type RecentFix,
  type ConnectionsResponse,
} from '../validators/connections.js';

export async function getConnectionsGraph(
  userId: string,
  days = 14,
): Promise<ConnectionsResponse> {
  const me = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, xp: true, level: true },
  });

  if (!me) {
    throw new HttpError(404, 'User not found.');
  }

  // 1. Enforce query scoping: only fetch projects the requester is a member of
  const myMemberships = await db.projectMember.findMany({
    where: { userId },
    select: { projectId: true, role: true },
  });

  const meNode: ConnectionNode = {
    id: me.id,
    type: 'USER',
    label: me.name,
    level: me.level,
    xp: me.xp,
  };

  if (myMemberships.length === 0) {
    return connectionsResponseSchema.parse({
      me,
      nodes: [meNode],
      edges: [],
      recentFixes: [],
    });
  }

  const projectIds = myMemberships.map((m) => m.projectId);

  // 2. Fetch projects and all project members for shared projects
  const [projects, allMembers] = await Promise.all([
    db.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, key: true },
    }),
    db.projectMember.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: { select: { id: true, name: true, xp: true, level: true } },
        project: { select: { id: true, name: true, key: true } },
      },
    }),
  ]);

  // 3. Fetch resolved bugs in requester's projects within the requested day range
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [resolvedBugs, assignedBugs] = await Promise.all([
    db.bug.findMany({
      where: {
        projectId: { in: projectIds },
        status: 'RESOLVED',
        resolvedAt: { gte: cutoff },
      },
      include: {
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        project: { select: { id: true, key: true, name: true } },
      },
      orderBy: { resolvedAt: 'desc' },
      take: 100,
    }),
    db.bug.findMany({
      where: {
        projectId: { in: projectIds },
        assigneeId: { not: null },
      },
      select: {
        id: true,
        number: true,
        reporterId: true,
        assigneeId: true,
        projectId: true,
        priority: true,
        project: { select: { key: true } },
      },
      take: 100,
    }),
  ]);

  // 4. Assemble Nodes (capped at 60)
  const nodeMap = new Map<string, ConnectionNode>();
  nodeMap.set(me.id, meNode);

  // Add project nodes
  for (const p of projects) {
    if (nodeMap.size >= 60) break;
    nodeMap.set(p.id, {
      id: p.id,
      type: 'PROJECT',
      label: p.name,
      key: p.key,
    });
  }

  // Add teammate nodes
  for (const m of allMembers) {
    if (nodeMap.size >= 60) break;
    if (!nodeMap.has(m.user.id)) {
      nodeMap.set(m.user.id, {
        id: m.user.id,
        type: 'USER',
        label: m.user.name,
        role: m.role,
        level: m.user.level,
        xp: m.user.xp,
      });
    }
  }

  const nodes = Array.from(nodeMap.values()).slice(0, 60);
  const validNodeIds = new Set(nodes.map((n) => n.id));

  // 5. Assemble Edges (capped at 200)
  const edgeMap = new Map<string, ConnectionEdge>();

  // MEMBER_OF edges (User -> Project)
  for (const m of allMembers) {
    if (edgeMap.size >= 200) break;
    if (validNodeIds.has(m.userId) && validNodeIds.has(m.projectId)) {
      const edgeId = `member:${m.userId}:${m.projectId}`;
      edgeMap.set(edgeId, {
        id: edgeId,
        source: m.userId,
        target: m.projectId,
        kind: 'MEMBER_OF',
        role: m.role,
      });
    }
  }

  // REVIEWED_APPROVED edges from resolved bugs
  for (const bug of resolvedBugs) {
    if (edgeMap.size >= 200) break;
    const resolverId = bug.assigneeId ?? bug.resolvedById;
    const reviewerId = bug.resolvedById;
    if (
      resolverId &&
      reviewerId &&
      validNodeIds.has(resolverId) &&
      validNodeIds.has(reviewerId)
    ) {
      const edgeId = `approved:${bug.id}:${resolverId}:${reviewerId}`;
      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, {
          id: edgeId,
          source: resolverId,
          target: reviewerId,
          kind: 'REVIEWED_APPROVED',
          bugKey: `${bug.project.key}-${bug.number}`,
          priority: bug.priority,
          xp: bug.xpAwarded ? (bug.priority === 'CRITICAL' ? 50 : bug.priority === 'HIGH' ? 35 : bug.priority === 'MEDIUM' ? 20 : 10) : 0,
          at: bug.resolvedAt ?? undefined,
        });
      }
    }
  }

  // ASSIGNED edges from active bugs between reporter and assignee
  for (const bug of assignedBugs) {
    if (edgeMap.size >= 200) break;
    if (
      bug.assigneeId &&
      bug.reporterId !== bug.assigneeId &&
      validNodeIds.has(bug.reporterId) &&
      validNodeIds.has(bug.assigneeId)
    ) {
      const edgeId = `assigned:${bug.reporterId}:${bug.assigneeId}`;
      if (!edgeMap.has(edgeId)) {
        edgeMap.set(edgeId, {
          id: edgeId,
          source: bug.reporterId,
          target: bug.assigneeId,
          kind: 'ASSIGNED',
          bugKey: `${bug.project.key}-${bug.number}`,
          priority: bug.priority,
        });
      }
    }
  }

  const edges = Array.from(edgeMap.values()).slice(0, 200);

  // 6. Assemble recentFixes
  const recentFixes: RecentFix[] = resolvedBugs.map((bug) => {
    const resolver = bug.assignee
      ? { id: bug.assignee.id, name: bug.assignee.name }
      : bug.resolvedBy
      ? { id: bug.resolvedBy.id, name: bug.resolvedBy.name }
      : { id: '', name: 'Developer' };

    const reviewer = bug.resolvedBy
      ? { id: bug.resolvedBy.id, name: bug.resolvedBy.name }
      : { id: '', name: 'Reviewer' };

    return {
      bugId: bug.id,
      bugKey: `${bug.project.key}-${bug.number}`,
      title: bug.title,
      priority: bug.priority,
      xpAwarded: bug.xpAwarded,
      resolvedAt: bug.resolvedAt ?? new Date(),
      resolver,
      reviewer,
    };
  });

  return connectionsResponseSchema.parse({
    me,
    nodes,
    edges,
    recentFixes,
  });
}
