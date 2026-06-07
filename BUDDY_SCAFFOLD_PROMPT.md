# BUDDY — Hackathon Scaffold Generator Prompt
> **Target platform:** Replit (fullstack JavaScript app) · Perseus (perseus.computer) · Anthropic Claude API
> **Architecture (Replit-standard):** React 18 + Vite (client) · Express + Node 20 (server) · Neon PostgreSQL via Drizzle ORM · Socket.io · Replit Auth (OIDC) · single-port server (5000)

---

## HOW TO USE THIS PROMPT
Paste this entire document into **Replit Agent** (or Claude in a fresh conversation) as your opening
message. It is a complete, self-contained instruction set that produces a project matching Replit's
**fullstack JavaScript** conventions exactly, so it runs on Replit with zero manual code edits.

After the scaffold is generated:
1. Provision **PostgreSQL** and enable **Replit Auth** from the Replit Tools pane (see `docs/SETUP.md`).
2. Add the two app secrets (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`) in the Secrets pane.
3. Run `npm run db:push` to create tables, press **Run**, then consult `docs/PERSEUS.md` to index the repo.

> **Non-negotiable Replit conventions** (the rest of this document assumes them):
> - **Single `package.json` at the repo root.** No npm workspaces, no monorepo, no separate
>   `client/package.json` or `server/package.json`.
> - **One server process on one port.** Express listens on `process.env.PORT ?? 5000`, host `0.0.0.0`.
>   In development Express runs **Vite in middleware mode**; in production Express serves the built
>   static client from `dist/public`. There is **no** separate Vite dev server and **no** `/api` proxy.
> - **Shared code lives in `shared/`** and is imported via the `@shared/*` path alias. The Drizzle
>   schema in `shared/schema.ts` is the single source of truth for DB tables *and* TypeScript types.
> - **Database access is `drizzle-kit push`**, not migration files. The script is `npm run db:push`.
> - **Secrets, never `.env`.** Replit injects `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`,
>   `REPLIT_DOMAINS`, and `ISSUER_URL` automatically once the integrations are enabled. App-level
>   keys (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`) are added by hand in the Secrets pane.

---

## PROJECT CONCEPT

**Buddy** — *Meet your kind of person.* A low-stakes place to talk to someone new, anonymously, and
find out who you actually click with — no names, no profiles, no pressure.

> **Internal framing note (never surface in UI copy):** the product quietly helps people get more
> fluent and at ease in conversation. We never say this — the moment Buddy reads as a "social skills"
> or "confidence" tool, people stop using it. All user-facing copy follows `BUDDY_BRAND_AESTHETIC.md`
> (warm & low-key voice; banned vocabulary: practice, confidence, skills, shy, awkward, introvert,
> community, empower, safe space, etc.).

Core loop:
1. User signs in with **Replit Auth**; the app enforces a **`.edu` email** domain check on the
   verified email claim before allowing access to the matchmaking flow.
2. The platform anonymously matches two users for a text-only chat session.
3. An AI moderation layer (**Anthropic Claude**) screens every message in real time. If a message
   contains personal information or violates community guidelines, Claude returns a structured
   verdict and the server sends a gentle, in-chat **nudge** to both users — asking if they're
   comfortable continuing and naming the relevant guideline.
4. During the chat, at random intervals, a user earns **Gift Points** — points they *cannot spend
   themselves*; only their current or past match recipients can spend them.
5. Points accumulate in a **Marketplace** where users redeem them for real gifts ($5 gift cards,
   etc.), funded by sponsored banner ads tiled as the chat wallpaper (Snapchat-style tiled corporate
   logos). Ad revenue at standard banner CPM rates underwrites the gift-card cost.

Admin operators can manage sponsors, review moderation logs, adjust point-drop rates, and monitor
marketplace inventory.

---

## STACK & VERSIONS (PINNED)

| Layer | Choice | Version / id |
|---|---|---|
| Frontend | React + Vite | React 18.3, Vite 5.x |
| Routing | **wouter** (Replit default) | 3.x |
| Data fetching | **TanStack Query** (`@tanstack/react-query`) | 5.x |
| Styling | TailwindCSS | 3.4 |
| UI primitives | Radix UI + class-variance-authority (shadcn-style, optional) | latest |
| Language | TypeScript | 5.4+ throughout, `"strict": true` |
| Backend | Express + Node.js | Express 4.x, Node 20 |
| Database | Neon serverless PostgreSQL via Drizzle ORM | `drizzle-orm` 0.30+, `drizzle-kit` 0.24+ |
| DB driver | `@neondatabase/serverless` + `ws` | latest |
| Validation | `drizzle-zod` + `zod` | latest |
| Auth | **Replit Auth (OIDC)** via `openid-client`, `passport`, `express-session`, `connect-pg-simple`, `memoizee` | latest |
| Real-time | Socket.io | 4.7 |
| AI Moderation | Anthropic Claude (`@anthropic-ai/sdk`) | model `claude-sonnet-4-6` |
| Payments | Stripe (`stripe` npm pkg) | latest |
| Dev runner | `tsx` (run TS server directly) | latest |
| Prod bundler | `esbuild` (bundle server) | latest |
| Env / secrets | Replit Secrets | built-in |
| Deployment | Replit Autoscale Deploy | built-in |

> **Model note:** `claude-sonnet-4-6` is the current Claude Sonnet. To pin a specific dated snapshot,
> replace it with a dated id in `server/config.ts` only — it appears in exactly one place.

---

## REPLIT-NATIVE INTEGRATIONS

For each integration add a clearly labeled `// REPLIT SETUP:` comment at the top of the relevant file
explaining how to activate it from the Replit Tools/Secrets pane.

### 1 · Replit Auth (OIDC) — the real blueprint
Implement Replit Auth exactly as Replit's official integration does. **Do not invent packages.** Use:
`openid-client`, `openid-client/passport` strategy, `passport`, `express-session`, `connect-pg-simple`,
`memoizee`.

Create **`server/replitAuth.ts`** exporting:
- `getSession(): RequestHandler` — an `express-session` middleware backed by `connect-pg-simple`,
  storing sessions in the Postgres **`sessions`** table (`createTableIfMissing: false`, 7-day TTL,
  `cookie: { httpOnly: true, secure: true }`).
- `setupAuth(app: Express): Promise<void>` — initializes passport, discovers the OIDC config
  (memoized for 1h via `client.discovery(new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
  process.env.REPL_ID!)`), registers one `OpenIDStrategy` per host in
  `process.env.REPLIT_DOMAINS.split(",")`, and mounts these routes:
  - `GET /api/login` → `passport.authenticate(...)` with `prompt: "login consent"`, scope
    `"openid email profile offline_access"`.
  - `GET /api/callback` → completes the flow, then redirects to `/`.
  - `GET /api/logout` → `req.logout(...)` then redirect to the OIDC `end_session_endpoint`.
- `isAuthenticated: RequestHandler` — verifies `req.isAuthenticated()` and the session token is not
  expired; if an `expires_at` has passed, **refreshes** the token using the stored `refresh_token`
  before continuing, else returns `401`.

On every successful login, **upsert** the user into the `users` table from the OIDC claims
(`sub` → `id`, `email`, `first_name`, `last_name`, `profile_image_url`). The verified email claim is
the source of truth for the `.edu` check.

Create **`server/middleware/requireEdu.ts`** — runs *after* `isAuthenticated`, extracts the domain
from the verified email, and rejects non-`.edu` (or non-allowlisted) domains with `403` and JSON
`{ code: "EDU_REQUIRED", message: "Buddy is for verified students. Sign in with your .edu email." }`.
The allowlist comes from `EDU_DOMAIN_ALLOWLIST` in `server/config.ts`.

```typescript
// REPLIT SETUP: Enable "Auth" (Replit Auth) from the Tools pane. It auto-injects
// REPL_ID, REPLIT_DOMAINS, ISSUER_URL, and SESSION_SECRET as Secrets. No package install needed
// beyond openid-client / passport / express-session / connect-pg-simple / memoizee.
```

### 2 · Neon PostgreSQL via Drizzle
- Use the Replit-provisioned database. `DATABASE_URL` is auto-injected as a Secret — never hardcode it.
- **`server/db.ts`** (exact pattern):
  ```typescript
  import { Pool, neonConfig } from '@neondatabase/serverless';
  import { drizzle } from 'drizzle-orm/neon-serverless';
  import ws from 'ws';
  import * as schema from '@shared/schema';

  neonConfig.webSocketConstructor = ws;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set. Provision a database from the Replit Tools pane.');
  }
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzle({ client: pool, schema });
  ```
- All Drizzle tables live in **`shared/schema.ts`** (source of truth). Schema changes are applied with
  `npm run db:push` (`drizzle-kit push`) — **no migration files**.
- All DB reads/writes go through **`server/storage.ts`** (the `IStorage` abstraction — see below),
  never raw `db` calls scattered through routes.

```typescript
// REPLIT SETUP: Provision "PostgreSQL" from the Tools pane. DATABASE_URL is auto-injected.
// Run `npm run db:push` to sync shared/schema.ts to the database.
```

### 3 · Storage abstraction (`server/storage.ts`) — Replit convention
Define and export an **`IStorage`** interface listing every persistence operation the app needs
(user upsert/get, match create/join/leave/get, message insert/list, gift-point insert/sum-by-recipient,
moderation-log insert, marketplace list/get, redemption create/update, sponsor list/CRUD,
ad-impression insert, seed `_meta` helpers). Implement it as **`DatabaseStorage`** using Drizzle, and
export a singleton `export const storage = new DatabaseStorage();`. Routes and socket handlers import
`storage`, not `db`.

```typescript
// HOW TO EXTEND: add the new operation to the IStorage interface first, then implement it in
// DatabaseStorage. Never call `db` directly from a route — always go through `storage`.
```

### 4 · Replit Secrets
- All sensitive config is in Replit Secrets, not committed `.env` files.
- Provide a **`.env.example`** listing every key with a placeholder and one-line description (safe to
  commit; for documentation only — the app reads `process.env`).
- Keys:
  - `DATABASE_URL` — auto-injected by Replit PostgreSQL
  - `SESSION_SECRET` — auto-injected by Replit Auth (session signing)
  - `REPL_ID` — auto-injected by Replit Auth (OIDC client id)
  - `REPLIT_DOMAINS` — auto-injected by Replit Auth (comma-separated allowed hosts)
  - `ISSUER_URL` — auto-injected by Replit Auth (defaults to `https://replit.com/oidc`)
  - `ANTHROPIC_API_KEY` — **add manually**; Claude moderation
  - `STRIPE_SECRET_KEY` — **add manually**; gift-card redemption
- **`server/config.ts`** reads each required secret via explicit `process.env` references and throws a
  single descriptive error at startup listing every missing key.

### 5 · Stripe (gift-card redemption)
- Use the `stripe` npm package with `STRIPE_SECRET_KEY` from Secrets.
- `server/routes/marketplace.ts` handles: creating a PaymentIntent on redemption, and a
  `POST /api/stripe/webhook` (raw-body) endpoint that marks redemptions `fulfilled`.
- `STRIPE_WEBHOOK_SECRET` is optional — if absent, skip signature verification with a console warning
  (hackathon-friendly). Add a `// DAY-OF CHANGE` comment on that fallback.
```typescript
// REPLIT SETUP: Add STRIPE_SECRET_KEY in the Secrets pane. For webhooks, expose the deployed URL
// + /api/stripe/webhook in the Stripe dashboard and add STRIPE_WEBHOOK_SECRET.
```

### 6 · Replit Deployment (Autoscale)
- `.replit` includes a `[deployment]` block targeting `autoscale` with `build = ["npm","run","build"]`
  and `run = ["npm","run","start"]`.
- `docs/SETUP.md` explains one-click deploy from the Deploy pane.

### 7 · Replit Multiplayer
- Note in `docs/SETUP.md` that Multiplayer lets teammates edit the same Repl simultaneously — ideal
  for hackathon pair coding.

---

## PERSEUS OPTIMIZATION REQUIREMENTS

**Perseus (perseus.computer)** indexes this repo into a searchable knowledge graph any coding agent can
query. Every structural and documentation decision must maximize Perseus's ability to surface code.

### A · File-Level Graph Hints
Every `.ts`/`.tsx` file must begin with this header block:

```typescript
// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        <path relative to project root>
// DOMAIN:      <one of: auth | matchmaking | chat | moderation | points |
//               marketplace | ads | admin | db | storage | config | types | ui>
// CONCEPT:     <plain-English name of the domain concept this file owns>
// RELATIONS:   <e.g. "imports storage", "used by chatSocket", "owns giftPoints table">
// KEY EXPORTS: <comma-separated most important named exports>
// PURPOSE:     <one-sentence description>
// LLM EDIT GUIDE: <what to change here vs. what to leave alone>
// DAY-OF CHANGES: <2-3 most likely hackathon-day edits>
// ─────────────────────────────────────────────────────────────────────────
```

### B · Domain Vocabulary Index
Create a single shared file **`shared/domain-vocab.ts`** (imported by both client and server via
`@shared/domain-vocab`) exporting `DOMAIN_VOCAB` — every Buddy term mapped to a plain-English
definition and the file path(s) where it is implemented:

```typescript
export const DOMAIN_VOCAB = {
  GiftPoint: {
    definition: 'A point earned during chat that only a recipient can redeem, not the earner',
    implementedIn: ['shared/schema.ts#giftPoints', 'server/services/points.ts'],
  },
  ModerationNudge: {
    definition: 'A Claude-generated in-chat message sent to both users when a guideline risk is detected',
    implementedIn: ['server/services/moderation.ts', 'server/websocket/chatSocket.ts'],
  },
  // ... one entry per domain concept
} as const;
```

### C · Named Exports Everywhere
- Use **named exports** for all services, hooks, helpers, types, constants, and storage methods so
  Perseus can traverse the import graph.
- The only `export default` allowed is a page/route component file under `client/src/pages/` (a common
  React convention). Everything else is named.

### D · Relationship (edge) Comments
At every cross-domain import, add a one-line edge comment:
```typescript
// PERSEUS EDGE: chat → moderation (every outgoing message is screened before the nudge decision)
import { screenMessage } from '../services/moderation';
```

### E · Section Banner Comments
Group logic within a file under labeled banners:
```typescript
// ── SECTION: Point Drop Logic ──────────────────────────────────────────────
// ── SECTION: Real-time Listeners ───────────────────────────────────────────
// ── SECTION: Claude Moderation Call ────────────────────────────────────────
```

### F · HOW TO EXTEND Comments
Every function, route handler, React component, socket event handler, and Drizzle table definition
includes a `// HOW TO EXTEND:` comment.

### G · DAY-OF CHANGE Markers
Every magic number, tunable constant, copy string, and feature flag has a `// DAY-OF CHANGE` comment
explaining what changing it does.

---

## FILE STRUCTURE

Generate exactly the following. Every file must be complete — no stubs, no `// implement this`, no
truncation. **This layout is the Replit fullstack-JS standard: root config, `client/`, `server/`,
`shared/`.**

```
buddy/
├── .replit                          # Replit modules + run + autoscale deploy config
├── package.json                     # SINGLE root package.json (no workspaces)
├── tsconfig.json                    # Strict TS; paths @/* → client/src, @shared/* → shared
├── vite.config.ts                   # Root Vite config; React + Replit plugins; @/@shared aliases
├── tailwind.config.ts               # Tailwind; mirrors design tokens from client config
├── postcss.config.js
├── drizzle.config.ts                # drizzle-kit config; schema = ./shared/schema.ts; push workflow
├── components.json                  # shadcn-style aliases (optional but include)
├── .env.example                     # Secret key template (documentation only; safe to commit)
│
├── shared/                          # Code imported by BOTH client and server (@shared/*)
│   ├── schema.ts                    # ALL Drizzle tables + drizzle-zod insert schemas + inferred types
│   └── domain-vocab.ts              # Perseus domain vocabulary (single shared source)
│
├── client/                          # React 18 + Vite frontend
│   ├── index.html                   # Vite entry; loads /src/main.tsx; NO inline secrets
│   └── src/
│       ├── main.tsx                 # Mounts <App /> inside QueryClientProvider
│       ├── App.tsx                  # wouter routes + auth gate
│       ├── index.css                # Tailwind directives + CSS vars for design tokens
│       ├── config.ts                # ALL client constants, feature flags, UI copy, API route map
│       ├── lib/
│       │   ├── queryClient.ts       # TanStack Query client + apiRequest() + default fetcher
│       │   └── socket.ts            # Socket.io client singleton (connects to same origin)
│       ├── assets/
│       │   ├── sprites/              # 55 segmented transparent PNGs (see BUDDY_SPRITES.md for names)
│       │   └── sprites.ts            # SPRITES map (name→imported url) + SPRITE_ANIMATIONS manifest
│       ├── hooks/
│       │   ├── useAuth.ts           # Replit Auth state via useQuery(['/api/auth/user'])
│       │   ├── useChat.ts           # Socket.io chat subscription hook
│       │   ├── useMatch.ts          # Matchmaking state hook (TanStack Query mutations)
│       │   └── usePoints.ts         # Points balance via useQuery
│       ├── pages/
│       │   ├── LandingPage.tsx      # Landing; `buddy_smirk` logo + `buddy-wave` greeting; "Start talking" → /api/login
│       │   ├── OnboardingPage.tsx   # Post-auth: pick an alias + "what kind of conversations are you into?"
│       │   ├── MatchWaitingPage.tsx # Matchmaking wait; `searching` + `buddy-sleepy` while it runs, `match-found` on pair
│       │   ├── ChatPage.tsx         # Main chat UI with sponsored wallpaper
│       │   ├── MarketplacePage.tsx  # Browse + redeem gift cards with points
│       │   ├── ProfilePage.tsx      # Points balance, chat history, badges
│       │   ├── AdminPage.tsx        # Sponsor mgmt, moderation logs, inventory
│       │   └── NotFoundPage.tsx     # wouter fallback route
│       └── components/
│           ├── Sprite.tsx           # <Sprite name="buddy_smirk" /> — renders one named sprite by key
│           ├── BuddyAnim.tsx        # <BuddyAnim animation="searching" /> — flipbook + CSS animation driver
│           ├── ChatWindow.tsx       # Message list; real-time via Socket.io; typing uses `typing` (chat_typing)
│           ├── ChatInput.tsx        # Composer; send button plays `send-whoosh` (send_plane)
│           ├── ModerationNudge.tsx  # In-chat nudge card; uses `buddy-nudge` (buddy_gentle + shield_heart)
│           ├── SponsoredWallpaper.tsx # Tiled ad wallpaper behind chat bubbles
│           ├── AdBanner.tsx         # Individual sponsor banner tile
│           ├── PointsDisplay.tsx    # Points counter + gift button; point drop plays `point-pop` + `buddy-celebrate`
│           ├── MarketplaceItem.tsx  # Gift card card; redeem success plays `buddy-celebrate` + redeem_seal
│           ├── MatchCard.tsx        # Anonymous match; avatar_* sprite chosen deterministically from the alias
│           └── AdminTable.tsx       # Generic sortable/filterable data table
│
├── server/                          # Express + Node.js backend (single process, single port)
│   ├── index.ts                     # Express entry: session, auth, routes, socket.io, Vite/static, listen(5000)
│   ├── vite.ts                      # setupVite() (middleware mode, dev) + serveStatic() (prod)
│   ├── config.ts                    # ALL server constants; validates Secrets; MODERATION_SYSTEM_PROMPT
│   ├── db.ts                        # Neon Pool + drizzle({ client, schema })
│   ├── storage.ts                   # IStorage interface + DatabaseStorage + `storage` singleton
│   ├── replitAuth.ts                # getSession(), setupAuth(app), isAuthenticated (OIDC)
│   ├── seed.ts                      # Idempotent seeder: exports seedDatabase() + clearDatabase()
│   ├── types/
│   │   └── index.ts                 # Server-only types (AuthenticatedRequest, SocketUser, etc.)
│   ├── routes/
│   │   ├── index.ts                 # registerRoutes(app): mounts all routers, returns http.Server
│   │   ├── auth.ts                  # GET /api/auth/user (uses isAuthenticated)
│   │   ├── match.ts                 # POST /api/match/join, DELETE /api/match/leave
│   │   ├── chat.ts                  # GET /api/chat/:sessionId/history
│   │   ├── points.ts                # GET /api/points, POST /api/points/gift
│   │   ├── marketplace.ts           # GET /api/marketplace, POST /api/redeem, POST /api/stripe/webhook
│   │   ├── sponsors.ts              # GET /api/sponsors, POST /api/ad-impressions, admin CRUD
│   │   └── admin.ts                 # GET /api/admin/moderation-logs, point-rate + inventory mgmt
│   ├── services/
│   │   ├── moderation.ts            # Claude API; screenMessage(); logs to moderationLogs
│   │   ├── matchmaking.ts           # Anonymous pairing algorithm
│   │   └── points.ts                # Gift point drop lottery + gifting rules
│   ├── middleware/
│   │   ├── requireEdu.ts            # .edu enforcement (after isAuthenticated)
│   │   └── rateLimit.ts             # Per-user rate limits on chat + redeem
│   └── websocket/
│       └── chatSocket.ts            # Socket.io server: join/leave/message events
│
└── docs/
    ├── SETUP.md                     # ≤15-min Replit setup guide
    ├── LLM_GUIDE.md                 # How to prompt Claude/Replit Agent to extend this scaffold
    └── PERSEUS.md                   # Perseus repo graph: nodes, edges, domain vocab
```

> **Note on types:** Drizzle table row types and `drizzle-zod` insert schemas in `shared/schema.ts` are
> the single source of truth (`export type User = typeof users.$inferSelect;` etc.). Client and server
> both import these from `@shared/schema`. Only genuinely client-only or server-only types live in
> `client/src` / `server/types` respectively (listed in the TYPES section below).

---

## ROOT CONFIG FILES (exact Replit standard)

### `tsconfig.json`
```jsonc
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "dist"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

### `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import path from 'path';

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
```

### `drizzle.config.ts`
```typescript
import { defineConfig } from 'drizzle-kit';
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set — provision PostgreSQL from the Replit Tools pane.');
}
export default defineConfig({
  out: './migrations',
  schema: './shared/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
});
```

### `package.json` (scripts must be exactly these)
```jsonc
{
  "name": "buddy",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "db:push": "drizzle-kit push",
    "check": "tsc"
  }
}
```
List all runtime + dev dependencies with realistic versions matching the STACK table.

### `.replit`
```toml
modules = ["nodejs-20", "web", "postgresql-16"]
run = "npm run dev"
hidden = [".config", ".git", "node_modules", "dist"]

[nix]
channel = "stable-24_05"

[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[[ports]]
localPort = 5000
externalPort = 80
```

### `server/index.ts` (single-port pattern — non-negotiable)
The server must, in order: create the Express app, mount `express.json()` (with a raw-body branch for
`/api/stripe/webhook`), attach `getSession()`, `await setupAuth(app)`, call
`const server = await registerRoutes(app)` (which also attaches Socket.io to the same `http.Server`),
add a JSON error handler, then **in development** call `await setupVite(app, server)` and **in
production** call `serveStatic(app)`. Finally:
```typescript
const port = parseInt(process.env.PORT || '5000', 10);
server.listen({ port, host: '0.0.0.0', reusePort: true }, () => {
  console.log(`[buddy] serving on http://0.0.0.0:${port}`);
});
```

---

## DATABASE SCHEMA (`shared/schema.ts`)

Design a PostgreSQL schema using Drizzle ORM. All tables must:
- Choose `varchar` PK for auth-derived ids (`users.id` = OIDC `sub`) and `serial`/`uuid` elsewhere
  (document the choice per table in a comment).
- Include `createdAt` and (where mutated) `updatedAt` via `timestamp().defaultNow()`.
- Carry inline JSDoc on every column and a `// HOW TO EXTEND:` block after each table.
- Be exported as named exports, **plus** export inferred types
  (`export type X = typeof xTable.$inferSelect;`) and `drizzle-zod` insert schemas
  (`export const insertXSchema = createInsertSchema(xTable).omit({ id: true, createdAt: true });`).

Top-of-file comment block:
```
// ── CONCEPT: Buddy — Anonymous conversations; meet your kind of person ─────
// HOW THE POINT ECONOMY WORKS:
//   1. During a chat, the server randomly drops a GiftPoint (rate in server/config.ts)
//   2. earner = the user who triggered the drop; recipient = their match (the only spender)
//   3. The recipient sees their spendable balance on the Marketplace
//   4. Redemption creates a Stripe PaymentIntent; sponsor ad revenue covers the cost
// ─────────────────────────────────────────────────────────────────────────────
```

### Required tables (Replit Auth tables are mandatory and come first)

```
sessions            — REQUIRED by Replit Auth. Columns: sid varchar PK, sess jsonb,
                      expire timestamp. Add `index('IDX_session_expire').on(expire)`.
                      // Do not edit — Replit Auth/connect-pg-simple owns this table.

users               — Replit Auth user. id varchar PK (OIDC sub), email varchar unique,
                      firstName, lastName, profileImageUrl, plus Buddy fields: username,
                      anonymousAlias, onboardingComplete bool, totalPointsReceived int,
                      isAdmin bool. createdAt/updatedAt.

matchSessions       — One anonymous pairing of two users. userAId, userBId, status
                      ('waiting'|'active'|'ended'), startedAt, endedAt, bothConsented bool
                      (after a moderation nudge).

messages            — Chat messages within a session. sessionId, senderId, content (text),
                      moderationChecked bool, verdict ('pending'|'clean'|'flagged'|'nudgeSent').

giftPoints          — Ledger; one row per drop. earnerId (cannot spend), recipientId (can spend),
                      matchSessionId, points int, spent bool.

moderationLogs      — Audit of every Claude call. messageExcerpt (truncated, no PII), verdict,
                      guidelineTriggered, nudgeSent bool, sessionId.

marketplaceItems    — Gift-card listings. merchantName, pointCost int, faceValueUsd numeric,
                      inventoryCount int, active bool.

redemptions         — A user spending points on an item. userId, itemId, pointsSpent,
                      stripePaymentIntentId, status ('pending'|'fulfilled'|'failed').

sponsors            — Wallpaper sponsors. companyName, logoUrl, cpmRateUsd numeric,
                      campaignStart, campaignEnd, impressionCount int, active bool.

adImpressions       — One row per wallpaper render. sponsorId, userId, sessionId.

_meta               — Seed bookkeeping. key varchar PK, value text. Used by seedDatabase()
                      to store key='seeded'.
```

After the schema, include a **"Recommended indexes"** comment block with the exact SQL to paste into
the Replit Database query console for frequently queried columns (e.g. `messages.sessionId`,
`giftPoints.recipientId`, `matchSessions.status`, `adImpressions.sponsorId`).

---

## AI MODERATION SERVICE (`server/services/moderation.ts`)

Implement `screenMessage()` (async, named export):
1. Signature: `screenMessage(input: ScreenMessageInput): Promise<ModerationVerdict>` where
   `ScreenMessageInput = { content: string; sessionId: string; userId: string }`.
2. Calls Claude via `@anthropic-ai/sdk`:
   ```typescript
   const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
   const res = await anthropic.messages.create({
     model: CONFIG.CLAUDE_MODEL,            // 'claude-sonnet-4-6' from server/config.ts
     max_tokens: 512,
     system: MODERATION_SYSTEM_PROMPT,       // named const in server/config.ts
     tools: [RECORD_VERDICT_TOOL],           // forced structured output (see below)
     tool_choice: { type: 'tool', name: 'record_verdict' },
     messages: [{ role: 'user', content: input.content }],
   });
   ```
   Use a **forced tool call** for reliable structured output instead of parsing free-text JSON.
   `RECORD_VERDICT_TOOL` (defined in `server/config.ts`) has an `input_schema` producing:
   `{ verdict: 'clean' | 'flagged', guidelineTriggered: string | null, nudgeMessage: string | null }`.
   Read the verdict from the tool-use block in the response.
3. Returns the `ModerationVerdict` type.
4. The system prompt instructs Claude to flag: personal identifiers (real name, phone, email, social
   handle, school name), sexual content, harassment, self-harm references; and to compose a gentle,
   non-accusatory `nudgeMessage` to **both** users naming the specific guideline when flagged.
5. Logs **every** call to `moderationLogs` via `storage` regardless of verdict (excerpt truncated,
   PII stripped).
6. Wrapped in try/catch: if Claude is unreachable, return `{ verdict: 'clean', guidelineTriggered: null,
   nudgeMessage: null }` with a `console.warn` — **never block chat on a failed moderation call.**
7. `// DAY-OF CHANGE` comment on `MODERATION_SYSTEM_PROMPT` and on `CONFIG.CLAUDE_MODEL`.
8. `// HOW TO EXTEND:` comment for adding new guideline categories (extend the system prompt + the
   tool's enum/description).

`MODERATION_SYSTEM_PROMPT` and `RECORD_VERDICT_TOOL` are **named constants in `server/config.ts`**, not
inlined in the service.

---

## REAL-TIME CHAT (`server/websocket/chatSocket.ts`)

Attach Socket.io to the **same `http.Server`** returned by `registerRoutes` (do not open a second
port). Authenticate sockets by reading the Express session (share the session middleware with Socket.io
via `io.engine.use(getSession())`, then read the passport user off `socket.request`).

| Client → server | Payload | Description |
|---|---|---|
| `chat:join` | `{ sessionId }` | Join a chat room |
| `chat:message` | `{ sessionId, content }` | Send a message |
| `chat:leave` | `{ sessionId }` | Leave gracefully |

| Server → client | Payload | Description |
|---|---|---|
| `chat:message` | `{ message: Message }` | Broadcast new message |
| `chat:nudge` | `{ nudge: ModerationNudge }` | Claude moderation nudge to both users |
| `chat:pointDrop` | `{ earner, recipient, points }` | Announce a random point drop |
| `chat:userLeft` | `{ userId }` | Match disconnected |

Flow for `chat:message`:
1. Resolve the socket's authenticated user; reject if absent.
2. Persist the message via `storage` with `verdict: 'pending'`.
3. Call `screenMessage()` — **do not await before broadcasting** (optimistic broadcast).
4. Broadcast `chat:message` to the room immediately.
5. When the verdict resolves: if `'flagged'`, emit `chat:nudge` to both sockets and update the message
   row's verdict via `storage`.
6. After broadcast, run the point-drop lottery (`CONFIG.POINT_DROP_RATE` from `server/config.ts`).
7. If it drops, insert a `giftPoints` row via `storage` and emit `chat:pointDrop`.

---

## SPONSORED WALLPAPER (`client/src/components/SponsoredWallpaper.tsx`)

Buddy's primary ad unit and revenue source:
- Fixed background layer behind the chat message list.
- Fetches active sponsors via TanStack Query: `useQuery({ queryKey: ['/api/sponsors'] })`.
- Tiles sponsor logos in a repeating grid (absolute-positioned grid of `<AdBanner />` tiles).
- Each `<AdBanner />` shows logo + company name as a pill/badge, visually secondary to chat.
- On mount, fires `POST /api/ad-impressions` for each visible sponsor tile (CPM logging) via an
  `apiRequest` mutation.
- `// DAY-OF CHANGE` on the tile-grid density constant.
- Logos use `object-fit: contain` and soft opacity (`AD_WALLPAPER_OPACITY = 0.35`, `// DAY-OF CHANGE`).

---

## SPRITES & ANIMATIONS (`client/src/assets/`)

All UI art comes from **55 pre-segmented transparent PNGs** (already sliced from the sprite sheet — see
`BUDDY_SPRITES.md` for the full named catalogue + the source-of-truth animation list). Vite imports them
so they ship content-hashed; there is **no runtime sprite-sheet slicing**.

### Asset manifest — `client/src/assets/sprites.ts`
- Import every PNG and export a typed `SPRITES` record (sprite name → imported URL):
  ```typescript
  import buddy_smirk from './sprites/buddy_smirk.png';
  // …one import per file…
  export const SPRITES = { buddy_smirk, /* … all 55 … */ } as const;
  export type SpriteName = keyof typeof SPRITES;
  ```
- Export the named animation manifest (frames reference `SpriteName`):
  ```typescript
  export interface SpriteAnimation {
    frames: SpriteName[];                 // 1+ frames; single frame = CSS-only motion
    intervalMs: number;                   // ms per frame for the flipbook
    loop: 'loop' | 'once' | 'pingpong';
    motion?: 'breathe' | 'bob' | 'wave' | 'pop' | 'spin' | 'none';  // CSS transform layered on top
    overlay?: SpriteName;                 // optional sprite composited above (e.g. point_burst)
  }
  export const SPRITE_ANIMATIONS = { /* exact entries from the table below */ } as const
    satisfies Record<string, SpriteAnimation>;
  export type AnimationName = keyof typeof SPRITE_ANIMATIONS;
  ```

### Components
- **`Sprite.tsx`** — `<Sprite name="buddy_smirk" size={96} />` renders `<img src={SPRITES[name]} … >`
  with width/height = `size`, `alt=''` by default (decorative). Named export `Sprite`.
- **`BuddyAnim.tsx`** — `<BuddyAnim animation="searching" size={120} onDone={...} />`. Reads
  `SPRITE_ANIMATIONS[animation]`, cycles `frames` every `intervalMs` honoring `loop`/`pingpong`
  (`useEffect` + interval), applies the `motion` CSS class, composites `overlay` above when present, and
  calls `onDone()` after one cycle when `loop: 'once'`. Must respect `prefers-reduced-motion` by showing
  only `frames[0]`. Named export `BuddyAnim`.

### CSS keyframes (`client/src/index.css`) — all gentle/calm per `BUDDY_BRAND_AESTHETIC.md` §6
- `.anim-breathe` scale 1→1.03→1, 3s ease-in-out infinite
- `.anim-bob` translateY 0→-6%→0, 2.4s ease-in-out infinite
- `.anim-wave` rotate -8°→8° (transform-origin bottom), 0.4s, 3 iterations
- `.anim-pop` scale 0.6→1.08→1, 0.35s ease-out
- `.anim-spin` rotate 360°, 1s linear infinite
- Wrap with `@media (prefers-reduced-motion: reduce) { [class^='anim-'] { animation: none !important } }`

### Animation manifest (build these exact entries; source of truth = `BUDDY_SPRITES.md`)
| `AnimationName` | frames | intervalMs | loop | motion / overlay | Used in |
|---|---|---|---|---|---|
| `buddy-idle` | buddy_smirk | 0 | loop | breathe | logo / headers |
| `buddy-wave` | buddy_grin, buddy_wave | 350 | once | wave | LandingPage greeting |
| `buddy-laugh` | buddy_happy, buddy_laugh | 250 | loop | none | reactions |
| `buddy-think` | buddy_think | 0 | loop | bob | thinking states |
| `buddy-sleepy` | buddy_sleepy | 0 | loop | bob (slow) | MatchWaitingPage idle |
| `buddy-shy` | buddy_shy | 0 | once | bob | OnboardingPage |
| `buddy-celebrate` | buddy_cheer, buddy_proud, buddy_love | 300 | once | pop / overlay point_burst | point drop, redeem success |
| `buddy-nudge` | buddy_gentle | 0 | once | pop / overlay shield_heart | ModerationNudge card |
| `searching` | search, search_dot, search_dots | 300 | loop | none | MatchWaitingPage |
| `spinner` | ring_1, ring_2, ring_3 | 150 | loop | spin | loading states |
| `online-pulse` | glow_1, glow_2 | 600 | pingpong | none | connected indicator |
| `typing` | chat_typing | 0 | loop | bob (subtle) | ChatWindow typing row |
| `point-pop` | point_coin | 0 | once | pop / overlay point_burst | PointsDisplay drop toast |
| `match-found` | match_linked | 0 | once | pop | MatchWaitingPage on pair |
| `send-whoosh` | send_plane | 0 | once | pop | ChatInput on send |
| `gear-sync` | gear, gear_sync | 200 | loop | spin | AdminPage while saving |

### Static sprites (no animation)
- **Avatars:** `MatchCard` + `ProfilePage` pick an `avatar_*` (mask, blob, fox, ghost, bag, hood, star,
  cloud) **deterministically from the anonymous alias** (hash the alias → index into the 8) so a given
  alias always maps to the same avatar.
- **Icons/nav:** `home`, `profile`, `store`, `gear`, `bell`, `lock_privacy`, `guidelines_book`,
  `chat_bubble`, `chat_convo`, `gift_card`, `coffee_cup`, `redeem_seal`, `gift_box`, `gift_hands`,
  `point_coin`, `point_stack`, `sparkle`, `shield_heart`.
- **App logo** = `buddy_smirk`.

### HOW TO EXTEND
- New sprite: drop the PNG into `client/src/assets/sprites/`, add one import + `SPRITES` entry — instantly
  usable as `<Sprite name="…" />`.
- New animation: add one `SPRITE_ANIMATIONS` entry referencing existing frame names; no component change.
- `// DAY-OF CHANGE`: tune `intervalMs` per animation to speed up / slow down a motion.

