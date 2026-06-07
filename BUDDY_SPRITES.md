# BUDDY — Sprite Catalogue & Animation Manifest

> Source of truth for **segmented sprite names** and **animations**. The art was sliced from
> `sprite_sheet.png` into 55 transparent PNGs in `sprites/`. For the app, copy `sprites/` →
> `client/src/assets/sprites/` and build the manifest per `BUDDY_SCAFFOLD_PROMPT.md` → "SPRITES &
> ANIMATIONS". (Art generation lives in `BUDDY_SPRITE_SHEET_PROMPT.md` — not changed here.)

## Segmentation summary
- Source grid: **7 rows × 8 columns = 56 cells** (the generator added a 7th system/decorative row).
- **55 usable sprites** exported with transparent backgrounds (white keyed out via border flood-fill, so
  interior whites like eyes are preserved). The sparkle in r7c8 was keyed from black.
- **1 skipped:** `r7c7` was a blank/black filler cell — not exported.
- Files: `sprites/<name>.png` (+ `sprites/_manifest.json` with exact source boxes).

---

## Naming catalogue

### Mascot — `buddy_*` (row 1–2) — the brand, identical wink+smirk, only mood changes
| Name | Cell | What it is |
|---|---|---|
| `buddy_smirk` | r1c1 | Signature wink + smirk — **the app logo** |
| `buddy_grin` | r1c2 | Big open happy grin |
| `buddy_wave` | r1c3 | Waving hello (one hand up) |
| `buddy_wink` | r1c4 | One-eye wink |
| `buddy_shy` | r1c5 | Bashful, glancing aside, hand up |
| `buddy_think` | r1c6 | Thinking, eyes glancing up |
| `buddy_thumbs_up` | r1c7 | Encouraging thumbs up |
| `buddy_laugh` | r1c8 | Eyes-closed laugh |
| `buddy_happy` | r2c1 | Content eyes-closed smile |
| `buddy_gentle` | r2c2 | Soft, caring look — used for the moderation nudge |
| `buddy_sleepy` | r2c3 | Sleepy with "z z z" — matchmaking wait |
| `buddy_surprised` | r2c4 | Small round "o" mouth |
| `buddy_love` | r2c5 | Affectionate, little hearts |
| `buddy_proud` | r2c6 | Confident, sparkle |
| `buddy_cheer` | r2c7 | Both hands raised, celebrating |
| `buddy_shush` | r2c8 | Reassuring finger gesture |

### Anonymous avatars — `avatar_*` (row 3) — identity-hiding, one per green tint
| Name | Cell | | Name | Cell |
|---|---|---|---|---|
| `avatar_mask` | r3c1 | | `avatar_bag` | r3c5 |
| `avatar_blob` | r3c2 | | `avatar_hood` | r3c6 |
| `avatar_fox` | r3c3 | | `avatar_star` | r3c7 |
| `avatar_ghost` | r3c4 | | `avatar_cloud` | r3c8 |

### Points · gifting · marketplace (row 4)
| Name | Cell | What it is |
|---|---|---|
| `point_coin` | r4c1 | Single Gift Point coin |
| `point_stack` | r4c2 | Stack of coins |
| `gift_box` | r4c3 | Wrapped gift box |
| `point_burst` | r4c4 | Sparkle/point-drop burst (overlay) |
| `gift_hands` | r4c5 | Open hands offering a gift |
| `gift_card` | r4c6 | Gift card |
| `coffee_cup` | r4c7 | Coffee cup (gift-card category) |
| `redeem_seal` | r4c8 | Redemption rosette + checkmark |

### Chat · safety (row 5)
| Name | Cell | What it is |
|---|---|---|
| `chat_bubble` | r5c1 | Single chat bubble |
| `chat_convo` | r5c2 | Two overlapping bubbles |
| `chat_typing` | r5c3 | Typing indicator (3 dots) |
| `send_plane` | r5c4 | Paper-plane send |
| `shield_heart` | r5c5 | Safety shield + heart (overlay for nudge) |
| `guidelines_book` | r5c6 | Open book / checklist |
| `lock_privacy` | r5c7 | Padlock — anonymity |
| `bell` | r5c8 | Notification bell |

