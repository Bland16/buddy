# Buddy — Setup (≤15 minutes)

*Meet your kind of person.* This guide gets Buddy running on **Replit** (the primary target) and, at the
bottom, on your **local machine** (Windows/macOS/Linux) using the built-in dev fallback.

---

## A · Replit (zero manual code edits)

1. **Open this Repl** (Fork if it was shared with you).
2. **Enable Replit Auth** — Tools pane → *Auth*. This auto-injects `REPL_ID`, `REPLIT_DOMAINS`,
   `ISSUER_URL`, and `SESSION_SECRET` as Secrets.
3. **Provision PostgreSQL** — Tools pane → *PostgreSQL*. This auto-injects `DATABASE_URL`.
4. **Add app Secrets** — Secrets pane (padlock): add
   - `ANTHROPIC_API_KEY` (Claude moderation)
   - `STRIPE_SECRET_KEY` (gift-card redemption)
   - *(optional)* `STRIPE_WEBHOOK_SECRET`
5. **Install** — in the Shell: `npm install`
6. **Create tables** — `npm run db:push` (answer “create” to any prompts). This builds every table from
   `shared/schema.ts`, including the `sessions` table Replit Auth needs.
7. **Seed sample data** — `npm run db:seed` (or `tsx server/seed.ts`).
8. **Press Run** — Express starts on port 5000 with Vite in middleware mode (one port, no proxy).
9. **Open the Webview** and sign in with a `.edu` email.
10. **Deploy** — Deploy pane → *Autoscale* → Deploy. Build/run come from `.replit`.

> **Replit Multiplayer:** Tools → *Multiplayer* lets teammates edit the same Repl live — great for
> hackathon pair coding.

---

## B · Local machine (dev fallback)

The app detects it’s not on Replit (no `REPLIT_DOMAINS`) and enables a **dev fake-login** plus a plain
`node-postgres` driver, so it runs without Replit Auth/Neon.

1. Install Node 20+ and have a Postgres database (local Postgres, Docker, or a Neon URL).
2. Set env vars in your shell (see `.env.example`). Minimum:
   ```powershell
   $env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/buddy"
   $env:SESSION_SECRET = "any-long-random-string"
   # optional but recommended:
   $env:ANTHROPIC_API_KEY = "sk-ant-..."   # without it, moderation no-ops (treated clean)
   $env:DEV_USER_EMAIL = "demo@university.edu"
   ```
3. `npm install`
4. `npm run db:push`
5. `npm run db:seed`
6. `npm run dev` → open http://localhost:5000 and click **Start talking** to sign in as the dev user.

> The dev login signs you in as `DEV_USER_EMAIL` (must end in `.edu`). To make the dev user an admin,
> the seeded admin is `seed-user-1`; or set `isAdmin` on your dev user in the DB.

---

## Day-of Adjustments

| Scenario | Change | Where |
|---|---|---|
| “Make points rain” | `POINT_DROP_RATE` (e.g. 0.08 → 0.3) | `server/config.ts` |
| “Add a new school domain” | add to `EDU_DOMAIN_ALLOWLIST` | `server/config.ts` |
| “Tighten moderation” | edit `MODERATION_SYSTEM_PROMPT` | `server/config.ts` |
| “Change wallpaper opacity” | `AD_WALLPAPER_OPACITY` | `client/src/config.ts` |
| “Add a marketplace item” | Admin → Inventory, or re-seed | Admin UI / `server/seed.ts` |
| “Pin a Claude snapshot” | `CLAUDE_MODEL` | `server/config.ts` |

After changing a server constant, restart (Stop → Run).

---

## Troubleshooting

| Error / symptom | Cause | Fix |
|---|---|---|
| `DATABASE_URL must be set` | PostgreSQL not provisioned | Do step 3 (Replit) or set `DATABASE_URL` (local) |
| `Missing required Secrets: REPLIT_DOMAINS …` | Replit Auth not enabled | Do step 2 |
| `401` on `/api/auth/user` | Not signed in / cookie blocked | Sign in; on Replit the cookie is `secure` over the HTTPS Webview |
| `EDU_REQUIRED` 403 | Signed in with a non-`.edu` email | Add the domain to `EDU_DOMAIN_ALLOWLIST` |
| Blank page / Vite overlay | Tables not created | Run `npm run db:push`, restart, check the Console |
| Points never drop | Rate too low / unlucky | Raise `POINT_DROP_RATE` for the demo |
