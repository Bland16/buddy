// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/routes/sponsors.ts
// DOMAIN:      ads
// CONCEPT:     Serve sponsor logos for the chat wallpaper + log CPM impressions; admin CRUD
// RELATIONS:   guarded by isAuthenticated (+ requireAdmin for writes); uses storage
// KEY EXPORTS: sponsorsRouter
// PURPOSE:     GET /api/sponsors, POST /api/ad-impressions, admin create/update/delete sponsor.
// LLM EDIT GUIDE: This is the revenue side. Keep impression logging cheap; SponsoredWallpaper.tsx
//                 fires one impression per visible tile on mount.
// DAY-OF CHANGES: none here; CPM defaults live in shared/schema.ts + client config.
// ─────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { requireAdmin } from './admin';
// PERSEUS EDGE: ads → storage (sponsors + ad impressions)
import { storage } from '../storage';
import { insertSponsorSchema } from '@shared/schema';
import type { SessionUser } from '../types';

export const sponsorsRouter = Router();

/** GET /api/sponsors — active sponsors for the wallpaper (highest CPM first). */
sponsorsRouter.get('/sponsors', isAuthenticated, async (_req, res) => {
  const sponsors = await storage.listActiveSponsors();
  res.json({ sponsors });
});

/**
 * POST /api/ad-impressions { sponsorId, sessionId? } — log one CPM impression.
 * // HOW TO EXTEND: accept an array to batch impressions for a whole wallpaper render.
 */
sponsorsRouter.post('/ad-impressions', isAuthenticated, async (req, res) => {
  const userId = (req.user as SessionUser).claims.sub;
  const sponsorId = Number(req.body?.sponsorId);
  if (Number.isNaN(sponsorId)) return res.status(400).json({ message: 'Missing sponsorId' });
  await storage.insertAdImpression({
    sponsorId,
    userId,
    sessionId: req.body?.sessionId ?? null,
  });
  res.json({ ok: true });
});

// ── SECTION: Admin sponsor CRUD ────────────────────────────────────────────

/** GET /api/admin/sponsors — all sponsors (incl. inactive) for the admin table. */
sponsorsRouter.get('/admin/sponsors', isAuthenticated, requireAdmin, async (_req, res) => {
  const sponsors = await storage.listAllSponsors();
  res.json({ sponsors });
});

/** POST /api/admin/sponsors — create a sponsor. */
sponsorsRouter.post('/admin/sponsors', isAuthenticated, requireAdmin, async (req, res) => {
  const parsed = insertSponsorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid sponsor', errors: parsed.error.flatten() });
  const sponsor = await storage.createSponsor(parsed.data);
  res.json({ sponsor });
});

/** PATCH /api/admin/sponsors/:id — update a sponsor (e.g. toggle active, change CPM). */
sponsorsRouter.patch('/admin/sponsors/:id', isAuthenticated, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Bad id' });
  await storage.updateSponsor(id, req.body ?? {});
  res.json({ ok: true });
});

/** DELETE /api/admin/sponsors/:id — remove a sponsor. */
sponsorsRouter.delete('/admin/sponsors/:id', isAuthenticated, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Bad id' });
  await storage.deleteSponsor(id);
  res.json({ ok: true });
});
