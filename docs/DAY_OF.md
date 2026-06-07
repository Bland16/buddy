# Buddy — Day-Of Runbook

Keep this open during the hackathon. Every knob below maps to a real `// DAY-OF CHANGE` marker in the
code. **After any server-side change: Stop → Run** (server constants are read at boot). Client copy/color
changes hot-reload.

---

## 0 · Pre-demo checklist (do once, before doors open)

- [ ] Replit imported from `Bland16/buddy`
- [ ] **Auth** enabled + **PostgreSQL** provisioned (Tools pane)
- [ ] `ANTHROPIC_API_KEY` + `STRIPE_SECRET_KEY` added in **Secrets**
- [ ] `npm install` → `npm run db:push` → `npm run db:seed` → **Run**
- [ ] Signed in once with your `.edu`, then made yourself admin:
      ```
      psql $DATABASE_URL -c "UPDATE users SET is_admin=true WHERE email='you@school.edu';"
      ```
- [ ] Opened a second browser / incognito with a **second** `.edu` account (to demo a live 2-person chat)
- [ ] **Deploy → Autoscale** for a stable public URL — don't demo off the dev Webview

---

## 1 · The knobs (file → constant → what it does)

| Want to… | File | Change | Effect |
|---|---|---|---|
| **Make points rain** (demo gold) | `server/config.ts` | `POINT_DROP_RATE` `0.08 → 0.4` | points drop ~every other message |
| Bigger point drops | `server/services/points.ts` | `POINTS_PER_DROP` `1 → 5` | 5 points per drop |
| Add your school / partner schools | `server/config.ts` | `EDU_DOMAIN_ALLOWLIST` e.g. `['.edu', 'gmail.com']` | lets more emails in (demo without a real .edu) |
| Loosen / tighten moderation | `server/config.ts` | `MODERATION_SYSTEM_PROMPT` | what Claude flags + nudge tone |
| Pin a Claude version | `server/config.ts` | `CLAUDE_MODEL` | swap to a dated snapshot |
| Turn a feature off mid-demo | `client/src/config.ts` | `FEATURE_FLAGS.ENABLE_ADS / _MARKETPLACE / _MODERATION` | hides that surface, hot-reloads |
| Stronger / softer ad wallpaper | `client/src/config.ts` | `AD_WALLPAPER_OPACITY` `0.35` | logo visibility behind chat |
| More / fewer wallpaper tiles | `client/src/components/SponsoredWallpaper.tsx` | `TILE_DENSITY` `24` | tile count |
| Point-drop toast lingers longer | `client/src/components/PointsDisplay.tsx` | `TOAST_MS` `2600` | celebration dwell time |
| Reword anything on screen | `client/src/config.ts` | `COPY` block | all headlines / CTAs / empty states |
| Rebrand color | `tailwind.config.ts` **and** `client/src/index.css` `--mint` | mint hex | primary color (keep both in sync) |
| Speed up / slow a Buddy animation | `client/src/assets/sprites.ts` | `intervalMs` per animation | flipbook speed |

---

## 2 · Live scenarios → exact move

- **"Points aren't dropping"** → `POINT_DROP_RATE = 0.5` in `server/config.ts`, restart. It's random; a
  high rate guarantees drops on stage.
- **"I don't have two .edu emails"** → add your everyday domain to `EDU_DOMAIN_ALLOWLIST`, restart.
- **"Moderation didn't trigger"** → confirm `ANTHROPIC_API_KEY` is set (without it, moderation no-ops and
  treats everything as clean). To force the nudge, type an obvious identifier like `dm me @myhandle`.
- **"Marketplace is empty"** → `npm run db:seed` (idempotent).
- **"Re-seed fresh"** → in the Shell:
  ```
  tsx -e "import('./server/seed.ts').then(m=>m.clearDatabase())"
  npm run db:seed
  ```
- **"Redeem does nothing / errors"** → with no `STRIPE_SECRET_KEY`, redeems auto-fulfill (intended for
  demos). With a key but no webhook, the redemption stays `pending` — fine to show.
- **"Show the admin tools"** → sign in as your admin account → gear icon in the nav → Sponsors /
  Moderation / Inventory / Settings tabs.

---

## 3 · 30-second troubleshooting

| Symptom | Fix |
|---|---|
| `DATABASE_URL must be set` | PostgreSQL not provisioned → Tools pane |
| `Missing required Secrets: REPLIT_DOMAINS…` | Auth not enabled → Tools pane |
| `401` on `/api/auth/user` | not signed in / demoing off raw Webview instead of the HTTPS deploy URL |
| `EDU_REQUIRED` 403 | email not allowlisted → add to `EDU_DOMAIN_ALLOWLIST` |
| blank page / Vite overlay | `npm run db:push`, then Stop → Run |
| chat won't connect | hard-refresh; the socket shares the login cookie — you must be signed in |

---

## 4 · The 90-second demo script

1. Landing → **Start talking** (sign in).
2. Onboarding → pick an alias + a vibe → **All set**.
3. Home → **Start talking**; second account joins → **live chat**.
4. Type a fake `@handle` → **moderation nudge** pops to both → **All good**.
5. Keep chatting → **gift point drops** (the twist: *your* point is for *them* to spend, not you).
6. Switch to the recipient → **Marketplace** → **Redeem** a $5 card → celebration.
7. Admin account → gear → **Moderation logs** + **Sponsors** (the revenue story: tiled wallpaper ad CPM
   funds the gift cards).

---

> The condensed version of this (Day-of Adjustments + Troubleshooting) also lives in `docs/SETUP.md`.
