# BUDDY — Aesthetic Direction & Sprite Sheet Prompt

---

## AESTHETIC DIRECTION — "Soft Mint Plaid"

**The feeling:** a calm, fresh, picnic-blanket-cozy space — soft mint greens on lots of white, like the
plaid reference. Calm first, gently playful. Nothing sharp, loud, or high-pressure. This serves Buddy's
promise: *"Practice being social. No pressure, no names."*

**Pillars**
- **Monochromatic green + white.** Mint green is the whole palette; there is **no coral, no yellow, no
  warm accent**. Variety and contrast come from *value* (pale mist → deep pine), not from other hues.
- **Plaid is the signature texture.** The soft mint gingham/plaid (from the reference) is Buddy's
  background motif — use it, very faint, as the app canvas and on quiet screens (landing, onboarding,
  profile). Keep it low-contrast so text and the mascot stay crisp on top.
- **Squishy, rounded shapes.** Super-rounded corners, pill and blob forms, soft "inflated" look via
  gentle inner shading. No sharp angles, no thin hard outlines, matte (no gloss).
- **Playfulness without warm color.** Charm comes from the squishy forms, the plaid, and Buddy's
  expressions — not from contrasting accents. Delight moments (points, celebration) pop using the
  *brightest/deepest greens* against pale mint, plus white sparkles.
- **Type pairing (app, not the sheet):** a rounded geometric sans — **Quicksand**, **Nunito**, or
  **Baloo 2**.

**Palette (locked — green + white only; use these hexes in `config.ts` + `tailwind.config.ts`)**
| Token | Hex | Use |
|---|---|---|
| White | `#FFFFFF` | base, chat bubbles, card surfaces |
| Canvas | `#F4FAF6` | app background (off-white) |
| Mint mist | `#E4F5EA` | palest plaid wash / tint fills |
| Mint 200 | `#C7E9D2` | soft fills, light avatars |
| Mint 400 | `#8FD3A6` | highlights, secondary fills |
| Green 500 (primary) | `#5FBF86` | brand, primary buttons, mascot body |
| Green 700 (deep) | `#3E9B68` | crisp plaid lines, "pop"/delight, accents |
| Pine ink | `#1F4A36` | text + mascot features (calm deep green, never black) |

> Calm = mint + lots of white + pine-green ink (not black). Contrast/delight = deep green `#3E9B68`
> against pale mint, with white sparkles. No warm colors anywhere.

---

## THE PROMPT

> Paste the block below into your image generator. If 48 cells come out inconsistent, use **SPLIT INTO
> 3 SHEETS** at the bottom — models hold style far better across smaller sheets.