### Status · navigation · system (rows 6–7)
| Name | Cell | What it is |
|---|---|---|
| `search_dots` | r6c1 | Magnifier over dots (search frame 3) |
| `search_dot` | r6c2 | Magnifier + dot (search frame 2) |
| `search` | r6c3 | Plain magnifier (search frame 1) |
| `match_linked` | r6c4 | Two shapes linked — match found |
| `ring_1` | r6c5 | Progress ring (spinner frame 1) |
| `ring_2` | r6c6 | Progress ring (spinner frame 2) |
| `ring_3` | r6c7 | Progress ring (spinner frame 3) |
| `home` | r6c8 | Home icon |
| `profile` | r7c1 | Profile / person |
| `store` | r7c2 | Storefront (marketplace) |
| `gear` | r7c3 | Settings gear (idle) |
| `gear_sync` | r7c4 | Gear with rotation arrows (syncing) |
| `glow_1` | r7c5 | Online pulse (small) |
| `glow_2` | r7c6 | Online pulse (large) |
| `sparkle` | r7c8 | Mint sparkle (keyed from black) |
| _(skipped)_ | r7c7 | Blank/black filler — not exported |

---

## Animation manifest

Built from the named sprites above. `intervalMs: 0` = single-frame (motion comes from the CSS class).
This table is the source of truth; `client/src/assets/sprites.ts → SPRITE_ANIMATIONS` mirrors it, and
`<BuddyAnim animation="…" />` plays it. Motion classes + `prefers-reduced-motion` handling are defined in
`client/src/index.css` (see scaffold "SPRITES & ANIMATIONS").

| Animation | Frames | intervalMs | loop | motion / overlay | Used in |
|---|---|---|---|---|---|
| `buddy-idle` | buddy_smirk | 0 | loop | breathe | logo / headers |
| `buddy-wave` | buddy_grin, buddy_wave | 350 | once | wave | LandingPage greeting |
| `buddy-laugh` | buddy_happy, buddy_laugh | 250 | loop | none | reactions |
| `buddy-think` | buddy_think | 0 | loop | bob | thinking states |
| `buddy-sleepy` | buddy_sleepy | 0 | loop | bob (slow) | MatchWaitingPage idle |
| `buddy-shy` | buddy_shy | 0 | once | bob | OnboardingPage |
| `buddy-celebrate` | buddy_cheer, buddy_proud, buddy_love | 300 | once | pop · overlay `point_burst` | point drop, redeem success |
| `buddy-nudge` | buddy_gentle | 0 | once | pop · overlay `shield_heart` | ModerationNudge card |
| `searching` | search, search_dot, search_dots | 300 | loop | none | MatchWaitingPage |
| `spinner` | ring_1, ring_2, ring_3 | 150 | loop | spin | loading states |
| `online-pulse` | glow_1, glow_2 | 600 | pingpong | none | connected indicator |
| `typing` | chat_typing | 0 | loop | bob (subtle) | ChatWindow typing row |
| `point-pop` | point_coin | 0 | once | pop · overlay `point_burst` | PointsDisplay drop toast |
| `match-found` | match_linked | 0 | once | pop | MatchWaitingPage on pair |
| `send-whoosh` | send_plane | 0 | once | pop | ChatInput on send |
| `gear-sync` | gear, gear_sync | 200 | loop | spin | AdminPage while saving |

### Static (no animation)
- **Avatars** (`avatar_mask … avatar_cloud`): chosen deterministically from a user's anonymous alias
  (hash → index 0–7) so an alias always shows the same avatar.
- **App logo** = `buddy_smirk`.
- **Plain icons**: home, profile, store, gear, bell, lock_privacy, guidelines_book, chat_bubble,
  chat_convo, gift_card, coffee_cup, redeem_seal, gift_box, gift_hands, point_coin, point_stack,
  sparkle, shield_heart.

### HOW TO EXTEND
- New sprite → add PNG to `client/src/assets/sprites/` + one `SPRITES` entry. Usable immediately.
- New animation → add one row here and a matching `SPRITE_ANIMATIONS` entry (reuse existing frames).
- Speed tuning is just `intervalMs` (`// DAY-OF CHANGE`).
