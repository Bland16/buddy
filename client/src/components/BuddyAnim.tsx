// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/BuddyAnim.tsx
// DOMAIN:      ui
// CONCEPT:     The flipbook + CSS-motion animation driver for Buddy and status sprites
// RELATIONS:   reads SPRITE_ANIMATIONS from assets/sprites.ts; used across pages for delight moments
// KEY EXPORTS: BuddyAnim
// PURPOSE:     <BuddyAnim animation="searching" size={120} /> cycles frames + layers a motion class.
// LLM EDIT GUIDE: Animations are data (assets/sprites.ts) — add entries there, not here. Honors
//                 prefers-reduced-motion by showing only the first frame.
// DAY-OF CHANGES: none here; tune intervalMs in the manifest.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { SPRITES, SPRITE_ANIMATIONS, type AnimationName, type SpriteAnimation } from '@/assets/sprites';

interface BuddyAnimProps {
  animation: AnimationName;
  size?: number;
  className?: string;
  /** Called once a non-looping ('once') animation completes a single cycle. */
  onDone?: () => void;
}

const MOTION_CLASS: Record<string, string> = {
  breathe: 'anim-breathe',
  bob: 'anim-bob',
  wave: 'anim-wave',
  pop: 'anim-pop',
  spin: 'anim-spin',
  none: '',
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function BuddyAnim({ animation, size = 96, className = '', onDone }: BuddyAnimProps) {
  // Cast to the interface so optional `overlay`/`motion` are accessible (satisfies keeps literals narrow).
  const def = SPRITE_ANIMATIONS[animation] as SpriteAnimation;
  const [frameIdx, setFrameIdx] = useState(0);
  const dirRef = useRef(1); // for pingpong
  const reduced = prefersReducedMotion();

  useEffect(() => {
    setFrameIdx(0);
    dirRef.current = 1;
    // Single-frame or reduced motion → no flipbook (CSS motion still applies via class).
    if (def.intervalMs === 0 || def.frames.length <= 1 || reduced) {
      if (def.loop === 'once' && onDone) {
        const t = setTimeout(onDone, 400);
        return () => clearTimeout(t);
      }
      return;
    }

    const interval = setInterval(() => {
      setFrameIdx((idx) => {
        if (def.loop === 'pingpong') {
          let next = idx + dirRef.current;
          if (next >= def.frames.length) {
            dirRef.current = -1;
            next = idx - 1;
          } else if (next < 0) {
            dirRef.current = 1;
            next = idx + 1;
          }
          return next;
        }
        const next = idx + 1;
        if (next >= def.frames.length) {
          if (def.loop === 'once') {
            clearInterval(interval);
            onDone?.();
            return idx; // hold on last frame
          }
          return 0; // loop
        }
        return next;
      });
    }, def.intervalMs);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation]);

  const frame = def.frames[Math.min(frameIdx, def.frames.length - 1)];
  const motionClass = def.motion ? MOTION_CLASS[def.motion] ?? '' : '';

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={SPRITES[frame]}
        width={size}
        height={size}
        alt=""
        draggable={false}
        className={motionClass}
        style={{ objectFit: 'contain' }}
      />
      {def.overlay && (
        <img
          src={SPRITES[def.overlay]}
          width={size}
          height={size}
          alt=""
          draggable={false}
          className="anim-pop pointer-events-none absolute inset-0"
          style={{ objectFit: 'contain' }}
        />
      )}
    </span>
  );
}
