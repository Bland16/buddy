import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import path from 'path';

// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        vite.config.ts
// DOMAIN:      config
// CONCEPT:     Vite build + dev configuration (Replit single-port standard)
// RELATIONS:   used by server/vite.ts (middleware mode), builds client → dist/public
// KEY EXPORTS: default config
// PURPOSE:     Configures React, path aliases (@, @shared), and the dist/public build target.
// LLM EDIT GUIDE: Change aliases or build target here. Do NOT add a dev-server proxy — the
//                 Express server runs Vite in middleware mode (one port, see server/index.ts).
// DAY-OF CHANGES: rarely edited; add a Vite plugin or alias if a new top-level dir appears.
// ─────────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
    },
  },
  root: path.resolve(import.meta.dirname, 'client'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: { fs: { strict: true, deny: ['**/.*'] } },
});
