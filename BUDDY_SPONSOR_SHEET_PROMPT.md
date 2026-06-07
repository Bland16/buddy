# BUDDY — Sponsor Banner Tiles · Sprite Sheet Prompt

> Generates the **tiled sponsor badges** that sit behind the chat (the `SponsoredWallpaper`). Companion
> to `BUDDY_SPRITE_SHEET_PROMPT.md` (mascot/icons). The roster is chosen so **every sponsor is also a
> realistic gift-card partner** — the same brands fund the marketplace, so "ad CPM pays for the gift
> cards" holds together.

---

## ⚠️ READ FIRST — logos, trademarks, and what this actually produces

- Real brand logos are **trademarked**. You may **not** ship AI-imitated logos in a live ad product.
- Image models also render real logos **inaccurately** (wrong glyphs, mangled wordmarks).
- So this prompt produces **stylized, on-brand "sponsor badge" tiles** — clean wordmark pills in Buddy's
  mint palette. They read as *intentional design*, look cohesive behind the chat, and are safe for a
  **demo / hackathon**.
- **For production:** replace each tile with the brand's **official logo** from its brand-assets / press
  kit, and only display brands you have a real partnership/ad deal with.

---

## AESTHETIC — same "Soft Mint Plaid" world (so tiles blend into the wallpaper)

The wallpaper renders at low opacity (`AD_WALLPAPER_OPACITY = 0.35`) behind chat bubbles, so tiles must be
**calm, flat, and monochrome-mint** — not loud full-color logos that fight the conversation.

**Palette (locked — green + white only):**
| Token | Hex | Use |
|---|---|---|
| White | `#FFFFFF` | pill surface |
| Canvas | `#F4FAF6` | pale pill fill |
| Mint mist | `#E4F5EA` | tint fills |
| Mint 400 | `#8FD3A6` | secondary marks |
| Green 500 | `#5FBF86` | brand accents |
| Green 700 | `#3E9B68` | wordmark text / icon |
| Pine ink | `#1F4A36` | small caption text |

- Each tile = a **soft rounded pill / lozenge** with a tiny simple emblem + the brand name as a clean
  wordmark. Matte, no gloss, consistent weight. Type = rounded geometric sans (Quicksand / Nunito).
- Emblems are **simplified, generic glyphs** (a cup, a play triangle, a cart) — NOT trademarked marks.

---

## THE PROMPT

> Paste into your image generator. If 24-in-one drifts, use **SPLIT INTO 3 SHEETS** at the bottom.

```
A single sprite sheet of 24 minimalist "sponsor badge" tiles for a calm mint-green app called Buddy.
Each tile is a soft, rounded pill/lozenge badge containing a tiny simple emblem and a clean wordmark
brand name in a rounded geometric sans (Quicksand/Nunito style). Premium mobile-app quality.

ART DIRECTION "Soft Mint Plaid": calm, flat vector, squishy rounded geometry, gentle soft inner shading.
No gloss, no hard drop shadows, no harsh outlines. MONOCHROMATIC mint-green + white palette ONLY — NO
coral, NO yellow, NO other brand colors:
  - White #FFFFFF, off-white #F4FAF6
  - Mint mist #E4F5EA, mint #8FD3A6
  - Mint primary #5FBF86, deep green #3E9B68
  - Pine-green ink #1F4A36
All wordmarks in deep green #3E9B68 on a pale mint pill; emblems in mint/deep green. Every tile the same
height, same padding, same style. These are STYLIZED generic badges, NOT real corporate logos — use a
simple original emblem for each, not any trademarked mark.

LAYOUT FOR SEGMENTATION (critical):
- One PNG, 2048 x 1152 px, FULLY TRANSPARENT background.
- A clean 4 columns x 6 rows grid = 24 tiles, each centered in a 512 x 192 px cell.
- Generous padding so NO tile touches its neighbors; clear transparent space between every tile.
- ABSOLUTELY NO grid lines, frames, borders, background color, captions outside the pills, numbers, or
  watermarks. No tile cropped at an edge. No shadow bleeding into adjacent cells.

TILES (left-to-right, top-to-bottom) — each is a pill with a tiny emblem + the wordmark:

Row 1 — Coffee & food:
1. "Starbucks" — emblem: a takeaway coffee cup
2. "Dunkin'" — emblem: a steaming cup
3. "Chipotle" — emblem: a rounded burrito/pepper
4. "DoorDash" — emblem: a little delivery bag

Row 2 — Food delivery & quick eats:
5. "Uber Eats" — emblem: a fork + leaf
6. "Panera" — emblem: a soft bread loaf
7. "Sweetgreen" — emblem: a salad bowl
8. "Domino's" — emblem: a pizza slice

Row 3 — Retail & tech:
9.  "Amazon" — emblem: a smiling parcel box
10. "Target" — emblem: concentric rings
11. "Apple" — emblem: a simple rounded fruit
12. "Best Buy" — emblem: a price tag

Row 4 — Lifestyle & beauty:
13. "Nike" — emblem: a soft swoosh-like curve
14. "Lululemon" — emblem: a rounded leaf
15. "Sephora" — emblem: a lipstick/wand
16. "Ulta" — emblem: a sparkle

Row 5 — Subscriptions & entertainment:
17. "Spotify" — emblem: three sound waves
18. "Netflix" — emblem: a play triangle
19. "Disney+" — emblem: a sparkle castle turret
20. "Audible" — emblem: a headphone/sound mark

Row 6 — Student tools & money:
21. "Notion" — emblem: a simple page/block
22. "Adobe" — emblem: a rounded triangle
23. "Venmo" — emblem: a chat-bubble dollar
24. "Cash App" — emblem: a dollar in a rounded square
```