---

## SEED SCRIPT (`server/db/seed.ts` → actually `server/seed.ts`)

- Export `seedDatabase()` and `clearDatabase()` as named async functions; both go through `storage`.
- `seedDatabase()` is **idempotent**: check `_meta` for `key='seeded'` first; if present, log and return.
  On success, write `key='seeded'`.
- Insert realistic Buddy data (no lorem ipsum):
  - 12 users with `.edu` emails + playful, character-y aliases (`quiet_spark_42`, `bookworm_brave`, …)
  - 6 completed match sessions, each with 8–15 messages
  - 3 active match sessions (status `active`)
  - 40 gift-point records distributed across users
  - 8 marketplace items (e.g. "Amazon $5 Gift Card", "Spotify 1-Month Premium",
    "Starbucks $5 Gift Card", "Venmo $5")
  - 5 sponsors with realistic names, placeholder logo URLs, CPM rates
  - 3 completed redemptions
  - 20 moderation logs (mix of `clean` and `flagged`)
- Mark every seed block with `// DAY-OF CHANGE`.
- Log with timestamped labels: `[SEED 12:34:05] ✓ Inserted 12 users`.
- Make the file runnable standalone: at the bottom, detect direct execution
  (`import.meta.url === \`file://${process.argv[1]}\``) and call `seedDatabase()` so
  `tsx server/seed.ts` works in the Replit Shell.

