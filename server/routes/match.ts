// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/routes/match.ts
// DOMAIN:      matchmaking
// CONCEPT:     HTTP surface for joining/leaving the anonymous matchmaking flow
// RELATIONS:   guarded by isAuthenticated + requireEdu; delegates to services/matchmaking
// KEY EXPORTS: matchRouter
// PURPOSE:     POST /api/match/join, DELETE /api/match/leave, GET /api/match/current
// LLM EDIT GUIDE: Keep pairing logic in services/matchmaking.ts; this file is just transport.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
// PERSEUS EDGE: match route → requireEdu (students only past this point)
import { requireEdu } from '../middleware/requireEdu';
// PERSEUS EDGE: match route → matchmaking service (the pairing algorithm)
import { joinQueue, leaveQueue } from '../services/matchmaking';
import { storage } from '../storage';
import type { SessionUser } from '../types';

export const matchRouter = Router();

/** POST /api/match/join — enter the queue; pairs instantly if someone is waiting. */
matchRouter.post('/join', isAuthenticated, requireEdu, async (req, res) => {
  const userId = (req.user as SessionUser).claims.sub;
  const result = await joinQueue(userId);
  res.json(result);
});

/** DELETE /api/match/leave — end the current chat / leave the queue. */
matchRouter.delete('/leave', isAuthenticated, requireEdu, async (req, res) => {
  const userId = (req.user as SessionUser).claims.sub;
  await leaveQueue(userId);
  res.json({ ok: true });
});

/**
 * GET /api/match/current — the user's active/waiting match, if any (lets the client resume).
 * // HOW TO EXTEND: include the other participant's alias/avatar so MatchCard renders without a 2nd call.
 */
matchRouter.get('/current', isAuthenticated, requireEdu, async (req, res) => {
  const userId = (req.user as SessionUser).claims.sub;
  const match = await storage.getActiveMatchForUser(userId);
  if (!match) return res.json({ match: null, partnerAlias: null });

  const partnerId = match.userAId === userId ? match.userBId : match.userAId;
  const partner = partnerId ? await storage.getUser(partnerId) : undefined;
  res.json({ match, partnerAlias: partner?.anonymousAlias ?? null });
});
