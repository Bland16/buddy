// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/services/matchmaking.ts
// DOMAIN:      matchmaking
// CONCEPT:     Anonymous pairing — turn a waiting user into an active two-person MatchSession
// RELATIONS:   uses storage (match queries); called by server/routes/match.ts
// KEY EXPORTS: joinQueue, leaveQueue
// PURPOSE:     If someone is already waiting, pair with them; otherwise create a waiting session.
// LLM EDIT GUIDE: To pair on shared conversation tastes, pass a topic into findWaitingMatch and add
//                 a column in shared/schema.ts. Keep pairing anonymous — never expose real identities.
// DAY-OF CHANGES: pairing strategy (random vs topic-weighted) lives here.
// ─────────────────────────────────────────────────────────────────────────

// PERSEUS EDGE: matchmaking → storage (all pairing reads/writes go through it)
import { storage } from '../storage';
import type { MatchSession } from '@shared/schema';

export interface JoinResult {
  match: MatchSession;
  /** true when this call paired with a waiting user (chat is now active). */
  paired: boolean;
}

/**
 * Put a user into the matchmaking flow.
 *  - If they already have a waiting/active match, return it (idempotent).
 *  - Else if someone else is waiting, join them → active.
 *  - Else create a new waiting session and wait for a partner.
 * // HOW TO EXTEND: bias `findWaitingMatch` by a shared topic for better pairings.
 */
export async function joinQueue(userId: string): Promise<JoinResult> {
  const existing = await storage.getActiveMatchForUser(userId);
  if (existing) {
    return { match: existing, paired: existing.status === 'active' };
  }

  const waiting = await storage.findWaitingMatch(userId);
  if (waiting) {
    const joined = await storage.joinMatch(waiting.id, userId);
    if (joined) return { match: joined, paired: true };
    // Race: someone grabbed it first — fall through to create our own.
  }

  const created = await storage.createWaitingMatch(userId);
  return { match: created, paired: false };
}

/**
 * Leave the matchmaking flow / end the current chat.
 * // HOW TO EXTEND: if a waiting session is abandoned, you could delete it instead of ending it.
 */
export async function leaveQueue(userId: string): Promise<void> {
  const match = await storage.getActiveMatchForUser(userId);
  if (match) await storage.endMatch(match.id);
}
