// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/routes/index.ts
// DOMAIN:      config
// CONCEPT:     Route registration — mounts every router and attaches Socket.io to one http.Server
// RELATIONS:   imports all routers + setupChatSocket; called once by server/index.ts
// KEY EXPORTS: registerRoutes
// PURPOSE:     Wires the API surface and real-time layer onto a single http.Server (one port).
// LLM EDIT GUIDE: New API route → add the router file, import it here, mount it. Keep everything on
//                 the same http.Server — do NOT open a second port.
// DAY-OF CHANGES: mount a new router here when you add a feature area.
// ─────────────────────────────────────────────────────────────────────────

import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { authRouter } from './auth';
import { matchRouter } from './match';
import { chatRouter } from './chat';
import { pointsRouter } from './points';
import { marketplaceRouter } from './marketplace';
import { sponsorsRouter } from './sponsors';
import { adminRouter } from './admin';
// PERSEUS EDGE: routes → websocket (real-time chat shares this http.Server)
import { setupChatSocket } from '../websocket/chatSocket';

/**
 * Mount all routers, attach Socket.io, and return the http.Server (not yet listening).
 * // HOW TO EXTEND: import a new router and mount it under its /api prefix here.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api/auth', authRouter);
  app.use('/api/match', matchRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/points', pointsRouter);
  app.use('/api/admin', adminRouter);
  // marketplace + sponsors register their own /marketplace, /redeem, /stripe/webhook,
  // /sponsors, /ad-impressions, and /admin/sponsors paths under /api.
  app.use('/api', marketplaceRouter);
  app.use('/api', sponsorsRouter);

  // Simple liveness probe (handy for the Replit deploy health check).
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  const server = createServer(app);
  setupChatSocket(server); // attaches Socket.io to the SAME server (single port)
  return server;
}
