import { BugStatus, BugType, Priority } from '@prisma/client';
import { z } from 'zod';
export const bugSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(10000).default(''),
    priority: z.nativeEnum(Priority).default('MEDIUM'),
    type: z.nativeEnum(BugType).default('OTHER'),
    labels: z
      .array(z.string().trim().min(1).max(32))
      .max(10)
      .transform((labels) => [...new Set(labels)])
      .default([]),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
    assigneeId: z.string().cuid().nullable().optional(),
  })
  .strict();
export const editBugSchema = bugSchema.omit({ assigneeId: true });
export const statusSchema = z
  .object({
    status: z.nativeEnum(BugStatus),
    position: z.number().finite().min(0).max(1e12),
  })
  .strict();
export const assignSchema = z
  .object({ assigneeId: z.string().cuid().nullable() })
  .strict();
export const commentSchema = z
  .object({ body: z.string().trim().min(1).max(5000) })
  .strict();
export const filtersSchema = z
  .object({
    status: z.nativeEnum(BugStatus).optional(),
    priority: z.nativeEnum(Priority).optional(),
    assignee: z.union([z.literal('unassigned'), z.string().cuid()]).optional(),
    label: z.string().trim().min(1).max(32).optional(),
    q: z.string().trim().max(200).optional(),
  })
  .strict();
export type BugInput = z.infer<typeof bugSchema>;
export type BugEdit = z.infer<typeof editBugSchema>;
export type BugFilters = z.infer<typeof filtersSchema>;