---

## CONFIG FILES

### `client/src/config.ts`
Export a fully typed `CONFIG`:
- `APP_NAME: 'Buddy'`
- `TAGLINE: 'Meet your kind of person.'`
- `PRIMARY_COLOR`, `ACCENT_COLOR`, `BG_COLOR` — mirrored in `tailwind.config.ts` + `index.css` vars
- `FEATURE_FLAGS: { ENABLE_AUTH, ENABLE_MODERATION, ENABLE_ADS, ENABLE_MARKETPLACE }` — each boolean
  with a `// DAY-OF CHANGE`
- `POINT_DROP_RATE: 0.08` `// DAY-OF CHANGE: increase to make points more common` (client display only;
  the authoritative value lives server-side)
- `MAX_CHAT_DURATION_MINUTES: 30`
- `AD_WALLPAPER_OPACITY: 0.35`
- `CPM_RATE_USD: 2.50`
- `API_ROUTES` — object mapping logical names → `/api/...` paths (used by `apiRequest`)

### `server/config.ts`
- Validate every required secret at startup; throw one error listing all missing keys.
- Export `CLAUDE_MODEL = 'claude-sonnet-4-6'` `// DAY-OF CHANGE: pin a dated snapshot if needed`.
- Export `MODERATION_SYSTEM_PROMPT` (named const, `// DAY-OF CHANGE`).
- Export `RECORD_VERDICT_TOOL` (the Anthropic tool definition for structured verdicts).
- Export `POINT_DROP_RATE = 0.08`, `MAX_MESSAGES_PER_SESSION`, and
  `EDU_DOMAIN_ALLOWLIST = ['.edu']` `// DAY-OF CHANGE: add partner school domains`.

