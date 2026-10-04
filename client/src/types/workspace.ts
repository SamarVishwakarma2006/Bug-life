export type Role = 'OWNER' | 'DEVELOPER' | 'REVIEWER';
export type Status =
  'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'RESOLVED' | 'REOPENED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface Person {
  id: string;
  name: string;
  email: string;
}
export interface Member {
  id: string;
  userId: string;
  role: Role;
  user: Person;
}
export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  ownerId: string;
  members: Member[];
  _count: { bugs: number };
  createdAt: string;
}
export interface Activity {
  id: string;
  type: string;
  actor: Person;
  metadata: Record<string, unknown>;
  createdAt: string;
  bug?: {
    id: string;
    number: number;
    title: string;
    project?: { key: string };
  };
}
export interface Bug {
  id: string;
  number: number;
  title: string;
  description: string;
  priority: Priority;
  type: string;
  status: Status;
  position: number;
  labels: string[];
  dueDate: string | null;
  assigneeId: string | null;
  reporterId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  reporter: Person;
  assignee: Person | null;
  project: { id: string; key: string; name: string };
  _count: { comments: number };
  activities?: Activity[];
}
export interface Comment {
  id: string;
  authorId: string;
  author: Person;
  body: string;
  createdAt: string;
}
