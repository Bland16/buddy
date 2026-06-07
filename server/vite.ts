// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/vite.ts
// DOMAIN:      config
// CONCEPT:     Single-port serving — Vite in middleware mode (dev) or built static files (prod)
// RELATIONS:   called by server/index.ts after registerRoutes; reads vite.config.ts
// KEY EXPORTS: setupVite, serveStatic, log
// PURPOSE:     Lets ONE Express server serve both the API and the React app on one port.
// LLM EDIT GUIDE: Don't add a separate Vite dev server or an /api proxy — the whole point is one port.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import type { Express } from 'express';
import type { Server } from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';

/** Tiny timestamped logger used across the server. */
export function log(message: string, source = 'buddy'): void {
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`${time} [${source}] ${message}`);
}

/**
 * DEV: run Vite in middleware mode so HMR + the API share one port.
 * // HOW TO EXTEND: pass custom Vite server options here if you need a specific HMR config.
 */
export async function setupVite(app: Express, server: Server): Promise<void> {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server } },
    appType: 'custom',
  });

  app.use(vite.middlewares);

  // Serve index.html through Vite (with HMR transforms) for any non-API route.
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith('/api') || url.startsWith('/socket.io')) return next();
    try {
      const clientTemplate = path.resolve(import.meta.dirname, '..', 'client', 'index.html');
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/**
 * PROD: serve the built client from dist/public and SPA-fallback to index.html.
 * // HOW TO EXTEND: add cache headers for hashed assets if you want longer browser caching.
 */
export function serveStatic(app: Express): void {
  const distPath = path.resolve(import.meta.dirname, 'public');
  if (!fs.existsSync(distPath)) {
    throw new Error(`Build output not found at ${distPath}. Run \`npm run build\` first.`);
  }
  app.use(express.static(distPath));
  app.use('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) return next();
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}