---

## SETUP GUIDE (`docs/SETUP.md`)

Numbered steps a team with moderate TypeScript experience can finish in under 15 minutes on Replit:

1. Open this Repl (Fork if shared).
2. Enable **Replit Auth** from the **Tools** pane — auto-injects `REPL_ID`, `REPLIT_DOMAINS`,
   `ISSUER_URL`, `SESSION_SECRET`.
3. Provision **PostgreSQL** from the **Tools** pane — auto-injects `DATABASE_URL`.
4. In **Secrets** (padlock), add `ANTHROPIC_API_KEY` and `STRIPE_SECRET_KEY` (and optionally
   `STRIPE_WEBHOOK_SECRET`).
5. In the **Shell**: `npm install`.
6. `npm run db:push` to create all tables (answer "create" for any prompts).
7. Seed sample data: `tsx server/seed.ts`.
8. Press **Run** — Express starts on port 5000 with Vite in middleware mode.
9. Open the **Webview**; sign in with a `.edu` email.
10. To deploy: open the **Deploy** pane → Autoscale → Deploy (build/run come from `.replit`).

**Day-of Adjustments** section — list every `CONFIG` key, what it controls, and the change for the 5
most common scenarios:
- "Make points rain" → `POINT_DROP_RATE` (server/config.ts)
- "Add a new school domain" → `EDU_DOMAIN_ALLOWLIST`
- "Tighten moderation" → `MODERATION_SYSTEM_PROMPT`
- "Change wallpaper opacity" → `AD_WALLPAPER_OPACITY`
- "Add a marketplace item" → re-seed or Admin UI

