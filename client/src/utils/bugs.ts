import type { Status } from '@/types/workspace';
export const statuses: Status[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'RESOLVED',
  'REOPENED',
];
export const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const bugTypes = [
  'UI',
  'BACKEND',
  'DATABASE',
  'API',
  'PERFORMANCE',
  'SECURITY',
  'OTHER',
] as const;
export const statusLabel = (value: string) =>
  value === 'TODO'
    ? 'To do'
    : value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/^./, (character) => character.toUpperCase());
export const transitions: Record<Status, Status[]> = {
  BACKLOG: ['TODO'],
  TODO: ['IN_PROGRESS', 'BACKLOG'],
  IN_PROGRESS: ['REVIEW', 'TODO'],
  REVIEW: ['RESOLVED', 'REOPENED', 'IN_PROGRESS'],
  RESOLVED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS'],
};
