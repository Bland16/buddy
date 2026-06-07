// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/storage.ts
// DOMAIN:      storage
// CONCEPT:     IStorage abstraction — the ONLY place raw db access lives
// RELATIONS:   imports db (server/db.ts) + @shared/schema; imported by every route, socket, service
// KEY EXPORTS: IStorage, DatabaseStorage, storage (singleton)
// PURPOSE:     One typed surface for every persistence operation Buddy needs.
// LLM EDIT GUIDE: Add the new operation to IStorage FIRST, then implement it in DatabaseStorage.
//                 Never call `db` directly from a route — always go through `storage`.
// DAY-OF CHANGES: add a query (e.g. leaderboard) — interface method + implementation, nothing else.
// ─────────────────────────────────────────────────────────────────────────

import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
// PERSEUS EDGE: storage → db (the single chokepoint for all SQL)
import {
  users,
  matchSessions,
  messages,
  giftPoints,
  moderationLogs,
  marketplaceItems,
  redemptions,
  sponsors,
  adImpressions,
  _meta,
  type User,
  type UpsertUser,
  type MatchSession,
  type Message,
  type InsertMessage,
  type GiftPoint,
  type InsertGiftPoint,
  type ModerationLog,
  type InsertModerationLog,
  type MarketplaceItem,
  type InsertMarketplaceItem,
  type Redemption,
  type Sponsor,
  type InsertSponsor,
  type InsertAdImpression,
} from '@shared/schema';

// ── SECTION: The persistence contract ──────────────────────────────────────

export interface IStorage {
  // Users
  upsertUser(user: UpsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, patch: Partial<User>): Promise<User | undefined>;

  // Matchmaking
  findWaitingMatch(excludeUserId: string): Promise<MatchSession | undefined>;
  createWaitingMatch(userId: string): Promise<MatchSession>;
  joinMatch(matchId: number, userId: string): Promise<MatchSession | undefined>;
  getMatch(matchId: number): Promise<MatchSession | undefined>;
  getActiveMatchForUser(userId: string): Promise<MatchSession | undefined>;
  endMatch(matchId: number): Promise<void>;
  setBothConsented(matchId: number, consented: boolean): Promise<void>;
  getMatchHistoryForUser(userId: string): Promise<MatchSession[]>;

  // Messages
  insertMessage(message: InsertMessage): Promise<Message>;
  getMessages(sessionId: number): Promise<Message[]>;
  updateMessageVerdict(messageId: number, verdict: string): Promise<void>;

  // Gift points
  insertGiftPoint(point: InsertGiftPoint): Promise<GiftPoint>;
  getSpendablePoints(recipientId: string): Promise<number>;
  getUnspentPointIds(recipientId: string, limit: number): Promise<number[]>;
  markPointsSpent(pointIds: number[]): Promise<void>;

  // Moderation
  insertModerationLog(log: InsertModerationLog): Promise<ModerationLog>;
  listModerationLogs(limit?: number): Promise<ModerationLog[]>;

  // Marketplace + redemptions
  listMarketplaceItems(includeInactive?: boolean): Promise<MarketplaceItem[]>;
  getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined>;
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  decrementInventory(id: number): Promise<void>;
  createRedemption(input: {
    userId: string;
    itemId: number;
    pointsSpent: number;
    stripePaymentIntentId?: string | null;
  }): Promise<Redemption>;
  updateRedemption(id: number, patch: Partial<Redemption>): Promise<void>;
  getRedemptionByPaymentIntent(paymentIntentId: string): Promise<Redemption | undefined>;

  // Sponsors + ads
  listActiveSponsors(): Promise<Sponsor[]>;
  listAllSponsors(): Promise<Sponsor[]>;
  createSponsor(sponsor: InsertSponsor): Promise<Sponsor>;
  updateSponsor(id: number, patch: Partial<Sponsor>): Promise<void>;
  deleteSponsor(id: number): Promise<void>;
  insertAdImpression(impression: InsertAdImpression): Promise<void>;

  // Seed bookkeeping
  getMeta(key: string): Promise<string | undefined>;
  setMeta(key: string, value: string): Promise<void>;
}

// ── SECTION: Drizzle implementation ────────────────────────────────────────

