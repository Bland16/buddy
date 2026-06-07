# Buddy — Extending the Scaffold with Claude / Replit Agent

Buddy is structured so an AI agent can change it safely without re-reading the whole repo. This is the
map of *which file to paste for which change*.

> **Always paste `shared/domain-vocab.ts`** when your change touches more than one file — it’s the full
> concept map (term → definition → files) without pasting every file.

---

## Which file for which change

| You want to… | Paste / edit | Then |
|---|---|---|
| Change what moderation flags or how a nudge reads | `server/services/moderation.ts` + `server/config.ts` | restart |
| Add/alter a DB table or column | `shared/schema.ts` + `server/storage.ts` | `npm run db:push` |
| Add a new API route | new `server/routes/<name>.ts` + register in `server/routes/index.ts` | restart |
| Change point economy (rate, rules) | `server/services/points.ts` + `server/config.ts` | restart |
| Tune copy / colors / flags (client) | `client/src/config.ts` (+ `tailwind.config.ts` / `client/src/index.css` for tokens) | hot-reloads |
| Add a sprite or animation | drop PNG in `client/src/assets/sprites/` + `client/src/assets/sprites.ts` | hot-reloads |
| Add a page | `client/src/pages/<Name>.tsx` (default export) + a `<Route>` in `client/src/App.tsx` | hot-reloads |

**Golden rules**
- Constants → `config.ts` (server or client), never inline.
- DB tables + shared types → `shared/schema.ts` (single source of truth).
- All DB access → `server/storage.ts` (`IStorage`), never raw `db` in a route.
- Design tokens → `tailwind.config.ts` + `client/src/index.css` (keep them in sync).
- All user-facing copy follows `BUDDY_BRAND_AESTHETIC.md` (warm & low-key; banned words: practice,
  confidence, skills, shy, awkward, introvert, community, safe space, …).

---

## 5 example prompts

1. **Add a new community-guideline category to moderation**
   > “In `server/config.ts`, add a ‘spam/scam links’ category to `MODERATION_SYSTEM_PROMPT` and mention
   > it in the `guidelineTriggered` description of `RECORD_VERDICT_TOOL`. Don’t change
   > `server/services/moderation.ts` — it just forwards the verdict.”

2. **Add a leaderboard page of top gift-givers this week**
   > “Add `getTopGiftGivers(sinceDays)` to `IStorage` + `DatabaseStorage` in `server/storage.ts`, a
   > `GET /api/leaderboard` route registered in `server/routes/index.ts`, and a
   > `client/src/pages/LeaderboardPage.tsx` with a `<Route>` in `App.tsx`. Frame it as ‘who’s been
   > generous’, not a competitive score.”

3. **Make the chat wallpaper animate sponsor logos**
   > “In `client/src/components/SponsoredWallpaper.tsx`, add a gentle drift to the tiles using a new
   > keyframe in `client/src/index.css`. Respect `prefers-reduced-motion`.”

4. **Add a new marketplace item type: experience vouchers**
   > “Add a `category` column to `marketplaceItems` in `shared/schema.ts` (run `db:push`), surface it in
   > `client/src/components/MarketplaceItem.tsx`, and filter by category on `MarketplacePage.tsx`.”

5. **Add a real-time typing indicator**
   > “Add a `chat:typing` event in `server/websocket/chatSocket.ts`, emit it from
   > `client/src/components/ChatInput.tsx` (debounced), and drive `partnerTyping` in
   > `client/src/hooks/useChat.ts` → `ChatWindow` already renders the typing row.”
