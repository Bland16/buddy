// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/pages/OnboardingPage.tsx
// DOMAIN:      ui
// CONCEPT:     Post-auth onboarding — pick an alias + which conversations you're into
// RELATIONS:   PATCHes /api/auth/onboarding; refreshes useAuth so the gate opens
// KEY EXPORTS: OnboardingPage (default)
// PURPOSE:     Frame setup as taste/curiosity, never "social goals" (brand voice).
// LLM EDIT GUIDE: Vibe options + header copy in config.ts. conversationTastes are collected but only
//                 sent for future matchmaking use — wire them to a column when ready.
// DAY-OF CHANGES: onboarding copy + vibe options (config.ts).
// ─────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CONFIG } from '@/config';
import { apiRequest } from '@/lib/queryClient';
import { BuddyAnim } from '@/components/BuddyAnim';

// A few playful alias suggestions to lower the blank-field friction.
const ALIAS_IDEAS = ['quiet_spark', 'midnight_owl', 'paper_planet', 'soft_thunder', 'lemon_static', 'velvet_comet'];

export default function OnboardingPage() {
  const qc = useQueryClient();
  const [alias, setAlias] = useState('');
  const [vibes, setVibes] = useState<string[]>([]);

  const finish = useMutation({
    mutationFn: () =>
      apiRequest('PATCH', CONFIG.API_ROUTES.onboarding, {
        anonymousAlias: alias.trim(),
        conversationTastes: vibes,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONFIG.API_ROUTES.authUser] }),
  });

  function toggleVibe(v: string) {
    setVibes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-10">
      <BuddyAnim animation="buddy-shy" size={96} className="mb-6" />

      <label className="text-sm font-semibold text-pine/70">{CONFIG.COPY.onboardingAliasLabel}</label>
      <input
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
        placeholder="something you'd answer to"
        className="mt-2 rounded-2xl border border-mint-soft bg-white px-4 py-3 text-pine outline-none placeholder:text-pine/40 focus:border-mint"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {ALIAS_IDEAS.map((idea) => (
          <button
            key={idea}
            onClick={() => setAlias(idea)}
            className="rounded-full border border-mint-soft px-3 py-1 text-sm text-pine/70 transition hover:bg-mint-soft/30"
          >
            {idea}
          </button>
        ))}
      </div>

      <h2 className="mt-8 text-2xl font-bold text-pine">{CONFIG.COPY.onboardingHeader}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {CONFIG.COPY.onboardingVibes.map((v) => {
          const on = vibes.includes(v);
          return (
            <button
              key={v}
              onClick={() => toggleVibe(v)}
              className={`rounded-2xl border px-4 py-3 text-left font-medium transition ${
                on ? 'border-mint bg-mint-soft/30 text-pine' : 'border-mint-soft/60 bg-white text-pine/70 hover:border-mint'
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => finish.mutate()}
        disabled={!alias.trim() || finish.isPending}
        className="mt-8 rounded-full bg-mint px-8 py-3.5 text-lg font-semibold text-white shadow-soft transition hover:bg-mint-deep disabled:opacity-40"
      >
        {finish.isPending ? 'Setting up…' : CONFIG.COPY.onboardingCta}
      </button>
    </div>
  );
}