---

## ROSTER LOGIC — why these brands

Every brand above is a real **gift-card issuer** *and* a plausible **CPM advertiser to college students**,
so the sponsor list and the marketplace list are the same partners:

| Marketplace gift card (seed) | Same brand as a wallpaper sponsor |
|---|---|
| Amazon, Target, Apple | ✅ rows 3 |
| Spotify, Starbucks, Chipotle, DoorDash | ✅ rows 1, 3, 5 |
| Venmo, Cash App | ✅ row 6 |

**Swap freely** (same student-relevant + gift-card criteria): Red Bull, Subway, Dutch Bros, Crumbl,
GrubHub, Walmart, Nintendo eShop, PlayStation, Xbox, Hulu, Max, Grammarly, Canva, Uber, Lyft, Sephora.

---

## SPLIT INTO 3 SHEETS (recommended if 24-in-one drifts)

Reuse the **AESTHETIC** + **LAYOUT** blocks verbatim; change only the grid + tile list:

1. **sponsors-food.png** — 4 cols x 2 rows (8) — Rows 1–2 (coffee & food).
2. **sponsors-retail.png** — 4 cols x 2 rows (8) — Rows 3–4 (retail, lifestyle).
3. **sponsors-digital.png** — 4 cols x 2 rows (8) — Rows 5–6 (subscriptions, tools, money).

Keep cell size 512 x 192 px and the transparent-gap / no-text-outside-pills rules identical.

---

## WIRING THE TILES INTO THE APP

The `sponsors` table has a `logoUrl`; `AdBanner.tsx` renders it as `<img object-fit:contain>` and
`SponsoredWallpaper.tsx` tiles them. After you generate + slice the sheet:

**Option A — bundle as assets (cleanest for a fixed roster)**
1. Slice into 24 transparent PNGs → `client/src/assets/sponsors/<brand>.png`.
2. Import them in a small `client/src/assets/sponsors.ts` map (mirror `assets/sprites.ts`).
3. In the seed (`server/seed.ts`), set each sponsor's `logoUrl` to the imported URL, or have `AdBanner`
   look the logo up by `companyName`.

**Option B — host + reference by URL (no rebuild to change sponsors)**
1. Upload the 24 PNGs somewhere static (Replit static, an S3/bucket, or a CDN).
2. Put the public URL in each sponsor row's `logoUrl` — via the Admin → Sponsors form, or the seed.

**Update the seed roster** (`server/seed.ts` → `SPONSORS`) to match these brands so a fresh
`npm run db:seed` shows the real partner set. Each tile's brand name should equal the sponsor's
`companyName` so lookups line up.

---

## NOTES

- Keep tiles **monochrome mint** even though real ads are full-color — at 0.35 opacity behind chat, color
  logos look broken; stylized mint pills look designed. (Flip `AD_WALLPAPER_OPACITY` up if you switch to
  real color logos for a pitch.)
- For the **revenue slide**: CPM math uses `CPM_RATE_USD` (`client/src/config.ts`) and each sponsor's
  `cpmRateUsd`; impressions are logged per tile render in `adImpressions`.
