// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/MatchCard.tsx
// DOMAIN:      matchmaking
// CONCEPT:     Anonymous match header — alias + a deterministic avatar sprite
// RELATIONS:   uses avatarForAlias from assets/sprites; shown atop ChatPage + in ProfilePage history
// KEY EXPORTS: MatchCard
// PURPOSE:     Shows who you're talking to without revealing any real identity.
// LLM EDIT GUIDE: The avatar is hashed from the alias so it's stable. Never render real names here.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { avatarForAlias } from '@/assets/sprites';
import { Sprite } from './Sprite';
import { BuddyAnim } from './BuddyAnim';

interface MatchCardProps {
  alias: string;
  online?: boolean;
  subtitle?: string;
}

export function MatchCard({ alias, online = true, subtitle }: MatchCardProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-soft/40">
          <Sprite name={avatarForAlias(alias)} size={36} />
        </div>
        {online && (
          <span className="absolute -bottom-1 -right-1">
            <BuddyAnim animation="online-pulse" size={18} />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-pine">{alias}</p>
        <p className="truncate text-sm text-pine/60">{subtitle ?? 'here now'}</p>
      </div>
    </div>
  );
}