```
A single sprite sheet for "Buddy", a calm, fresh, mint-green anonymous-chat app that helps shy people
build social confidence. One cohesive icon/mascot set, premium mobile-app quality. Art direction
"Soft Mint Plaid": calm-first and gently playful — soft, squishy, rounded forms on airy white space,
matte (no gloss), a fresh mint-green-and-white world like a soft gingham picnic blanket.

MASCOT — "Buddy": a simple round/egg-shaped emoji-style face, no body (or tiny minimal hands only when
noted). Signature look = ONE eye winking (a closed upward curve, ^ ), the other eye a clean open oval,
and a confident asymmetric SMIRK (half-smile lifted on one side). Buddy's face is soft MINT GREEN
(#5FBF86) with a lighter mint highlight (#8FD3A6), deep pine-green features (#1F4A36), and subtle
soft green-tinted cheeks (a slightly deeper green, NOT coral/pink). Buddy is the brand — keep its
proportions, wink, and smirk identical across every expression; only change mood. Buddy is squishy,
soft, and huggable.

STYLE: flat vector illustration with squishy rounded geometry and gentle soft inner shading. No harsh
outlines, no hard drop shadows, no glossy gradients. Matte and calm. Consistent line weight and scale
across ALL sprites. MONOCHROMATIC mint-green + white palette ONLY — NO coral, NO yellow, NO warm
colors:
  - White #FFFFFF, off-white #F4FAF6
  - Mint mist #E4F5EA, mint #C7E9D2, light mint #8FD3A6
  - Mint primary #5FBF86, deep green #3E9B68
  - Pine-green ink #1F4A36
Contrast comes from light vs deep green only. Cute, calm, fresh, low-pressure, never loud.

LAYOUT FOR SEGMENTATION (critical):
- One PNG, 2048 x 1536 px, FULLY TRANSPARENT background.
- A clean 8 columns x 6 rows grid = 48 sprites, each in a 256 x 256 px cell.
- Center each sprite in its cell with generous padding (~18% margin) so NO sprite touches its
  neighbors — leave clear transparent space between every sprite.
- All sprites roughly the same visual size and the same style.
- ABSOLUTELY NO: grid lines, frames, borders, background color, captions, labels, numbers, watermarks,
  or text of any kind. No sprite cropped at an edge. No shadow bleeding into adjacent cells.

SPRITES (left-to-right, top-to-bottom):

Row 1 — Buddy mascot expressions:
1. Buddy signature: wink + confident smirk (the app logo)
2. Buddy big open happy grin
3. Buddy waving hello with one little hand
4. Buddy shy/blushing: soft green-tinted cheeks, small bashful smile, glancing aside
5. Buddy peeking out from behind an edge (introvert, half-hidden, curious)
6. Buddy thinking: eyes glancing up, tiny thought dot
7. Buddy giving an encouraging thumbs up
8. Buddy celebrating with little deep-green + white confetti bursts around it

Row 2 — Buddy moods & chat reactions:
9.  Buddy laughing, eyes happily closed
10. Buddy gentle and caring (soft warm look, for a kind safety nudge)
11. Buddy sleepy/waiting with small "z z z" (for the matchmaking wait screen)
12. Buddy mildly surprised, small round "o" mouth
13. Buddy warm/affectionate with little deep-green hearts
14. Buddy proud and confident with a small deep-green star sparkle
15. Buddy cheering with both little hands raised
16. Buddy reassuring "shh", one finger up, soft caring smile

Row 3 — Anonymous match avatars (squishy, identity-hiding, all green tints, same soft style):
17. Cute masquerade eye-mask avatar (mint #5FBF86)
18. Friendly rounded blob avatar (deep green #3E9B68)
19. Geometric fox-like avatar (sage #8FD3A6)
20. Soft friendly ghost avatar (pale mint #C7E9D2)
21. Cute paper-bag face avatar (pine #2E7D52)
22. Hooded gentle figure avatar (aqua-green #6FD8C0)
23. Star-shaped face avatar (spring green #7BCB7E)
24. Cloud-shaped face avatar (light mint #A6DDB8)

Row 4 — Points, gifting & marketplace:
25. Single Gift Point coin: deep-green token with a pale-mint engraved sparkle
26. A neat stack of green point coins
27. Wrapped gift box: mint box with a deep-green bow
28. Sparkle/point-drop burst (a pop of deep-green + white stars)
29. Two open mint hands offering a small deep-green gift (the "give points to your match" gesture)
30. Generic gift card (mint with a deep-green stripe)
31. Takeaway coffee cup (gift-card category)
32. Redemption seal: mint ribbon rosette with a checkmark

Row 5 — Chat, safety & messaging:
33. Single rounded mint chat bubble
34. Two overlapping chat bubbles, mint + white (a conversation)
35. Typing indicator: a chat bubble with three dots
36. Send icon: a mint paper plane
37. Gentle safety shield: mint with a small deep-green heart inside
38. Community-guideline card: an open little book / soft checklist
39. Privacy/anonymity icon: a soft mint padlock
40. Notification bell

Row 6 — Status, navigation & system:
41. Searching for a match: magnifier over two small dots
42. Match found: two squishy shapes linked together (mint + deep green)
43. Loading spinner ring (mint)
44. Connected/online: a glowing mint dot with a soft pulse ring
45. Home icon
46. Profile icon: a simple Buddy-head silhouette
47. Marketplace/store icon: a little storefront
48. Settings gear (admin)
```

---

## NOTES / DESIGN DECISIONS

- **Monochrome green, per the reference.** Coral and yellow are gone. The whole set lives in mint →
  deep pine green on white. Calm comes from the mint + white base and pine-green (not black) features;
  contrast/delight comes from deep green `#3E9B68` against pale mint plus white sparkles.
- **Plaid is the texture, not the sprites.** Keep sprites clean on transparent cells; use the soft mint
  plaid as a faint app background so the sprites read crisply on top. (It also pairs naturally with the
  chat screen's sponsored wallpaper — plaid behind, ad tiles layered, all in the same green family.)
- **Avatars stay distinct by value.** Eight green tints (pale mint → pine, plus a spring-green and an
  aqua-green) keep nameless matches visually distinct without leaving the palette.
- **Mascot-first sheet.** Rows 1–2 (16 Buddy moods) carry empty states, the wait spinner, the gentle
  moderation nudge, and redemption success. Wink + smirk stay constant so it always reads as the logo.

## OPTIONAL EXTENDED SET (2nd sheet — badges + onboarding)
Achievement badges: First Chat, Generous Gifter (deep-green heart-coin), 7-day Streak (deep-green
flame), Brave (mint star), Good Listener (mint ear). Onboarding goal icons: Make Friends (two figures),
Practice Talking (speech), Build Confidence (rising star/arrow). Lay out 8-wide, same green-only palette
+ style + transparent rules.

---

## SPLIT INTO 3 SHEETS (use if 48-in-one comes out inconsistent — recommended)

Reuse the **AESTHETIC**, **MASCOT**, and **LAYOUT FOR SEGMENTATION** blocks verbatim each time; change
only the grid size and sprite list:

1. **buddy-mascot.png** — 4 cols x 4 rows (16), Rows 1–2 (Buddy expressions).
2. **buddy-avatars.png** — 4 cols x 2 rows (8), Row 3 (anonymous avatars).
3. **buddy-icons.png** — 8 cols x 3 rows (24), Rows 4–6 (economy, chat/safety, system).

Keep cell size at 256 px and the transparent-gap / no-text rules identical so the segmenter slices all
three the same way.
```