**Troubleshooting** section — top 5 likely errors with exact messages, causes, fixes:
- `DATABASE_URL must be set` → PostgreSQL not provisioned (step 3).
- `REPLIT_DOMAINS not provided` → Replit Auth not enabled (step 2).
- 401 on `/api/auth/user` → not signed in / session cookie blocked (must be `secure` over HTTPS Webview).
- `EDU_REQUIRED` 403 → signed in with a non-`.edu` email; add the domain to `EDU_DOMAIN_ALLOWLIST`.
- Blank page / Vite error overlay → run `npm run db:push` and restart; check the Console tab.

---

## LLM GUIDE (`docs/LLM_GUIDE.md`)

Plain-English guide to extending the scaffold with Claude / Replit Agent. Include:
- A "which file to paste for which change" map, e.g.:
  - moderation changes → `server/services/moderation.ts` + `server/config.ts`
  - schema changes → `shared/schema.ts` + `server/storage.ts` (then `npm run db:push`)
  - new API route → `server/routes/<name>.ts` + register in `server/routes/index.ts`
- 5 example prompts:
  1. "Add a new community-guideline category to the moderation system"
  2. "Add a leaderboard page showing top gift-givers this week"
  3. "Make the chat wallpaper animate sponsor logos"
  4. "Add a new marketplace item type: experience vouchers"
  5. "Add a real-time typing indicator to the chat"
