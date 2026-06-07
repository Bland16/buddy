// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/Sprite.tsx
// DOMAIN:      ui
// CONCEPT:     Render a single named sprite by key
// RELATIONS:   reads SPRITES from assets/sprites.ts; used by nav, icons, MatchCard avatars
// KEY EXPORTS: Sprite
// PURPOSE:     <Sprite name="buddy_smirk" size={96} /> → a decorative <img> of that sprite.
// LLM EDIT GUIDE: Decorative by default (alt=''). Pass alt for meaningful icons.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { SPRITES, type SpriteName } from '@/assets/sprites';

interface SpriteProps {
  name: SpriteName;
  size?: number;
  alt?: string;
  className?: string;
}

export function Sprite({ name, size = 48, alt = '', className }: SpriteProps) {
  return (
    <img
      src={SPRITES[name]}
      width={size}
      height={size}
      alt={alt}
      className={className}
      style={{ objectFit: 'contain' }}
      draggable={false}
    />
  );
}
