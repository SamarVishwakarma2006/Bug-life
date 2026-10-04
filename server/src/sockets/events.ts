import type { Prisma } from '@prisma/client';
export interface Event {
  room: string;
  name: string;
  data: unknown;
}
const pending = new WeakMap<Prisma.TransactionClient, Event[]>();
let publish: (events: Event[]) => Promise<void> = async () => {};
export function beginEvents(tx: Prisma.TransactionClient) {
  const events: Event[] = [];
  pending.set(tx, events);
  return events;
}
export function queueEvent(tx: Prisma.TransactionClient, event: Event) {
  pending.get(tx)?.push(event);
}
export function setPublisher(publisher: typeof publish) {
  publish = publisher;
}
export async function flushEvents(events: Event[]) {
  try {
    await publish(events);
  } catch (error) {
    console.error('Socket delivery failed after commit', error);
  }
}