- Reminders: constants → `config.ts`; DB tables + shared types → `shared/schema.ts`; all DB access →
  `server/storage.ts`; design tokens → `tailwind.config.ts` + `index.css`.
- Note: "Always paste `shared/domain-vocab.ts` when asking about anything touching multiple files — it
  gives Claude the full concept map without pasting every file."

---

## PERSEUS GUIDE (`docs/PERSEUS.md`)

### Setup
1. `npx perseus init` in the repo root
2. `npx perseus index` to build the initial graph
3. Re-index incrementally after adding files: `npx perseus index --incremental`

### Repo Graph Overview (ASCII)
```
[Replit Auth/OIDC] ─► [users] ─► [matchSessions] ─► [messages]
                          │             │                │
                     [giftPoints]   [sessions]    [moderationLogs]
                          │
                  [marketplaceItems] ─► [redemptions] ─► [Stripe]
[sponsors] ─► [adImpressions] ─► [matchSessions]
```

### Node Catalogue
For every domain concept: concept name, primary file, key exports, connected nodes.

### Recommended Queries (8)
e.g. "Show me everything involved in dropping a Gift Point", "Where does Claude get called?",
"What happens when a message is flagged?", "Trace a redemption from button click to Stripe",
"How does .edu enforcement work?", "Where is the Socket.io session authenticated?",
"Which file owns the sessions table?", "How do I add a new API route?"

