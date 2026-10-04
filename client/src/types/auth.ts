export interface User {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastResolvedAt: string | null;
  createdAt: string;
}
export interface AuthResponse {
  user: User;
  token: string;
}
