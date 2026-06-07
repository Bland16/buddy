// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/pages/ProfilePage.tsx
// DOMAIN:      ui
// CONCEPT:     "You, lately" — your alias/avatar, points received, and conversation tastes
// RELATIONS:   uses useAuth + usePoints; framed as taste, never scores/levels/progress
// KEY EXPORTS: ProfilePage (default)
// PURPOSE:     A calm summary of who you are here and the points your matches gave you.
// LLM EDIT GUIDE: No "confidence meters", levels, or streaks (brand §5). Show taste + who you clicked with.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { avatarForAlias } from '@/assets/sprites';
import { NavBar } from '@/components/NavBar';
import { Sprite } from '@/components/Sprite';

export default function ProfilePage() {
  const { user } = useAuth();
  const { spendable, lifetimeReceived } = usePoints();
  const alias = user?.anonymousAlias ?? 'you';

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="mx-auto max-w-xl px-5 py-10">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mint-soft/40">
            <Sprite name={avatarForAlias(alias)} size={56} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pine">{alias}</h1>
            <p className="text-pine/50">here, anonymously</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-mint-soft/60 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Sprite name="point_coin" size={22} />
              <span className="text-sm text-pine/60">to spend</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-pine">{spendable}</p>
          </div>
          <div className="rounded-2xl border border-mint-soft/60 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Sprite name="gift_hands" size={22} />
              <span className="text-sm text-pine/60">gifted to you, all-time</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-pine">{lifetimeReceived}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-mint-soft/60 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Sprite name="lock_privacy" size={20} />
            <p className="font-semibold text-pine">No names, ever</p>
          </div>
          <p className="mt-2 text-sm text-pine/60">
            The people you talk to only ever see your chosen name and avatar. That’s the whole idea.
          </p>
        </div>
      </div>
    </div>
  );
}