export class DatabaseStorage implements IStorage {
  // ── Users ──
  async upsertUser(user: UpsertUser): Promise<User> {
    // HOW TO EXTEND: add new user columns to the update set so re-logins refresh them.
    const [row] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    return row;
  }

  async updateUser(id: string, patch: Partial<User>): Promise<User | undefined> {
    const [row] = await db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return row;
  }

  // ── Matchmaking ──
  async findWaitingMatch(excludeUserId: string): Promise<MatchSession | undefined> {
    // HOW TO EXTEND: add an ORDER BY / topic filter to bias pairing toward shared tastes.
    const [row] = await db
      .select()
      .from(matchSessions)
      .where(and(eq(matchSessions.status, 'waiting'), sql`${matchSessions.userAId} <> ${excludeUserId}`))
      .limit(1);
    return row;
  }

  async createWaitingMatch(userId: string): Promise<MatchSession> {
    const [row] = await db
      .insert(matchSessions)
      .values({ userAId: userId, status: 'waiting' })
      .returning();
    return row;
  }

  async joinMatch(matchId: number, userId: string): Promise<MatchSession | undefined> {
    const [row] = await db
      .update(matchSessions)
      .set({ userBId: userId, status: 'active' })
      .where(and(eq(matchSessions.id, matchId), eq(matchSessions.status, 'waiting')))
      .returning();
    return row;
  }

  async getMatch(matchId: number): Promise<MatchSession | undefined> {
    const [row] = await db.select().from(matchSessions).where(eq(matchSessions.id, matchId));
    return row;
  }

  async getActiveMatchForUser(userId: string): Promise<MatchSession | undefined> {
    const [row] = await db
      .select()
      .from(matchSessions)
      .where(
        and(
          sql`${matchSessions.status} in ('waiting','active')`,
          sql`(${matchSessions.userAId} = ${userId} or ${matchSessions.userBId} = ${userId})`,
        ),
      )
      .orderBy(desc(matchSessions.startedAt))
      .limit(1);
    return row;
  }

  async endMatch(matchId: number): Promise<void> {
    await db
      .update(matchSessions)
      .set({ status: 'ended', endedAt: new Date() })
      .where(eq(matchSessions.id, matchId));
  }

  async setBothConsented(matchId: number, consented: boolean): Promise<void> {
    await db.update(matchSessions).set({ bothConsented: consented }).where(eq(matchSessions.id, matchId));
  }

  async getMatchHistoryForUser(userId: string): Promise<MatchSession[]> {
    return db
      .select()
      .from(matchSessions)
      .where(sql`(${matchSessions.userAId} = ${userId} or ${matchSessions.userBId} = ${userId})`)
      .orderBy(desc(matchSessions.startedAt));
  }

  // ── Messages ──
  async insertMessage(message: InsertMessage): Promise<Message> {
    const [row] = await db.insert(messages).values(message).returning();
    return row;
  }

  async getMessages(sessionId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(messages.createdAt);
  }

  async updateMessageVerdict(messageId: number, verdict: string): Promise<void> {
    await db
      .update(messages)
      .set({ verdict, moderationChecked: true })
      .where(eq(messages.id, messageId));
  }

  // ── Gift points ──
  async insertGiftPoint(point: InsertGiftPoint): Promise<GiftPoint> {
    const [row] = await db.insert(giftPoints).values(point).returning();
    // Keep the denormalized lifetime counter on the recipient in sync.
    await db
      .update(users)
      .set({ totalPointsReceived: sql`${users.totalPointsReceived} + ${row.points}` })
      .where(eq(users.id, row.recipientId));
    return row;
  }

