import { defineConfig } from 'drizzle-kit';

// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        drizzle.config.ts
// DOMAIN:      db
// CONCEPT:     drizzle-kit push configuration (schema → database, no migration files)
// RELATIONS:   reads shared/schema.ts (source of truth); used by `npm run db:push`
// KEY EXPORTS: default config
// PURPOSE:     Points drizzle-kit at shared/schema.ts and the Postgres DATABASE_URL.
// LLM EDIT GUIDE: Don't add migration tooling — Buddy uses `push`. Change `schema` only if the
//                 shared schema file moves.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

// REPLIT SETUP: Provision "PostgreSQL" from the Tools pane. DATABASE_URL is auto-injected.
// LOCAL DEV: set DATABASE_URL in a .env-style export or your shell to a local/Neon Postgres URL.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set — provision PostgreSQL from the Replit Tools pane (or set it locally).');
}

export default defineConfig({
  out: './migrations',
  schema: './shared/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
});