### Day-of Tips
- "Add a route? Re-index with `npx perseus index --incremental` before asking your agent to modify it."
- "Paste `docs/PERSEUS.md` when your agent is confused about where a concept lives."

---

## TYPESCRIPT TYPES

**Shared (single source — `shared/schema.ts`):** export Drizzle-inferred row types and `drizzle-zod`
insert schemas/types for every table:
`User, MatchSession, Message, GiftPoint, ModerationLog, MarketplaceItem, Redemption, Sponsor,
AdImpression` (+ `InsertUser`, `InsertMessage`, … from the insert schemas). Client and server import
these from `@shared/schema`.

**Client-only (`client/src/` — define near use or in a small `client/src/types.ts`):**
- `ChatUIMessage` — Message with optimistic-send state
- `PointDropEvent` — Socket.io payload
- `ModerationNudge` — in-chat nudge display state
- `ModerationVerdict` — mirror of the server verdict (or import from a shared type)

**Server-only (`server/types/index.ts`):**
- `AuthenticatedRequest` — Express `Request` with the authed user attached
- `ScreenMessageInput` — input to the moderation service
- `SocketUser` — Socket.io socket with user attached
- `ModerationVerdict` — `{ verdict: 'clean' | 'flagged'; guidelineTriggered: string | null;
  nudgeMessage: string | null }`