  async getSpendablePoints(recipientId: string): Promise<number> {
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${giftPoints.points}), 0)` })
      .from(giftPoints)
      .where(and(eq(giftPoints.recipientId, recipientId), eq(giftPoints.spent, false)));
    return Number(row?.total ?? 0);
  }

  async getUnspentPointIds(recipientId: string, limit: number): Promise<number[]> {
    const rows = await db
      .select({ id: giftPoints.id })
      .from(giftPoints)
      .where(and(eq(giftPoints.recipientId, recipientId), eq(giftPoints.spent, false)))
      .orderBy(giftPoints.createdAt)
      .limit(limit);
    return rows.map((r) => r.id);
  }

  async markPointsSpent(pointIds: number[]): Promise<void> {
    if (pointIds.length === 0) return;
    await db
      .update(giftPoints)
      .set({ spent: true })
      .where(sql`${giftPoints.id} in (${sql.join(pointIds, sql`, `)})`);
  }

  // ── Moderation ──
  async insertModerationLog(log: InsertModerationLog): Promise<ModerationLog> {
    const [row] = await db.insert(moderationLogs).values(log).returning();
    return row;
  }

  async listModerationLogs(limit = 100): Promise<ModerationLog[]> {
    return db.select().from(moderationLogs).orderBy(desc(moderationLogs.createdAt)).limit(limit);
  }

  // ── Marketplace + redemptions ──
  async listMarketplaceItems(includeInactive = false): Promise<MarketplaceItem[]> {
    const q = db.select().from(marketplaceItems);
    if (includeInactive) return q.orderBy(marketplaceItems.pointCost);
    return q.where(eq(marketplaceItems.active, true)).orderBy(marketplaceItems.pointCost);
  }

  async getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined> {
    const [row] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id));
    return row;
  }

  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [row] = await db.insert(marketplaceItems).values(item).returning();
    return row;
  }

  async decrementInventory(id: number): Promise<void> {
    await db
      .update(marketplaceItems)
      .set({ inventoryCount: sql`greatest(${marketplaceItems.inventoryCount} - 1, 0)` })
      .where(eq(marketplaceItems.id, id));
  }

  async createRedemption(input: {
    userId: string;
    itemId: number;
    pointsSpent: number;
    stripePaymentIntentId?: string | null;
  }): Promise<Redemption> {
    const [row] = await db
      .insert(redemptions)
      .values({
        userId: input.userId,
        itemId: input.itemId,
        pointsSpent: input.pointsSpent,
        stripePaymentIntentId: input.stripePaymentIntentId ?? null,
        status: 'pending',
      })
      .returning();
    return row;
  }

  async updateRedemption(id: number, patch: Partial<Redemption>): Promise<void> {
    await db.update(redemptions).set(patch).where(eq(redemptions.id, id));
  }

  async getRedemptionByPaymentIntent(paymentIntentId: string): Promise<Redemption | undefined> {
    const [row] = await db
      .select()
      .from(redemptions)
      .where(eq(redemptions.stripePaymentIntentId, paymentIntentId));
    return row;
  }

  // ── Sponsors + ads ──
  async listActiveSponsors(): Promise<Sponsor[]> {
    return db.select().from(sponsors).where(eq(sponsors.active, true)).orderBy(desc(sponsors.cpmRateUsd));
  }

  async listAllSponsors(): Promise<Sponsor[]> {
    return db.select().from(sponsors).orderBy(desc(sponsors.createdAt));
  }

  async createSponsor(sponsor: InsertSponsor): Promise<Sponsor> {
    const [row] = await db.insert(sponsors).values(sponsor).returning();
    return row;
  }

  async updateSponsor(id: number, patch: Partial<Sponsor>): Promise<void> {
    await db.update(sponsors).set(patch).where(eq(sponsors.id, id));
  }

  async deleteSponsor(id: number): Promise<void> {
    await db.delete(sponsors).where(eq(sponsors.id, id));
  }

  async insertAdImpression(impression: InsertAdImpression): Promise<void> {
    await db.insert(adImpressions).values(impression);
    await db
      .update(sponsors)
      .set({ impressionCount: sql`${sponsors.impressionCount} + 1` })
      .where(eq(sponsors.id, impression.sponsorId));
  }

  // ── Seed bookkeeping ──
  async getMeta(key: string): Promise<string | undefined> {
    const [row] = await db.select().from(_meta).where(eq(_meta.key, key));
    return row?.value ?? undefined;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await db
      .insert(_meta)
      .values({ key, value })
      .onConflictDoUpdate({ target: _meta.key, set: { value } });
  }
}

// HOW TO EXTEND: add the new operation to the IStorage interface first, then implement it here.
// Never call `db` directly from a route — always go through `storage`.
export const storage = new DatabaseStorage();
