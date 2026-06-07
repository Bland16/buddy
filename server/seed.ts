// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        server/seed.ts
// DOMAIN:      db
// CONCEPT:     Idempotent sample-data seeder (runs through storage, never raw db)
// RELATIONS:   uses storage for every insert; reads/writes _meta('seeded') for idempotency
// KEY EXPORTS: seedDatabase, clearDatabase
// PURPOSE:     Fills the DB with realistic Buddy data so the app demos well immediately.
// LLM EDIT GUIDE: Change the data blocks (marked DAY-OF CHANGE). Keep it idempotent — re-running
//                 should be a no-op once seeded. Run standalone with `tsx server/seed.ts`.
// DAY-OF CHANGES: counts/aliases/items/sponsors below; the first user is the admin.
// ─────────────────────────────────────────────────────────────────────────

import { pathToFileURL } from 'url';
// PERSEUS EDGE: seed → storage (all writes funnel through the storage abstraction)
import { storage } from './storage';

const ts = () =>
  new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
const seedLog = (msg: string) => console.log(`[SEED ${ts()}] ${msg}`);

// DAY-OF CHANGE: 12 students with .edu emails + playful, character-y aliases. users[0] is the admin.
const SEED_USERS = [
  { alias: 'quiet_spark_42', first: 'Avery', email: 'avery@stanford.edu', admin: true },
  { alias: 'bookworm_brave', first: 'Sam', email: 'sam@mit.edu' },
  { alias: 'midnight_owl', first: 'Riley', email: 'riley@berkeley.edu' },
  { alias: 'kettle_logic', first: 'Jordan', email: 'jordan@cornell.edu' },
  { alias: 'soft_thunder', first: 'Taylor', email: 'taylor@nyu.edu' },
  { alias: 'pocket_galaxy', first: 'Casey', email: 'casey@umich.edu' },
  { alias: 'lemon_static', first: 'Morgan', email: 'morgan@uw.edu' },
  { alias: 'echo_chamber9', first: 'Quinn', email: 'quinn@utexas.edu' },
  { alias: 'velvet_comet', first: 'Devon', email: 'devon@gatech.edu' },
  { alias: 'rusty_compass', first: 'Skyler', email: 'skyler@ucla.edu' },
  { alias: 'paper_planet', first: 'Hayden', email: 'hayden@duke.edu' },
  { alias: 'glass_meadow', first: 'Reese', email: 'reese@brown.edu' },
];

// DAY-OF CHANGE: realistic chat lines used to fill completed sessions (no lorem ipsum).
const CHAT_LINES = [
  'ok genuine question, is cereal a soup',
  'absolutely not. soup is hot. cereal is chaos.',
  'what are you avoiding doing right now',
  'a problem set i fully understand and just dont want to start',
  'real. mine is an email i reread 4 times',
  'whats a tiny thing that made your day better',
  'cold water out of a glass bottle. unreasonably good.',
  'i will accept that answer',
  'do you reread books or only once',
  'reread, always. comfort > novelty some weeks',
  'thats such a reread person thing to say lol',
  'best low effort meal you actually like',
  'eggs on literally anything. toast, rice, regret',
  'eggs on regret is a vibe',
  'whats a song you have on repeat',
  'something slow i wont admit to. you?',
  'i mostly listen to one album until i hate it',
  'thats commitment honestly',
];

// DAY-OF CHANGE: 8 marketplace items (gift cards).
const ITEMS = [
  { merchantName: 'Amazon', pointCost: 50, faceValueUsd: '5.00', inventoryCount: 25 },
  { merchantName: 'Spotify (1-Month Premium)', pointCost: 60, faceValueUsd: '5.99', inventoryCount: 30 },
  { merchantName: 'Starbucks', pointCost: 50, faceValueUsd: '5.00', inventoryCount: 20 },
  { merchantName: 'Venmo', pointCost: 50, faceValueUsd: '5.00', inventoryCount: 40 },
  { merchantName: 'Chipotle', pointCost: 100, faceValueUsd: '10.00', inventoryCount: 15 },
  { merchantName: 'DoorDash', pointCost: 100, faceValueUsd: '10.00', inventoryCount: 12 },
  { merchantName: 'Apple', pointCost: 100, faceValueUsd: '10.00', inventoryCount: 18 },
  { merchantName: 'Target', pointCost: 50, faceValueUsd: '5.00', inventoryCount: 22 },
];

// DAY-OF CHANGE: 5 sponsors whose logos tile the chat wallpaper.
const SPONSORS = [
  { companyName: 'Notion', cpmRateUsd: '3.20' },
  { companyName: 'Red Bull', cpmRateUsd: '4.50' },
  { companyName: 'Spotify', cpmRateUsd: '3.80' },
  { companyName: 'Chipotle', cpmRateUsd: '2.90' },
  { companyName: 'Adobe', cpmRateUsd: '3.10' },
];

