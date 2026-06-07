// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/middleware/rateLimit.ts
// DOMAIN:      auth
// CONCEPT:     Lightweight per-user rate limiting (in-memory token buckets)
// RELATIONS:   wraps sensitive routes (chat history, redeem); reads the authed user id
// KEY EXPORTS: rateLimit
// PURPOSE:     Blunts abuse on hot endpoints without an external dependency (hackathon-friendly).
// LLM EDIT GUIDE: In-memory only — fine for a single Replit instance. For multi-instance, swap the
//                 Map for Redis. Tune limits per call site via the factory args.
// DAY-OF CHANGES: bump `max` / `windowMs` if a demo hits limits.
// ─────────────────────────────────────────────────────────────────────────

import type { RequestHandler } from 'express';
import type { SessionUser } from '../types';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Per-user fixed-window limiter.
 * // HOW TO EXTEND: key by IP for unauthenticated routes, or back this with Redis for multi-instance.
 * @param max      max requests allowed per window
 * @param windowMs window length in ms  // DAY-OF CHANGE: widen the window or raise max for demos
 */
export function rateLimit(max: number, windowMs: number): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (req, res, next) => {
    const user = req.user as SessionUser | undefined;
    const key = user?.claims?.sub ?? req.ip ?? 'anon';
    const now = Date.now();

    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      return res.status(429).json({ message: 'Slow down a sec — try again in a moment.' });
    }

    bucket.count += 1;
    next();
  };
}
