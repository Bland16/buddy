# BUDDY — Sponsor Logos · Sprite Sheet Prompt

> Generates the **fictional sponsor logos** that appear behind the chat (the `SponsoredWallpaper`).
> Companion to `BUDDY_SPRITE_SHEET_PROMPT.md` (mascot/icons). **One sponsor shows at a time** as a tiled
> single-brand watermark, rotating between sponsors.

---

## ✅ These are FAKE brands — on purpose

- Every company below is **invented** (fun, punny, plausible student-y names). That means **no trademark
  risk** — you can ship these in a live product, not just a demo.
- Roster is **heavy on food & service** (coffee, eats, sweets, delivery, campus services) — the stuff a
  student actually buys, so "ad revenue funds the gift cards" reads naturally.
- Each tile is a **real logo lockup** (a simple emblem + the brand name styled as a wordmark) — **not a
  plain text pill.** It should look like an actual little brand logo.

---

## AESTHETIC — "Soft Mint Plaid" logos (so they blend behind chat)

The wallpaper renders at low opacity (`AD_WALLPAPER_OPACITY = 0.35`) behind chat bubbles, so logos stay
**calm, flat, monochrome-mint** — characterful but never fighting the conversation.

**Palette (locked — green + white only):**
| Token | Hex | Use |
|---|---|---|
| White | `#FFFFFF` | knockout / negative space |
| Canvas | `#F4FAF6` | pale fills |
| Mint mist | `#E4F5EA` | light fills |
| Mint 400 | `#8FD3A6` | secondary shapes |
| Green 500 | `#5FBF86` | primary emblem |
| Green 700 | `#3E9B68` | wordmark + key strokes |
| Pine ink | `#1F4A36` | small detail/accents |

- **Logo style:** each is a small **emblem/mark above (or beside) a rounded-sans wordmark** — like a
  cohesive brand logo. Squishy, rounded, matte, no gloss, consistent weight across all 24.
- Monochrome mint throughout. Distinction comes from the **emblem shape + the name**, not from color.
- *(Optional for a punchier pitch: give each logo ONE deep-green accent. Default = monochrome mint, which
  blends best at 0.35 opacity.)*

---

## THE PROMPT

> Paste into your image generator. If 24-in-one drifts, use **SPLIT INTO 3 SHEETS** at the bottom.

```
A single sprite sheet of 24 fictional brand LOGOS for a calm mint-green app called Buddy. These are made-
up, fun, student-friendly food & service companies — each a proper little logo: a simple rounded emblem
PLUS the brand name as a clean wordmark in a rounded geometric sans (Quicksand/Nunito style). Premium
mobile-app quality. They are original invented brands, NOT real companies and NOT any real logo.

ART DIRECTION "Soft Mint Plaid": calm, flat vector, squishy rounded geometry, gentle soft inner shading.
No gloss, no hard drop shadows, no harsh outlines. MONOCHROMATIC mint-green + white palette ONLY — NO
coral, NO yellow, NO other colors:
  - White #FFFFFF, off-white #F4FAF6
  - Mint mist #E4F5EA, mint #8FD3A6
  - Mint primary #5FBF86, deep green #3E9B68
  - Pine-green ink #1F4A36
Emblems in mint/deep green; wordmarks in deep green #3E9B68. Every logo the same visual size, same style,
same weight. Cute, calm, fresh.

LAYOUT FOR SEGMENTATION (critical):
- One PNG, 2048 x 1536 px, FULLY TRANSPARENT background.
- A clean 4 columns x 6 rows grid = 24 logos, each centered in a 512 x 256 px cell (emblem stacked above
  the wordmark).
- Generous padding (~16% margin) so NO logo touches its neighbors; clear transparent space between all.
- ABSOLUTELY NO grid lines, frames, borders, background color, captions outside the logos, numbers, or
  watermarks. No logo cropped at an edge. No shadow bleeding into adjacent cells.

LOGOS (left-to-right, top-to-bottom) — each = emblem + the exact brand name as a wordmark:

Row 1 — Coffee & drinks:
1. "Brewhaha" — emblem: a takeaway coffee cup with a little steam swirl
2. "Bean There" — emblem: a single rounded coffee bean
3. "Chai Five" — emblem: a tea cup with a tiny raised-hand/leaf
4. "Pour Decisions" — emblem: a smoothie cup with a straw

Row 2 — Fast & casual eats:
5. "Fork Yeah" — emblem: a cheerful rounded fork
6. "Holy Guacamole" — emblem: an avocado half
7. "Wok This Way" — emblem: a wok with noodles + chopsticks
8. "Slice Slice Baby" — emblem: a pizza slice

Row 3 — Sweets & snacks:
9.  "Crumb Together" — emblem: a cupcake
10. "Munch Bunch" — emblem: a snack bag
11. "Sugar Rush" — emblem: a donut
12. "Scoop Troop" — emblem: an ice-cream cone

Row 4 — Delivery & grocery:
13. "Dorm Dash" — emblem: a delivery scooter with a bag
14. "Nom Nom Co." — emblem: a takeout box with chopsticks
15. "Clutch Couriers" — emblem: a parcel with little motion lines
16. "Cart Smart" — emblem: a rounded shopping cart

Row 5 — Campus services:
17. "Sudsy" — emblem: a soap bubble / laundry swirl
18. "Cut Above" — emblem: rounded scissors + comb
19. "Glow Up" — emblem: a hand mirror with a sparkle
20. "Zen Den" — emblem: a lotus / calm leaf

Row 6 — More services:
21. "Fetch & Co." — emblem: a paw print
22. "Handy Pandas" — emblem: a friendly wrench
23. "Rideloop" — emblem: a looped arrow around a tiny car
24. "Petal Pushers" — emblem: a single rounded flower
```

