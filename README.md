<div align="center">

# Buddy

### Meet your kind of person.

No names, no profiles, no pressure. Just talk to someone new — and find out who you actually click with.

</div>

---

## What it is

**Buddy** anonymously pairs two students for a low-stakes, text-only chat. There are no usernames to
judge, no photos to swipe — just a conversation. A quiet AI safety layer keeps things kind, and a playful
twist keeps it warm: while you chat, you randomly earn **gift points you can't spend yourself** — only the
person you're talking to can. Those points cash out for real gift cards in the Marketplace, funded by
sponsored wallpaper ads behind the chat.

> The whole experience stays here, low-stakes. Not dating, not networking, not a self-improvement app —
> just the quiet fun of noticing *"oh, I like talking to people like this."*

## The core loop

1. **Sign in** with a verified `.edu` email (Replit Auth OIDC; enforced server-side).
2. Get **anonymously matched** with someone for a text chat.
3. Every message is screened in real time by **Claude** — anything risky (personal info, harassment,
   etc.) triggers a gentle in-chat **nudge** to both people, never a "violation."
4. As you talk, **gift points drop** at random — earmarked for *your match* to spend, not you.
5. Your match redeems points in the **Marketplace** for real gift cards. **One sponsor at a time** owns
   the chat wallpaper (rotating), and that CPM ad revenue underwrites the gift cards.

## Built for the tracks

- **🟣 Anthropic / Claude** — real-time message moderation via `claude-sonnet-4-6` using a **forced tool
  call** for reliable structured verdicts. Fails open (never blocks chat) and logs every call for the
  admin audit. → `server/services/moderation.ts`, `server/config.ts`
- **🔷 Perseus** — the repo is built as a queryable knowledge graph: every file opens with a
  `PERSEUS GRAPH NODE` header, cross-domain imports carry `PERSEUS EDGE` labels, and
  `shared/domain-vocab.ts` maps every concept → its files. → `docs/PERSEUS.md`
- **🟧 Replit** — single-port fullstack-JS app: Express runs Vite in middleware mode (dev) and serves the
  built client (prod). Replit Auth + PostgreSQL + Autoscale deploy, zero manual code edits.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite, wouter, TanStack Query, Tailwind |
| Backend | Express + Node 20 (single process, single port 5000) |
| Realtime | Socket.io (shares the Express session for auth) |
| Database | PostgreSQL via Drizzle ORM (`db:push`, no migrations) |
| Auth | Replit Auth (OIDC) — with a local dev fake-login fallback |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Payments | Stripe (gift-card redemption) |

## Quick start

### On Replit (recommended)
1. **Import from GitHub** → this repo.
2. Tools pane → enable **Auth** and **PostgreSQL** (secrets auto-injected).
3. Secrets pane → add `ANTHROPIC_API_KEY` and `STRIPE_SECRET_KEY`.
4. Shell: `npm install && npm run db:push && npm run db:seed`, then press **Run**.

### Locally (dev fallback)
```bash
# needs Node 20+ and a Postgres database
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/buddy"
export SESSION_SECRET="any-long-random-string"
export ANTHROPIC_API_KEY="sk-ant-..."   # optional; without it moderation no-ops

npm install
npm run db:push
npm run db:seed
npm run dev   # http://localhost:5000 → "Start talking" signs you in as a dev user
```

Full guide: **[`docs/SETUP.md`](docs/SETUP.md)** · Day-of cheat sheet: **[`docs/DAY_OF.md`](docs/DAY_OF.md)**

## Project structure

```
shared/     schema.ts (single source of truth) + domain-vocab.ts
server/     Express entry, Replit Auth, storage (IStorage), routes,
            services (moderation · matchmaking · points), websocket chat
client/     React app — pages, components, hooks, 55 sprites + animations
docs/       SETUP · DAY_OF · LLM_GUIDE · PERSEUS
```

**Conventions:** all DB access goes through `server/storage.ts`; all tunables live in `config.ts`
(server + client) and are marked `// DAY-OF CHANGE`; all copy follows the warm, low-key brand voice in
`BUDDY_BRAND_AESTHETIC.md`.

## Extending it

See **[`docs/LLM_GUIDE.md`](docs/LLM_GUIDE.md)** for a "which file to paste for which change" map and
example prompts for Claude / Replit Agent.

---

<div align="center"><sub>Find out who you click with.</sub></div>