No inline type definitions in component or route bodies — import from the locations above.

---

## OUTPUT FORMAT

- Generate the files **directly into the Repl's filesystem** at the paths above (Replit Agent writes
  files in place — do **not** return a ZIP; a ZIP cannot run on Replit).
- Every file complete and immediately runnable — no placeholder TODOs, no `// implement this`, no
  truncation. If a file is long, include it in full.
- 2-space indentation, single quotes in TypeScript, trailing commas.
- **Art is already segmented** — copy the 55 PNGs from `sprites/` into `client/src/assets/sprites/` and
  build `sprites.ts` + `Sprite.tsx` + `BuddyAnim.tsx` per the "SPRITES & ANIMATIONS" section. Names and
  the animation manifest are fixed by `BUDDY_SPRITES.md`. Do **not** re-slice or regenerate art.
- All user-facing copy follows `BUDDY_BRAND_AESTHETIC.md` (tagline *"Meet your kind of person."*, warm &
  low-key voice, banned vocabulary). Never surface the "social skills / confidence" framing.
- Every `.ts`/`.tsx` file opens with the Perseus Graph Node header block.
- After enabling Replit Auth + PostgreSQL and adding `ANTHROPIC_API_KEY` + `STRIPE_SECRET_KEY`, the
  project must start cleanly with `npm install`, `npm run db:push`, then **Run** — **zero manual code
  edits.**
