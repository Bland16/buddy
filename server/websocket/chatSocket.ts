// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/websocket/chatSocket.ts
// DOMAIN:      chat
// CONCEPT:     The real-time chat server — join/message/leave, with moderation + point drops
// RELATIONS:   shares the Express session for auth; calls moderation + points services; uses storage
// KEY EXPORTS: setupChatSocket
// PURPOSE:     Attaches Socket.io to the shared http.Server and runs the live message pipeline.
// LLM EDIT GUIDE: Outgoing messages are broadcast OPTIMISTICALLY (before moderation resolves) so chat
//                 never lags on Claude. Add new events here; persistence stays in storage.
// DAY-OF CHANGES: add a `chat:typing` relay; tune what triggers a point drop (services/points.ts).
// ─────────────────────────────────────────────────────────────────────────

import type { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import passport from 'passport';
import { getSession } from '../replitAuth';
// PERSEUS EDGE: chat → moderation (every outgoing message is screened before the nudge decision)
import { screenMessage } from '../services/moderation';
// PERSEUS EDGE: chat → points (each message rolls the gift-point drop lottery)
import { rollPointDrop } from '../services/points';
// PERSEUS EDGE: chat → storage (messages + match state)
import { storage } from '../storage';
import type { SessionUser } from '../types';

/** The room name for a match session. */
const room = (sessionId: number) => `match:${sessionId}`;

/**
 * Attach Socket.io to the existing http.Server (no second port). Authenticate sockets by sharing the
 * Express session + passport so socket.request.user is the logged-in user.
 */
export function setupChatSocket(httpServer: HttpServer): IOServer {
  const io = new IOServer(httpServer, { path: '/socket.io' });

  // Share the Express session + passport so the socket knows who the user is.
  const sessionMiddleware = getSession();
  io.engine.use(sessionMiddleware);
  io.engine.use(passport.initialize());
  io.engine.use(passport.session());

  io.on('connection', (socket) => {
    const req = socket.request as unknown as { user?: SessionUser };
    const user = req.user;

    if (!user?.claims?.sub) {
      // Not authenticated — disconnect politely.
      socket.disconnect(true);
      return;
    }
    const userId = user.claims.sub;

    // ── SECTION: Real-time Listeners ───────────────────────────────────────

    socket.on('chat:join', async ({ sessionId }: { sessionId: number }) => {
      const match = await storage.getMatch(sessionId);
      if (!match || (match.userAId !== userId && match.userBId !== userId)) return;
      socket.join(room(sessionId));
    });

    socket.on('chat:message', async ({ sessionId, content }: { sessionId: number; content: string }) => {
      const text = (content ?? '').trim();
      if (!text) return;

      const match = await storage.getMatch(sessionId);
      if (!match || (match.userAId !== userId && match.userBId !== userId)) return;

      // 1) Persist with a pending verdict.
      const message = await storage.insertMessage({
        sessionId,
        senderId: userId,
        content: text,
        verdict: 'pending',
        moderationChecked: false,
      });

      // 2) Broadcast immediately (optimistic — do NOT await moderation first).
      io.to(room(sessionId)).emit('chat:message', { message });

      // ── SECTION: Claude Moderation Call (async, non-blocking) ────────────
      screenMessage({ content: text, sessionId, userId })
        .then(async (verdict) => {
          if (verdict.verdict === 'flagged') {
            await storage.updateMessageVerdict(message.id, 'nudgeSent');
            io.to(room(sessionId)).emit('chat:nudge', {
              nudge: {
                guidelineTriggered: verdict.guidelineTriggered,
                message:
                  verdict.nudgeMessage ??
                  "Quick one — let's keep names, numbers, and socials out of it. All good to keep going?",
              },
            });
          } else {
            await storage.updateMessageVerdict(message.id, 'clean');
          }
        })
        .catch(() => storage.updateMessageVerdict(message.id, 'clean'));

      // ── SECTION: Point Drop Logic ────────────────────────────────────────
      // The sender is the earner; their match is the recipient (the only spender).
      const recipientId = match.userAId === userId ? match.userBId : match.userAId;
      if (recipientId) {
        const drop = await rollPointDrop({ earnerId: userId, recipientId, matchSessionId: sessionId });
        if (drop.dropped && drop.point) {
          io.to(room(sessionId)).emit('chat:pointDrop', {
            earner: userId,
            recipient: recipientId,
            points: drop.point.points,
          });
        }
      }
    });

    socket.on('chat:leave', async ({ sessionId }: { sessionId: number }) => {
      socket.leave(room(sessionId));
      socket.to(room(sessionId)).emit('chat:userLeft', { userId });
    });

    socket.on('disconnecting', () => {
      Array.from(socket.rooms).forEach((r) => {
        if (r.startsWith('match:')) socket.to(r).emit('chat:userLeft', { userId });
      });
    });
  });

  return io;
}
