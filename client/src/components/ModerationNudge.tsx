// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/ModerationNudge.tsx
// DOMAIN:      moderation
// CONCEPT:     The gentle in-chat nudge card shown to both users when Claude flags a message
// RELATIONS:   fed by useChat's `nudge` (from chat:nudge socket event); uses BuddyAnim 'buddy-nudge'
// KEY EXPORTS: ModerationNudge
// PURPOSE:     Frames the moment as the vibe of the place, never a rule someone broke.
// LLM EDIT GUIDE: Copy must follow brand voice — no "violation"/"warning". Default text in config.ts.
// DAY-OF CHANGES: none here; nudge wording is composed by Claude (server/config.ts prompt).
// ─────────────────────────────────────────────────────────────────────────

import { BuddyAnim } from './BuddyAnim';
import type { ModerationNudge as NudgeData } from '@/types';

interface ModerationNudgeProps {
  nudge: NudgeData;
  onAllGood: () => void;
}

export function ModerationNudge({ nudge, onAllGood }: ModerationNudgeProps) {
  return (
    <div className="mx-auto my-3 flex max-w-md items-start gap-3 rounded-2xl border border-mint-soft bg-white px-4 py-3 shadow-soft">
      <BuddyAnim animation="buddy-nudge" size={48} />
      <div className="flex-1">
        <p className="text-sm text-pine">{nudge.message}</p>
        <button
          onClick={onAllGood}
          className="mt-2 rounded-full bg-mint px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-mint-deep"
        >
          All good
        </button>
      </div>
    </div>
  );
}
