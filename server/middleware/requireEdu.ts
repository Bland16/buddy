// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/middleware/requireEdu.ts
// DOMAIN:      auth
// CONCEPT:     .edu enforcement — only verified student emails reach the matchmaking flow
// RELATIONS:   reads EDU_DOMAIN_ALLOWLIST from config; runs AFTER isAuthenticated on protected routes
// KEY EXPORTS: requireEdu
// PURPOSE:     Rejects non-.edu (or non-allowlisted) verified emails with a 403 EDU_REQUIRED.
// LLM EDIT GUIDE: This is access control, separate from login. Add partner schools via the allowlist
//                 in server/config.ts, not here.
// DAY-OF CHANGES: none here; change EDU_DOMAIN_ALLOWLIST in config.ts to admit a new school.
// ─────────────────────────────────────────────────────────────────────────

import type { RequestHandler } from 'express';
// PERSEUS EDGE: auth → config (the allowlist is the single source of truth)
import { EDU_DOMAIN_ALLOWLIST } from '../config';
import type { SessionUser } from '../types';

/**
 * Enforce that the verified email ends with an allowlisted suffix.
 * // HOW TO EXTEND: to allow specific full domains (e.g. "alum.mit.edu"), just add them to the
 * allowlist in config.ts — the suffix match below already handles them.
 */
export const requireEdu: RequestHandler = (req, res, next) => {
  const user = req.user as SessionUser | undefined;
  const email = user?.claims?.email?.toLowerCase();

  if (!email) {
    return res
      .status(403)
      .json({ code: 'EDU_REQUIRED', message: 'Buddy is for verified students. Sign in with your .edu email.' });
  }

  const allowed = EDU_DOMAIN_ALLOWLIST.some((suffix) => email.endsWith(suffix.toLowerCase()));
  if (!allowed) {
    return res
      .status(403)
      .json({ code: 'EDU_REQUIRED', message: 'Buddy is for verified students. Sign in with your .edu email.' });
  }

  next();
};
