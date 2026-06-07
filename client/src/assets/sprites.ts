// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/assets/sprites.ts
// DOMAIN:      ui
// CONCEPT:     The sprite asset manifest — 55 named PNGs + the animation definitions
// RELATIONS:   imported by Sprite.tsx (single sprite) and BuddyAnim.tsx (flipbook animations)
// KEY EXPORTS: SPRITES, SpriteName, SPRITE_ANIMATIONS, AnimationName, SpriteAnimation
// PURPOSE:     Vite-imports every sprite (content-hashed) and maps names → URLs + animation frames.
// LLM EDIT GUIDE: New sprite → drop the PNG in ./sprites and add one import + SPRITES entry. New
//                 animation → add one SPRITE_ANIMATIONS entry referencing existing frame names.
// DAY-OF CHANGES: tune `intervalMs` per animation to speed up / slow down a motion.
// ─────────────────────────────────────────────────────────────────────────

// ── SECTION: Sprite imports (one per PNG; Vite content-hashes each) ─────────
import avatar_bag from './sprites/avatar_bag.png';
import avatar_blob from './sprites/avatar_blob.png';
import avatar_cloud from './sprites/avatar_cloud.png';
import avatar_fox from './sprites/avatar_fox.png';
import avatar_ghost from './sprites/avatar_ghost.png';
import avatar_hood from './sprites/avatar_hood.png';
import avatar_mask from './sprites/avatar_mask.png';
import avatar_star from './sprites/avatar_star.png';
import bell from './sprites/bell.png';
import buddy_cheer from './sprites/buddy_cheer.png';
import buddy_gentle from './sprites/buddy_gentle.png';
import buddy_grin from './sprites/buddy_grin.png';
import buddy_happy from './sprites/buddy_happy.png';
import buddy_laugh from './sprites/buddy_laugh.png';
import buddy_love from './sprites/buddy_love.png';
import buddy_proud from './sprites/buddy_proud.png';
import buddy_shush from './sprites/buddy_shush.png';
import buddy_shy from './sprites/buddy_shy.png';
import buddy_sleepy from './sprites/buddy_sleepy.png';
import buddy_smirk from './sprites/buddy_smirk.png';
import buddy_surprised from './sprites/buddy_surprised.png';
import buddy_think from './sprites/buddy_think.png';
import buddy_thumbs_up from './sprites/buddy_thumbs_up.png';
import buddy_wave from './sprites/buddy_wave.png';
import buddy_wink from './sprites/buddy_wink.png';
import chat_bubble from './sprites/chat_bubble.png';
import chat_convo from './sprites/chat_convo.png';
import chat_typing from './sprites/chat_typing.png';
import coffee_cup from './sprites/coffee_cup.png';
import gear from './sprites/gear.png';
import gear_sync from './sprites/gear_sync.png';
import gift_box from './sprites/gift_box.png';
import gift_card from './sprites/gift_card.png';
import gift_hands from './sprites/gift_hands.png';
import glow_1 from './sprites/glow_1.png';
import glow_2 from './sprites/glow_2.png';
import guidelines_book from './sprites/guidelines_book.png';
import home from './sprites/home.png';
import lock_privacy from './sprites/lock_privacy.png';
import match_linked from './sprites/match_linked.png';
import point_burst from './sprites/point_burst.png';
import point_coin from './sprites/point_coin.png';
import point_stack from './sprites/point_stack.png';
import profile from './sprites/profile.png';
import redeem_seal from './sprites/redeem_seal.png';
import ring_1 from './sprites/ring_1.png';
import ring_2 from './sprites/ring_2.png';
import ring_3 from './sprites/ring_3.png';
import search from './sprites/search.png';
import search_dot from './sprites/search_dot.png';
import search_dots from './sprites/search_dots.png';
import send_plane from './sprites/send_plane.png';
import shield_heart from './sprites/shield_heart.png';
import sparkle from './sprites/sparkle.png';
import store from './sprites/store.png';

