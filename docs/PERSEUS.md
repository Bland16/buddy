# Buddy — Perseus Repo Graph

[Perseus](https://perseus.computer) indexes this repo into a searchable knowledge graph. Buddy is built
to maximize that: every `.ts`/`.tsx` file opens with a **PERSEUS GRAPH NODE** header, cross-domain
imports carry **PERSEUS EDGE** comments, and `shared/domain-vocab.ts` is the concept index.

---

## Setup

1. `npx perseus init` in the repo root
2. `npx perseus index` to build the initial graph
3. After adding files: `npx perseus index --incremental`

---

## Repo graph overview

```
[Replit Auth/OIDC] ─► [users] ─► [matchSessions] ─► [messages]
                          │             │                │
                     [giftPoints]   [sessions]    [moderationLogs]
                          │
                  [marketplaceItems] ─► [redemptions] ─► [Stripe]
[sponsors] ─► [adImpressions] ─► [matchSessions]
```

---

## Node catalogue

| Concept | Primary file | Key exports | Connected to |
|---|---|---|---|
| Auth (OIDC + dev) | `server/replitAuth.ts` | `getSession`, `setupAuth`, `isAuthenticated` | storage, requireEdu, chatSocket |
| .edu enforcement | `server/middleware/requireEdu.ts` | `requireEdu` | config (`EDU_DOMAIN_ALLOWLIST`) |
| Storage | `server/storage.ts` | `IStorage`, `DatabaseStorage`, `storage` | db, every route/service |
| Schema | `shared/schema.ts` | all tables + types + insert schemas | storage, client |
| Matchmaking | `server/services/matchmaking.ts` | `joinQueue`, `leaveQueue` | storage, routes/match |
| Chat (real-time) | `server/websocket/chatSocket.ts` | `setupChatSocket` | moderation, points, storage |
| Moderation | `server/services/moderation.ts` | `screenMessage` | config (model/prompt/tool), storage |
| Points | `server/services/points.ts` | `rollPointDrop`, `getSpendableBalance` | config, storage |
| Marketplace | `server/routes/marketplace.ts` | `marketplaceRouter` | storage, Stripe, points |
| Ads | `server/routes/sponsors.ts` | `sponsorsRouter` | storage |
| Admin | `server/routes/admin.ts` | `adminRouter`, `requireAdmin` | storage, config |
| Sprites | `client/src/assets/sprites.ts` | `SPRITES`, `SPRITE_ANIMATIONS`, `avatarForAlias` | Sprite, BuddyAnim |
| Domain vocab | `shared/domain-vocab.ts` | `DOMAIN_VOCAB` | everything (concept map) |

---

## Recommended queries (8)

1. “Show me everything involved in dropping a Gift Point.” → `services/points.ts`, `websocket/chatSocket.ts`, `schema.ts#giftPoints`
2. “Where does Claude get called?” → `services/moderation.ts` (+ `config.ts` prompt/tool)
3. “What happens when a message is flagged?” → `chatSocket.ts` → `chat:nudge` → `components/ModerationNudge.tsx`
4. “Trace a redemption from button click to Stripe.” → `MarketplaceItem.tsx` → `routes/marketplace.ts` → Stripe → webhook
5. “How does .edu enforcement work?” → `middleware/requireEdu.ts` + `config.ts#EDU_DOMAIN_ALLOWLIST`
6. “Where is the Socket.io session authenticated?” → `chatSocket.ts` (`io.engine.use(getSession())` + passport)
7. “Which file owns the sessions table?” → `shared/schema.ts#sessions` (owned by Replit Auth/connect-pg-simple)
8. “How do I add a new API route?” → `docs/LLM_GUIDE.md` → new `routes/<name>.ts` + register in `routes/index.ts`

---

## Day-of tips

- Added a route/file? Re-index: `npx perseus index --incremental` before asking your agent to modify it.
- Paste `docs/PERSEUS.md` + `shared/domain-vocab.ts` when an agent is unsure where a concept lives.
