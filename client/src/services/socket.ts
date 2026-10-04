import { io } from 'socket.io-client';
export function connectSocket(token: string) {
  return io(
    new URL(import.meta.env.VITE_API_URL || 'http://localhost:4000/api').origin,
    { auth: { token }, transports: ['websocket', 'polling'] },
  );
}
