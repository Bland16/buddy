// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        shared/schema.ts
// DOMAIN:      db
// CONCEPT:     The single source of truth — every Drizzle table, insert schema, and inferred type
// RELATIONS:   imported by server/db.ts, server/storage.ts, and the whole client via @shared/schema
// KEY EXPORTS: sessions, users, matchSessions, messages, giftPoints, moderationLogs,
//              marketplaceItems, redemptions, sponsors, adImpressions, _meta + all types + insert schemas
// PURPOSE:     Defines the Postgres schema and the TypeScript types derived from it.
// LLM EDIT GUIDE: Add/alter tables HERE, then implement access in server/storage.ts, then run
//                 `npm run db:push`. Never scatter raw SQL elsewhere. Do NOT touch `sessions`.
// DAY-OF CHANGES: add a column to `users` (e.g. a badge), add a marketplace category enum.
// ─────────────────────────────────────────────────────────────────────────

// ── CONCEPT: Buddy — Anonymous conversations; meet your kind of person ─────
// HOW THE POINT ECONOMY WORKS:
//   1. During a chat, the server randomly drops a GiftPoint (rate in server/config.ts)
//   2. earner = the user who triggered the drop; recipient = their match (the only spender)
//   3. The recipient sees their spendable balance on the Marketplace
//   4. Redemption creates a Stripe PaymentIntent; sponsor ad revenue covers the cost
// ─────────────────────────────────────────────────────────────────────────────

import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  serial,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

// ── SECTION: Replit Auth tables (mandatory, come first) ────────────────────

/**
 * sessions — REQUIRED by Replit Auth (connect-pg-simple stores express-session rows here).
 * Do NOT edit — Replit Auth / connect-pg-simple owns this table's shape.
 */
export const sessions = pgTable(
  'sessions',
  {
    /** Session id (cookie value). PK is a varchar because connect-pg-simple supplies the key. */
    sid: varchar('sid').primaryKey(),
    /** Serialized session payload (passport user, OIDC tokens). */
    sess: jsonb('sess').notNull(),
    /** Expiry timestamp; the index below lets the store sweep expired rows efficiently. */
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)],
);

/**
 * users — Replit Auth user upserted from OIDC claims, plus Buddy profile fields.
 * id is a varchar PK because it is the OIDC `sub` claim (not a generated serial).
 */
export const users = pgTable('users', {
  /** OIDC `sub` claim. Source of identity across the app. */
  id: varchar('id').primaryKey(),
  /** Verified email from OIDC — the source of truth for the .edu check. */
  email: varchar('email').unique(),
  /** Given name from OIDC claims (display only; never shown to a match). */
  firstName: varchar('first_name'),
  /** Family name from OIDC claims. */
  lastName: varchar('last_name'),
  /** Avatar URL from OIDC claims (never shown to a match — chats are anonymous). */
  profileImageUrl: varchar('profile_image_url'),
  /** Optional chosen handle (private). */
  username: varchar('username'),
  /** The playful alias shown to matches; also seeds the deterministic avatar sprite. */
  anonymousAlias: varchar('anonymous_alias'),
  /** True once the user finishes onboarding (alias + conversation tastes). */
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  /** Lifetime gift points received (denormalized counter for the profile). */
  totalPointsReceived: integer('total_points_received').default(0).notNull(),
  /** Admin operators see the Admin page and can manage sponsors/inventory. */
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// HOW TO EXTEND: add a Buddy profile column here (e.g. `badges jsonb`), then add a storage method
// and run `npm run db:push`. Keep auth-derived columns (id/email/names) untouched.

// ── SECTION: Matchmaking + chat ────────────────────────────────────────────

/**
 * matchSessions — one anonymous pairing of two users.
 * Serial PK: rows are app-generated, not auth-derived.
 */
export const matchSessions = pgTable(
  'match_sessions',
  {
    id: serial('id').primaryKey(),
    /** First participant (the user who created/entered the waiting pool first). */
    userAId: varchar('user_a_id'),
    /** Second participant; null while still 'waiting' for a pair. */
    userBId: varchar('user_b_id'),
    /** Lifecycle: waiting → active → ended. */
    status: varchar('status').default('waiting').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
    /** True after both users tap "all good" on a moderation nudge. */
    bothConsented: boolean('both_consented').default(false).notNull(),
  },
  (table) => [index('IDX_match_sessions_status').on(table.status)],
);
// HOW TO EXTEND: add a `topic` column to pair on shared conversation tastes; matchmaking.ts reads it.

/**
 * messages — chat messages within a session.
 * Serial PK; ordering is by createdAt.
 */
export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    /** FK → matchSessions.id (kept loose for hackathon speed). */
    sessionId: integer('session_id').notNull(),
    /** FK → users.id of the sender. */
    senderId: varchar('sender_id').notNull(),
    /** The message body. */
    content: text('content').notNull(),
    /** True once Claude moderation has resolved for this row. */
    moderationChecked: boolean('moderation_checked').default(false).notNull(),
    /** pending → clean | flagged | nudgeSent (set after screenMessage resolves). */
    verdict: varchar('verdict').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('IDX_messages_session').on(table.sessionId)],
);
// HOW TO EXTEND: add a `reactions jsonb` column for emoji reactions; ChatWindow renders them.