---

## SPLIT INTO 3 SHEETS (recommended if 24-in-one drifts)

Reuse the **ART DIRECTION** + **LAYOUT** blocks verbatim; change only the grid + logo list:

1. **sponsors-food1.png** — 4 cols x 2 rows (8) — Rows 1–2 (coffee & casual eats).
2. **sponsors-food2.png** — 4 cols x 2 rows (8) — Rows 3–4 (sweets, snacks, delivery).
3. **sponsors-services.png** — 4 cols x 2 rows (8) — Rows 5–6 (campus & other services).

Keep cell size 512 x 256 px and the transparent-gap / no-text-outside-logos rules identical.

---

## WIRING THE LOGOS INTO THE APP (one sponsor at a time)

The `sponsors` table has a `logoUrl`; `AdBanner.tsx` renders it as `<img object-fit:contain>` and
`SponsoredWallpaper.tsx` shows **one sponsor at a time** — a single brand's logo tiled as a watermark,
rotating to the next sponsor on an interval. After you generate + slice the sheet:

**Because each asset is now a COMPLETE logo lockup (emblem + name),** `AdBanner` can render the image on
its own — drop the pill background and the separate company-name text so you don't double up the name.

**Option A — bundle as assets (cleanest for a fixed roster)**
1. Slice into 24 transparent PNGs → `client/src/assets/sponsors/<brand>.png`.
2. Import them in a small `client/src/assets/sponsors.ts` map (mirror `assets/sprites.ts`).
3. In `server/seed.ts`, set each sponsor's `logoUrl` (or have `AdBanner` look the logo up by
   `companyName`).

**Option B — host + reference by URL (no rebuild to change sponsors)**
1. Upload the 24 PNGs to static hosting (Replit static / a bucket / a CDN).
2. Put each public URL in the sponsor row's `logoUrl` — via Admin → Sponsors, or the seed.

**Update the seed roster** (`server/seed.ts` → `SPONSORS`) to these fictional brands so a fresh
`npm run db:seed` shows them. Each entry's `companyName` must exactly match the wordmark on its tile.

> Note: the **marketplace gift cards** can stay real desirable brands (Amazon, Spotify, etc.) since those
> are what students want to redeem — sponsors and gift-card merchants no longer have to be the same.
> If you'd rather keep them fully consistent, fictionalize the marketplace items too (e.g. a "Brewhaha
> $5 card").

---

## NOTES

- **One sponsor at a time:** the wallpaper features a single brand (its logo tiled as a watermark) and
  rotates every `SPONSOR_ROTATE_MS` (default 30s). An impression is logged once per sponsor each time it
  becomes the active brand — not for every sponsor at once.
- Keep logos **monochrome mint** even though real ads are full-color — at 0.35 opacity behind chat, color
  logos look broken; stylized mint logos look designed. (Raise `AD_WALLPAPER_OPACITY` if you go color.)
- For the **revenue slide:** CPM math uses `CPM_RATE_USD` (`client/src/config.ts`) and each sponsor's
  `cpmRateUsd`; impressions are logged per active-sponsor render in `adImpressions`.
