// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/routes/points.ts
// DOMAIN:      points
// CONCEPT:     HTTP surface for the gift-point balance (drops happen over the socket)
// RELATIONS:   guarded by isAuthenticated + requireEdu; uses services/points + storage
// KEY EXPORTS: pointsRouter
// PURPOSE:     GET /api/points → spendable balance + lifetime total.
// LLM EDIT GUIDE: The drop lottery is server/services/points.ts + chatSocket.ts. This is read-only.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { requireEdu } from '../middleware/requireEdu';
// PERSEUS EDGE: points route → points service (balance) + storage (lifetime counter)
import { getSpendableBalance } from '../services/points';
import { storage } from '../storage';
import type { SessionUser } from '../types';

export const pointsRouter = Router();

/** GET /api/points — { spendable, lifetimeReceived }. */
pointsRouter.get('/', isAuthenticated, requireEdu, async (req, res) => {
  const userId = (req.user as SessionUser).claims.sub;
  const [spendable, user] = await Promise.all([getSpendableBalance(userId), storage.getUser(userId)]);
  res.json({ spendable, lifetimeReceived: user?.totalPointsReceived ?? 0 });
});
