// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/routes/admin.ts
// DOMAIN:      admin
// CONCEPT:     Operator tools — moderation logs, point-rate visibility, marketplace inventory
// RELATIONS:   guarded by isAuthenticated + requireAdmin; reads/writes via storage
// KEY EXPORTS: adminRouter, requireAdmin
// PURPOSE:     GET moderation logs, GET/POST marketplace items, expose tunables to the Admin page.
// LLM EDIT GUIDE: requireAdmin gates everything here. Sponsor CRUD lives in routes/sponsors.ts.
// DAY-OF CHANGES: none here; the point-drop rate itself is POINT_DROP_RATE in config.ts.
// ─────────────────────────────────────────────────────────────────────────

import { Router, type RequestHandler } from 'express';
import { isAuthenticated } from '../replitAuth';
// PERSEUS EDGE: admin → storage (logs, items) + config (exposes tunables read-only)
import { storage } from '../storage';
import { CONFIG } from '../config';
import { insertMarketplaceItemSchema } from '@shared/schema';
import type { SessionUser } from '../types';

export const adminRouter = Router();

/**
 * requireAdmin — runs after isAuthenticated; rejects non-admins with 403.
 * Exported so routes/sponsors.ts can reuse it for sponsor CRUD.
 * // HOW TO EXTEND: support roles (moderator vs admin) by reading a `role` column instead of isAdmin.
 */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const userId = (req.user as SessionUser).claims.sub;
  const user = await storage.getUser(userId);
  if (!user?.isAdmin) return res.status(403).json({ message: 'Admins only' });
  next();
};

/** GET /api/admin/moderation-logs — recent moderation audit rows. */
adminRouter.get('/moderation-logs', isAuthenticated, requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const logs = await storage.listModerationLogs(limit);
  res.json({ logs });
});

/** GET /api/admin/inventory — all marketplace items (incl. inactive). */
adminRouter.get('/inventory', isAuthenticated, requireAdmin, async (_req, res) => {
  const items = await storage.listMarketplaceItems(true);
  res.json({ items });
});

/** POST /api/admin/inventory — add a marketplace item. */
adminRouter.post('/inventory', isAuthenticated, requireAdmin, async (req, res) => {
  const parsed = insertMarketplaceItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid item', errors: parsed.error.flatten() });
  const item = await storage.createMarketplaceItem(parsed.data);
  res.json({ item });
});

/**
 * GET /api/admin/settings — surface tunables (read-only) so the Admin page can display them.
 * The authoritative values live in server/config.ts; change them there + restart.
 */
adminRouter.get('/settings', isAuthenticated, requireAdmin, async (_req, res) => {
  res.json({
    pointDropRate: CONFIG.POINT_DROP_RATE,
    claudeModel: CONFIG.CLAUDE_MODEL,
    eduAllowlist: CONFIG.EDU_DOMAIN_ALLOWLIST,
    maxMessagesPerSession: CONFIG.MAX_MESSAGES_PER_SESSION,
  });
});
