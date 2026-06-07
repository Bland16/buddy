// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/routes/auth.ts
// DOMAIN:      auth
// CONCEPT:     The "who am I" endpoint the client polls to know if it's signed in
// RELATIONS:   guarded by isAuthenticated; reads the user via storage; used by useAuth.ts
// KEY EXPORTS: authRouter
// PURPOSE:     GET /api/auth/user → the current user row (or 401 if not signed in).
// LLM EDIT GUIDE: Login/logout/callback live in server/replitAuth.ts. This file is read-only profile.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
// PERSEUS EDGE: auth route → replitAuth (guard) + storage (user row)
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';
import type { SessionUser } from '../types';

export const authRouter = Router();

/**
 * GET /api/auth/user — returns the authenticated user's row.
 * // HOW TO EXTEND: include the spendable point balance here to save the client a round-trip.
 */
authRouter.get('/user', isAuthenticated, async (req, res) => {
  const sessionUser = req.user as SessionUser;
  const user = await storage.getUser(sessionUser.claims.sub);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

/**
 * PATCH /api/auth/onboarding { anonymousAlias, conversationTastes? } — finish onboarding.
 * Sets the alias and flips onboardingComplete so the auth gate lets the user into the app.
 * // HOW TO EXTEND: persist conversationTastes to a column to bias matchmaking by shared interests.
 */
authRouter.patch('/onboarding', isAuthenticated, async (req, res) => {
  const sessionUser = req.user as SessionUser;
  const alias = String(req.body?.anonymousAlias ?? '').trim().slice(0, 40);
  if (!alias) return res.status(400).json({ message: 'Pick a name to go by.' });
  const user = await storage.updateUser(sessionUser.claims.sub, {
    anonymousAlias: alias,
    onboardingComplete: true,
  });
  res.json(user);
});
