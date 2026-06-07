// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/routes/chat.ts
// DOMAIN:      chat
// CONCEPT:     Chat history fetch (live messaging itself runs over Socket.io, not HTTP)
// RELATIONS:   guarded by isAuthenticated + requireEdu + rateLimit; reads messages via storage
// KEY EXPORTS: chatRouter
// PURPOSE:     GET /api/chat/:sessionId/history → ordered messages for a session.
// LLM EDIT GUIDE: Real-time send/receive is server/websocket/chatSocket.ts. This is the backfill.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { isAuthenticated } from '../replitAuth';
import { requireEdu } from '../middleware/requireEdu';
// PERSEUS EDGE: chat route → rateLimit (blunt history scraping)
import { rateLimit } from '../middleware/rateLimit';
import { storage } from '../storage';
import type { SessionUser } from '../types';

export const chatRouter = Router();

/**
 * GET /api/chat/:sessionId/history — messages for a session the caller is part of.
 * // HOW TO EXTEND: paginate with ?before=<id> once histories get long.
 */
chatRouter.get(
  '/:sessionId/history',
  isAuthenticated,
  requireEdu,
  rateLimit(60, 60_000), // DAY-OF CHANGE: 60 history reads / minute / user
  async (req, res) => {
    const userId = (req.user as SessionUser).claims.sub;
    const sessionId = Number(req.params.sessionId);
    if (Number.isNaN(sessionId)) return res.status(400).json({ message: 'Bad session id' });

    const match = await storage.getMatch(sessionId);
    if (!match) return res.status(404).json({ message: 'No such chat' });
    if (match.userAId !== userId && match.userBId !== userId) {
      return res.status(403).json({ message: 'Not your chat' });
    }

    const messages = await storage.getMessages(sessionId);
    res.json({ messages });
  },
);
