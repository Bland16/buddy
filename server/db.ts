// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/db.ts
// DOMAIN:      db
// CONCEPT:     The Drizzle database client (Neon serverless on Replit, node-postgres locally)
// RELATIONS:   imports @shared/schema; used only by server/storage.ts (never by routes directly)
// KEY EXPORTS: db, pool
// PURPOSE:     Opens one pooled connection and returns a Drizzle client bound to the shared schema.
// LLM EDIT GUIDE: Don't query `db` from routes — go through server/storage.ts. Driver selection is
//                 automatic; you shouldn't need to change this file.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

// REPLIT SETUP: Provision "PostgreSQL" from the Tools pane. DATABASE_URL is auto-injected.
// Run `npm run db:push` to sync shared/schema.ts to the database.

import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from 'ws';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Provision a database from the Replit Tools pane (or set it locally).');
}

/**
 * Driver selection:
 *  - On Replit (and any Neon URL) use @neondatabase/serverless over WebSockets — the exact
 *    Replit-standard pattern.
 *  - Locally, a plain Postgres URL uses node-postgres so you can run against a local DB on Windows.
 * Detection: Neon connection strings contain "neon.tech"; everything else falls back to `pg`.
 * Importing both drivers is cheap — neither opens a socket until a Pool is constructed below.
 */
const isNeon = /neon\.tech/i.test(process.env.DATABASE_URL) || process.env.USE_NEON === '1';

let dbInstance: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzlePg>;
let poolInstance: NeonPool | PgPool;

if (isNeon) {
  console.log('[buddy] db: using Neon serverless driver.');
  neonConfig.webSocketConstructor = ws;
  const neonPool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  poolInstance = neonPool;
  dbInstance = drizzleNeon({ client: neonPool, schema });
} else {
  console.log('[buddy] db: using node-postgres driver (local dev).');
  const pgPool = new PgPool({ connectionString: process.env.DATABASE_URL });
  poolInstance = pgPool;
  dbInstance = drizzlePg(pgPool, { schema });
}

export const db = dbInstance;
export const pool = poolInstance;
