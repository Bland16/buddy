// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/PointsDisplay.tsx
// DOMAIN:      points
// CONCEPT:     The points counter + a celebratory toast when a gift point drops
// RELATIONS:   uses usePoints (balance); driven by useChat's onPointDrop in ChatPage
// KEY EXPORTS: PointsDisplay
// PURPOSE:     Shows the spendable balance and pops point-pop + buddy-celebrate on a drop.
// LLM EDIT GUIDE: The drop is a charming twist — the EARNER's points go to their match. Copy from
//                 config.ts (never gamified-cheesy).
// DAY-OF CHANGES: toast dwell time below.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { CONFIG } from '@/config';
import { Sprite } from './Sprite';
import { BuddyAnim } from './BuddyAnim';

interface PointsDisplayProps {
  spendable: number;
  /** Increment this to trigger the celebration toast (e.g. a counter bumped on each drop). */
  dropSignal?: number;
  /** Alias of the recipient, for the drop copy. */
  recipientAlias?: string;
  /** true when the drop's recipient is the current user (they got points). */
  iAmRecipient?: boolean;
}

const TOAST_MS = 2600; // DAY-OF CHANGE: how long the celebration toast lingers

export function PointsDisplay({ spendable, dropSignal = 0, recipientAlias, iAmRecipient }: PointsDisplayProps) {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (dropSignal === 0) return;
    setShowToast(true);
    const t = setTimeout(() => setShowToast(false), TOAST_MS);
    return () => clearTimeout(t);
  }, [dropSignal]);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
        <Sprite name="point_coin" size={20} />
        <span className="text-sm font-semibold text-pine">{spendable}</span>
      </div>

      {showToast && (
        <div className="absolute right-0 top-full z-30 mt-2 flex w-64 items-start gap-2 rounded-2xl bg-white px-3 py-2.5 shadow-lift">
          <BuddyAnim animation={iAmRecipient ? 'buddy-celebrate' : 'point-pop'} size={40} />
          <p className="text-sm text-pine">
            {iAmRecipient
              ? 'A gift point just landed for you.'
              : CONFIG.COPY.pointDrop(recipientAlias ?? 'your match')}
          </p>
        </div>
      )}
    </div>
  );
}