// DAY-OF CHANGE: moderation log seeds — a mix of clean and flagged.
const MOD_GUIDELINES = ['personal info', 'sexual content', 'harassment', 'self-harm'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Seed the database with realistic data. Idempotent: a no-op if _meta('seeded') is already set.
 * // HOW TO EXTEND: add a new data block above and an insert loop here, then bump the counts.
 */
export async function seedDatabase(): Promise<void> {
  const already = await storage.getMeta('seeded');
  if (already) {
    seedLog('Database already seeded — skipping. (Run clearDatabase() to reset.)');
    return;
  }

  // ── Users ──
  const userIds: string[] = [];
  for (let i = 0; i < SEED_USERS.length; i++) {
    const u = SEED_USERS[i];
    const id = `seed-user-${i + 1}`;
    await storage.upsertUser({
      id,
      email: u.email,
      firstName: u.first,
      lastName: 'Student',
      profileImageUrl: '',
    });
    await storage.updateUser(id, {
      anonymousAlias: u.alias,
      onboardingComplete: true,
      isAdmin: Boolean(u.admin),
    });
    userIds.push(id);
  }
  seedLog(`✓ Inserted ${userIds.length} users (admin: ${SEED_USERS[0].email})`);

  // ── 6 completed match sessions, each with 8–15 messages ──
  let completedMsgCount = 0;
  const completedSessionIds: number[] = [];
  for (let s = 0; s < 6; s++) {
    const a = userIds[(s * 2) % userIds.length];
    const b = userIds[(s * 2 + 1) % userIds.length];
    const waiting = await storage.createWaitingMatch(a);
    const active = await storage.joinMatch(waiting.id, b);
    const sessionId = active!.id;
    completedSessionIds.push(sessionId);

    const lineCount = 8 + Math.floor(Math.random() * 8); // 8–15
    for (let m = 0; m < lineCount; m++) {
      const sender = m % 2 === 0 ? a : b;
      await storage.insertMessage({
        sessionId,
        senderId: sender,
        content: CHAT_LINES[m % CHAT_LINES.length],
        verdict: 'clean',
        moderationChecked: true,
      });
      completedMsgCount++;
    }
    await storage.endMatch(sessionId);
  }
  seedLog(`✓ Inserted 6 completed sessions with ${completedMsgCount} messages`);

  // ── 3 active match sessions ──
  for (let s = 0; s < 3; s++) {
    const a = userIds[(s * 2 + 1) % userIds.length];
    const b = userIds[(s * 2 + 4) % userIds.length];
    const waiting = await storage.createWaitingMatch(a);
    await storage.joinMatch(waiting.id, b);
  }
  seedLog('✓ Inserted 3 active sessions');

  // ── 40 gift points distributed across users (recipient is the spender) ──
  for (let p = 0; p < 40; p++) {
    const earnerIdx = p % userIds.length;
    const recipientIdx = (p + 1) % userIds.length;
    await storage.insertGiftPoint({
      earnerId: userIds[earnerIdx],
      recipientId: userIds[recipientIdx],
      matchSessionId: pick(completedSessionIds),
      points: 1,
      spent: p % 7 === 0, // a few already spent
    });
  }
  seedLog('✓ Inserted 40 gift points');

  // ── 8 marketplace items ──
  const itemIds: number[] = [];
  for (const item of ITEMS) {
    const created = await storage.createMarketplaceItem(item);
    itemIds.push(created.id);
  }
  seedLog(`✓ Inserted ${itemIds.length} marketplace items`);

  // ── 5 sponsors (placeholder logos) ──
  for (const sp of SPONSORS) {
    await storage.createSponsor({
      companyName: sp.companyName,
      logoUrl: `https://placehold.co/120x48/5FBF86/FFFFFF?text=${encodeURIComponent(sp.companyName)}`,
      cpmRateUsd: sp.cpmRateUsd,
      impressionCount: Math.floor(Math.random() * 5000),
      active: true,
    });
  }
  seedLog(`✓ Inserted ${SPONSORS.length} sponsors`);

  // ── 3 completed redemptions ──
  for (let r = 0; r < 3; r++) {
    const redemption = await storage.createRedemption({
      userId: userIds[r + 1],
      itemId: itemIds[r],
      pointsSpent: ITEMS[r].pointCost,
      stripePaymentIntentId: `pi_seed_${r + 1}`,
    });
    await storage.updateRedemption(redemption.id, { status: 'fulfilled' });
  }
  seedLog('✓ Inserted 3 completed redemptions');

  // ── 20 moderation logs (mix of clean + flagged) ──
  for (let l = 0; l < 20; l++) {
    const flagged = l % 4 === 0; // ~25% flagged
    await storage.insertModerationLog({
      messageExcerpt: flagged ? 'hey whats your [handle]' : pick(CHAT_LINES).slice(0, 60),
      verdict: flagged ? 'flagged' : 'clean',
      guidelineTriggered: flagged ? pick(MOD_GUIDELINES) : null,
      nudgeSent: flagged,
      sessionId: pick(completedSessionIds),
    });
  }
  seedLog('✓ Inserted 20 moderation logs');

  await storage.setMeta('seeded', new Date().toISOString());
  seedLog('✓ Seed complete. Marked _meta(seeded).');
}

/**
 * Wipe the seed marker (and intentionally NOT the data) so seedDatabase() can run again.
 * For a full reset, drop + `npm run db:push`, then re-seed.
 * // HOW TO EXTEND: add explicit deletes here if you want a true clear without re-pushing the schema.
 */
export async function clearDatabase(): Promise<void> {
  await storage.setMeta('seeded', '');
  seedLog('Cleared the seed marker — seedDatabase() will run fresh next time.');
}

// Run standalone: `tsx server/seed.ts` (pathToFileURL handles Windows backslash paths too)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] failed:', err);
      process.exit(1);
    });
}