/** Every sprite by name → its content-hashed URL. */
export const SPRITES = {
  avatar_bag,
  avatar_blob,
  avatar_cloud,
  avatar_fox,
  avatar_ghost,
  avatar_hood,
  avatar_mask,
  avatar_star,
  bell,
  buddy_cheer,
  buddy_gentle,
  buddy_grin,
  buddy_happy,
  buddy_laugh,
  buddy_love,
  buddy_proud,
  buddy_shush,
  buddy_shy,
  buddy_sleepy,
  buddy_smirk,
  buddy_surprised,
  buddy_think,
  buddy_thumbs_up,
  buddy_wave,
  buddy_wink,
  chat_bubble,
  chat_convo,
  chat_typing,
  coffee_cup,
  gear,
  gear_sync,
  gift_box,
  gift_card,
  gift_hands,
  glow_1,
  glow_2,
  guidelines_book,
  home,
  lock_privacy,
  match_linked,
  point_burst,
  point_coin,
  point_stack,
  profile,
  redeem_seal,
  ring_1,
  ring_2,
  ring_3,
  search,
  search_dot,
  search_dots,
  send_plane,
  shield_heart,
  sparkle,
  store,
} as const;

export type SpriteName = keyof typeof SPRITES;

// ── SECTION: Animation manifest (source of truth = BUDDY_SPRITES.md) ────────

export interface SpriteAnimation {
  /** 1+ frames; a single frame means motion comes from the CSS class only. */
  frames: SpriteName[];
  /** ms per frame for the flipbook (0 = single frame, no flipbook). */
  intervalMs: number;
  loop: 'loop' | 'once' | 'pingpong';
  /** CSS transform layered on top of the flipbook. */
  motion?: 'breathe' | 'bob' | 'wave' | 'pop' | 'spin' | 'none';
  /** Optional sprite composited above the frame (e.g. point_burst). */
  overlay?: SpriteName;
}

export const SPRITE_ANIMATIONS = {
  'buddy-idle': { frames: ['buddy_smirk'], intervalMs: 0, loop: 'loop', motion: 'breathe' },
  'buddy-wave': { frames: ['buddy_grin', 'buddy_wave'], intervalMs: 350, loop: 'once', motion: 'wave' },
  'buddy-laugh': { frames: ['buddy_happy', 'buddy_laugh'], intervalMs: 250, loop: 'loop', motion: 'none' },
  'buddy-think': { frames: ['buddy_think'], intervalMs: 0, loop: 'loop', motion: 'bob' },
  'buddy-sleepy': { frames: ['buddy_sleepy'], intervalMs: 0, loop: 'loop', motion: 'bob' },
  'buddy-shy': { frames: ['buddy_shy'], intervalMs: 0, loop: 'once', motion: 'bob' },
  'buddy-celebrate': {
    frames: ['buddy_cheer', 'buddy_proud', 'buddy_love'],
    intervalMs: 300,
    loop: 'once',
    motion: 'pop',
    overlay: 'point_burst',
  },
  'buddy-nudge': { frames: ['buddy_gentle'], intervalMs: 0, loop: 'once', motion: 'pop', overlay: 'shield_heart' },
  searching: { frames: ['search', 'search_dot', 'search_dots'], intervalMs: 300, loop: 'loop', motion: 'none' },
  spinner: { frames: ['ring_1', 'ring_2', 'ring_3'], intervalMs: 150, loop: 'loop', motion: 'spin' },
  'online-pulse': { frames: ['glow_1', 'glow_2'], intervalMs: 600, loop: 'pingpong', motion: 'none' },
  typing: { frames: ['chat_typing'], intervalMs: 0, loop: 'loop', motion: 'bob' },
  'point-pop': { frames: ['point_coin'], intervalMs: 0, loop: 'once', motion: 'pop', overlay: 'point_burst' },
  'match-found': { frames: ['match_linked'], intervalMs: 0, loop: 'once', motion: 'pop' },
  'send-whoosh': { frames: ['send_plane'], intervalMs: 0, loop: 'once', motion: 'pop' },
  'gear-sync': { frames: ['gear', 'gear_sync'], intervalMs: 200, loop: 'loop', motion: 'spin' },
} as const satisfies Record<string, SpriteAnimation>;

export type AnimationName = keyof typeof SPRITE_ANIMATIONS;

/** The 8 anonymous avatars, indexed by a hash of the alias for stable identity. */
export const AVATAR_SPRITES: SpriteName[] = [
  'avatar_mask',
  'avatar_blob',
  'avatar_fox',
  'avatar_ghost',
  'avatar_bag',
  'avatar_hood',
  'avatar_star',
  'avatar_cloud',
];

/** Deterministically map an alias to one of the 8 avatars (same alias → same avatar). */
export function avatarForAlias(alias: string): SpriteName {
  let hash = 0;
  for (let i = 0; i < alias.length; i++) hash = (hash * 31 + alias.charCodeAt(i)) >>> 0;
  return AVATAR_SPRITES[hash % AVATAR_SPRITES.length];
}
