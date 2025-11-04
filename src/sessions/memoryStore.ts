import { Session } from "../types";

/**
 * In-memory session store for MVP.
 * Can be easily replaced with Redis or another persistent store.
 */
class MemoryStore {
  private sessions: Record<string, Session> = {};

  get(sessionId: string): Session | undefined {
    return this.sessions[sessionId];
  }

  set(sessionId: string, session: Session): void {
    this.sessions[sessionId] = session;
  }

  has(sessionId: string): boolean {
    return !!this.sessions[sessionId];
  }

  delete(sessionId: string): void {
    delete this.sessions[sessionId];
  }

  // For debugging/monitoring
  count(): number {
    return Object.keys(this.sessions).length;
  }
}

export const Sessions = new MemoryStore();

