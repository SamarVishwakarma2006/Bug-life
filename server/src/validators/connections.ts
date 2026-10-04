import { z } from 'zod';

export const connectionsQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 14))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 60, {
      message: 'days must be an integer between 1 and 60',
    }),
});

export const connectionNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['USER', 'PROJECT']),
  label: z.string(),
  role: z.enum(['OWNER', 'DEVELOPER', 'REVIEWER']).optional(),
  avatarUrl: z.string().optional(),
  level: z.number().int().optional(),
  xp: z.number().int().optional(),
  key: z.string().optional(),
});

export const connectionEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  kind: z.enum(['MEMBER_OF', 'ASSIGNED', 'REVIEWED_APPROVED']),
  role: z.string().optional(),
  bugKey: z.string().optional(),
  priority: z.string().optional(),
  xp: z.number().int().optional(),
  at: z.union([z.date(), z.string()]).optional(),
});

export const recentFixSchema = z.object({
  bugId: z.string(),
  bugKey: z.string(),
  title: z.string(),
  priority: z.string(),
  xpAwarded: z.boolean(),
  resolvedAt: z.union([z.date(), z.string()]),
  resolver: z.object({
    id: z.string(),
    name: z.string(),
  }),
  reviewer: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export const connectionsResponseSchema = z.object({
  me: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    level: z.number().int(),
    xp: z.number().int(),
  }),
  nodes: z.array(connectionNodeSchema).max(60),
  edges: z.array(connectionEdgeSchema).max(200),
  recentFixes: z.array(recentFixSchema),
});

export type ConnectionsQuery = z.infer<typeof connectionsQuerySchema>;
export type ConnectionNode = z.infer<typeof connectionNodeSchema>;
export type ConnectionEdge = z.infer<typeof connectionEdgeSchema>;
export type RecentFix = z.infer<typeof recentFixSchema>;
export type ConnectionsResponse = z.infer<typeof connectionsResponseSchema>;