// ── SECTION: Point economy ─────────────────────────────────────────────────

/**
 * giftPoints — the ledger; one row per random drop.
 * KEY RULE: the earner can NEVER spend; only the recipient can.
 */
export const giftPoints = pgTable(
  'gift_points',
  {
    id: serial('id').primaryKey(),
    /** The user who triggered the drop. Cannot spend these points. */
    earnerId: varchar('earner_id').notNull(),
    /** The earner's match — the only person who can spend this point. */
    recipientId: varchar('recipient_id').notNull(),
    /** Which chat the drop happened in. */
    matchSessionId: integer('match_session_id').notNull(),
    /** Points awarded in this drop (usually 1). */
    points: integer('points').default(1).notNull(),
    /** True once spent in a redemption. */
    spent: boolean('spent').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('IDX_gift_points_recipient').on(table.recipientId)],
);
// HOW TO EXTEND: add `pointsKind` (e.g. bonus vs standard) and weight redemption by kind.

// ── SECTION: Moderation audit ──────────────────────────────────────────────

/**
 * moderationLogs — an audit row for EVERY Claude call (clean or flagged).
 * Serial PK. Excerpt is truncated + PII-stripped before storage.
 */
export const moderationLogs = pgTable('moderation_logs', {
  id: serial('id').primaryKey(),
  /** Truncated, PII-scrubbed snippet of the screened message. */
  messageExcerpt: text('message_excerpt'),
  /** clean | flagged. */
  verdict: varchar('verdict').notNull(),
  /** Which guideline tripped, if any (null when clean). */
  guidelineTriggered: varchar('guideline_triggered'),
  /** Whether an in-chat nudge was emitted to both users. */
  nudgeSent: boolean('nudge_sent').default(false).notNull(),
  /** Chat the screened message belonged to. */
  sessionId: integer('session_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
// HOW TO EXTEND: add `userId` to attribute logs per user for an abuse dashboard.

// ── SECTION: Marketplace + redemptions ─────────────────────────────────────

/**
 * marketplaceItems — gift-card listings a recipient can redeem points for.
 */
export const marketplaceItems = pgTable('marketplace_items', {
  id: serial('id').primaryKey(),
  /** e.g. "Amazon", "Spotify", "Starbucks". */
  merchantName: varchar('merchant_name').notNull(),
  /** Points required to redeem. */
  pointCost: integer('point_cost').notNull(),
  /** USD face value of the card (numeric to avoid float drift). */
  faceValueUsd: numeric('face_value_usd', { precision: 10, scale: 2 }).notNull(),
  /** Remaining inventory. */
  inventoryCount: integer('inventory_count').default(0).notNull(),
  /** Hidden from the storefront when false. */
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
// HOW TO EXTEND: add `category` (gift card | experience voucher) — see LLM_GUIDE example #4.

/**
 * redemptions — a user spending points on an item (creates a Stripe PaymentIntent).
 */
export const redemptions = pgTable('redemptions', {
  id: serial('id').primaryKey(),
  /** The spender (must be a point recipient). */
  userId: varchar('user_id').notNull(),
  /** FK → marketplaceItems.id. */
  itemId: integer('item_id').notNull(),
  /** Points debited. */
  pointsSpent: integer('points_spent').notNull(),
  /** Stripe PaymentIntent id once created. */
  stripePaymentIntentId: varchar('stripe_payment_intent_id'),
  /** pending → fulfilled | failed (webhook flips to fulfilled). */
  status: varchar('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
// HOW TO EXTEND: add `deliveredCode` to store the issued gift-card code after fulfillment.

// ── SECTION: Sponsors + ad impressions (the revenue side) ──────────────────

/**
 * sponsors — wallpaper sponsors whose logos tile behind the chat (the ad unit).
 */
export const sponsors = pgTable('sponsors', {
  id: serial('id').primaryKey(),
  /** Brand name shown on the tile pill. */
  companyName: varchar('company_name').notNull(),
  /** Logo image URL (placeholder ok for the demo). */
  logoUrl: varchar('logo_url'),
  /** Cost per mille (per 1,000 impressions) in USD. */
  cpmRateUsd: numeric('cpm_rate_usd', { precision: 10, scale: 2 }).default('2.50').notNull(),
  campaignStart: timestamp('campaign_start'),
  campaignEnd: timestamp('campaign_end'),
  /** Denormalized running impression count. */
  impressionCount: integer('impression_count').default(0).notNull(),
  /** Off-campaign sponsors are not served. */
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
// HOW TO EXTEND: add `clickCount` + a /api/ad-clicks route to track CTR alongside impressions.

/**
 * adImpressions — one row per wallpaper render (CPM logging).
 */
export const adImpressions = pgTable(
  'ad_impressions',
  {
    id: serial('id').primaryKey(),
    /** FK → sponsors.id. */
    sponsorId: integer('sponsor_id').notNull(),
    /** Who saw it. */
    userId: varchar('user_id'),
    /** Which chat it rendered in. */
    sessionId: integer('session_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('IDX_ad_impressions_sponsor').on(table.sponsorId)],
);
// HOW TO EXTEND: batch impressions client-side and insert in bulk if volume grows.

/**
 * _meta — tiny key/value table used by the seeder for idempotency bookkeeping.
 */
export const _meta = pgTable('_meta', {
  key: varchar('key').primaryKey(),
  value: text('value'),
});

// ── SECTION: Insert schemas (drizzle-zod) ──────────────────────────────────
// Used for runtime validation of writes. Generated columns are omitted.

export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const insertMatchSessionSchema = createInsertSchema(matchSessions).omit({ id: true, startedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertGiftPointSchema = createInsertSchema(giftPoints).omit({ id: true, createdAt: true });
export const insertModerationLogSchema = createInsertSchema(moderationLogs).omit({ id: true, createdAt: true });
export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({ id: true, createdAt: true });
export const insertRedemptionSchema = createInsertSchema(redemptions).omit({ id: true, createdAt: true });
export const insertSponsorSchema = createInsertSchema(sponsors).omit({ id: true, createdAt: true });
export const insertAdImpressionSchema = createInsertSchema(adImpressions).omit({ id: true, createdAt: true });

// ── SECTION: Inferred types (single source of truth for the whole app) ──────

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = InsertUser;

export type MatchSession = typeof matchSessions.$inferSelect;
export type InsertMatchSession = typeof matchSessions.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type GiftPoint = typeof giftPoints.$inferSelect;
export type InsertGiftPoint = typeof giftPoints.$inferInsert;

export type ModerationLog = typeof moderationLogs.$inferSelect;
export type InsertModerationLog = typeof moderationLogs.$inferInsert;

export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type InsertMarketplaceItem = typeof marketplaceItems.$inferInsert;

export type Redemption = typeof redemptions.$inferSelect;
export type InsertRedemption = typeof redemptions.$inferInsert;

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = typeof sponsors.$inferInsert;

export type AdImpression = typeof adImpressions.$inferSelect;
export type InsertAdImpression = typeof adImpressions.$inferInsert;

// ── Recommended indexes ────────────────────────────────────────────────────
// Indexes for messages.sessionId, giftPoints.recipientId, matchSessions.status, and
// adImpressions.sponsorId are declared inline above and applied by `npm run db:push`.
// If you add hot query paths, paste the equivalent SQL into the Replit Database query console:
//
//   CREATE INDEX IF NOT EXISTS "IDX_messages_session"        ON "messages" ("session_id");
//   CREATE INDEX IF NOT EXISTS "IDX_gift_points_recipient"   ON "gift_points" ("recipient_id");
//   CREATE INDEX IF NOT EXISTS "IDX_match_sessions_status"   ON "match_sessions" ("status");
//   CREATE INDEX IF NOT EXISTS "IDX_ad_impressions_sponsor"  ON "ad_impressions" ("sponsor_id");
// ───────────────────────────────────────────────────────────────────────────
