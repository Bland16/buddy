// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/types/index.ts
// DOMAIN:      types
// CONCEPT:     Server-only TypeScript types (request/socket shapes, moderation IO)
// RELATIONS:   used by routes, middleware, websocket/chatSocket, services/moderation
// KEY EXPORTS: AuthenticatedRequest, ScreenMessageInput, ModerationVerdict, SocketUser, SessionUser
// PURPOSE:     Types that only the server needs (not derived from the DB schema).
// LLM EDIT GUIDE: DB row types live in @shared/schema. Put only server-runtime shapes here.
// DAY-OF CHANGES: rarely; add a field to SessionUser if you store more on the session.
// ─────────────────────────────────────────────────────────────────────────

import type { Request } from 'express';
import type { Socket } from 'socket.io';

/**
 * The passport user as stored on the session. Mirrors the Replit Auth claims plus tokens used to
 * refresh. `claims.sub` is the user id (OIDC sub); `claims.email` drives the .edu check.
 */
export interface SessionUser {
  claims: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
    [key: string]: unknown;
  };
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

/** Express request after isAuthenticated has run — `user` is the passport SessionUser. */
export interface AuthenticatedRequest extends Request {
  user?: SessionUser;
}

/** Input to the Claude moderation service. */
export interface ScreenMessageInput {
  content: string;
  sessionId: number;
  userId: string;
}

/** The structured result of a moderation screen (mirrors RECORD_VERDICT_TOOL output). */
export interface ModerationVerdict {
  verdict: 'clean' | 'flagged';
  guidelineTriggered: string | null;
  nudgeMessage: string | null;
}

/** A Socket.io socket with the authenticated user resolved off the shared Express session. */
export interface SocketUser extends Socket {
  data: {
    user?: SessionUser;
  };
}
