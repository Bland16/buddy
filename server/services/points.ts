// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/services/points.ts
// DOMAIN:      points
// CONCEPT:     The gift-point economy — the random drop lottery + the "recipient-only spend" rule
// RELATIONS:   reads POINT_DROP_RATE from config; writes giftPoints via storage;
//              called by websocket/chatSocket.ts after each message
// KEY EXPORTS: rollPointDrop, getSpendableBalance
// PURPOSE:     Decides if a message triggers a drop and records it so only the match can spend it.
// LLM EDIT GUIDE: The KEY RULE (earner ≠ spender) lives here and in the schema. Don't let an earner
//                 spend their own points. Tune frequency via POINT_DROP_RATE in config.ts.
// DAY-OF CHANGES: POINT_DROP_RATE (config.ts) to make points rain; points-per-drop here.
// ─────────────────────────────────────────────────────────────────────────

// PERSEUS EDGE: points → config (the drop rate is a single tunable)
import { POINT_DROP_RATE } from '../config';
// PERSEUS EDGE: points → storage (the gift-point ledger)
import { storage } from '../storage';
import type { GiftPoint } from '@shared/schema';

/** Points awarded on a single drop. // DAY-OF CHANGE: bump for a more generous economy. */
const POINTS_PER_DROP = 1;

export interface PointDropResult {
  dropped: boolean;
  point?: GiftPoint;
}

// ── SECTION: Point Drop Logic ──────────────────────────────────────────────

/**
 * Run the drop lottery for one message. The earner triggered it; the recipient (their match) is the
 * only one who can ever spend the point.
 * // HOW TO EXTEND: weight the roll by message length or streak; keep the earner != recipient rule.
 */
export async function rollPointDrop(args: {
  earnerId: string;
  recipientId: string;
  matchSessionId: number;
}): Promise<PointDropResult> {
  if (Math.random() >= POINT_DROP_RATE) return { dropped: false };

  const point = await storage.insertGiftPoint({
    earnerId: args.earnerId,
    recipientId: args.recipientId, // the ONLY spender
    matchSessionId: args.matchSessionId,
    points: POINTS_PER_DROP,
    spent: false,
  });
  return { dropped: true, point };
}

/** Spendable (unspent) point balance for a user — what the Marketplace shows. */
export async function getSpendableBalance(userId: string): Promise<number> {
  return storage.getSpendablePoints(userId);
}
