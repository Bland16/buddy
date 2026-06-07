// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/index.ts
// DOMAIN:      config
// CONCEPT:     The single Express entrypoint — session, auth, routes, sockets, Vite/static, listen
// RELATIONS:   wires config, replitAuth, routes/index, vite; the process root
// KEY EXPORTS: (none — side-effecting entrypoint)
// PURPOSE:     Boots one Express server on one port that serves the API, sockets, and the React app.
// LLM EDIT GUIDE: Order matters: raw webhook body → json → auth → routes → error handler →
//                 vite/static → listen. Keep it to ONE port. Add middleware before registerRoutes.
// DAY-OF CHANGES: PORT (env), nothing else usually.
// ─────────────────────────────────────────────────────────────────────────

import express, { type NextFunction, type Request, type Response } from 'express';
import { validateSecrets, CONFIG } from './config';
import { setupAuth } from './replitAuth';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';

async function main() {
  // Fail fast with one clear message if required secrets/env are missing.
  validateSecrets();

  const app = express();

  // Stripe webhook needs the RAW body for signature verification — mount it BEFORE express.json().
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Session + Replit Auth (or local dev fake-login). Mounts /api/login, /api/callback, /api/logout.
  await setupAuth(app);

  // Mount all API routers + attach Socket.io to the returned http.Server.
  const server = await registerRoutes(app);

  // JSON error handler — keep copy human (brand voice), never leak stacks to the client.
  app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? 500;
    console.error('[buddy] error:', err);
    res.status(status).json({ message: status === 500 ? 'Something hiccuped on our end — try again?' : err.message });
  });

  // Dev: Vite middleware (HMR). Prod: serve the built client. Both on the same port.
  if (process.env.NODE_ENV === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  // reusePort is the Replit standard but unsupported on Windows (ENOTSUP) — omit it off-Linux.
  const listenOpts: { port: number; host: string; reusePort?: boolean } = { port, host: '0.0.0.0' };
  if (process.platform === 'linux') listenOpts.reusePort = true;
  server.listen(listenOpts, () => {
    log(`serving on http://0.0.0.0:${port}`);
    if (CONFIG.DEV_AUTH_ENABLED) log('dev auth is ON — open the app and click "Start talking" to sign in locally.');
  });
}

main().catch((err) => {
  console.error('[buddy] failed to start:', err);
  process.exit(1);
});
