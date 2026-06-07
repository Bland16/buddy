// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/pages/MatchWaitingPage.tsx
// DOMAIN:      matchmaking
// CONCEPT:     The home/matchmaking screen — start, wait (searching + sleepy), then enter chat
// RELATIONS:   uses useMatch (join + poll); navigates to /chat/:sessionId on a pairing
// KEY EXPORTS: MatchWaitingPage (default)
// PURPOSE:     Turns "I want to talk" into an active chat with one tap.
// LLM EDIT GUIDE: Pairing is server-side; this page polls match/current until status==='active'.
//                 Copy from config.ts. Don't say "practice partner".
// DAY-OF CHANGES: waiting copy (config.ts); poll cadence (useMatch).
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CONFIG } from '@/config';
import { useMatch } from '@/hooks/useMatch';
import { NavBar } from '@/components/NavBar';
import { BuddyAnim } from '@/components/BuddyAnim';

export default function MatchWaitingPage() {
  const [, navigate] = useLocation();
  const [waiting, setWaiting] = useState(false);
  const { match, join, leave } = useMatch({ poll: waiting });

  // When a pairing goes active, slide into the chat.
  useEffect(() => {
    if (waiting && match?.status === 'active') {
      navigate(`/chat/${match.id}`);
    }
  }, [waiting, match?.status, match?.id, navigate]);

  function start() {
    setWaiting(true);
    join.mutate();
  }

  function cancel() {
    setWaiting(false);
    leave.mutate();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {!waiting ? (
          <>
            <BuddyAnim animation="buddy-idle" size={120} />
            <h1 className="mt-6 text-3xl font-bold text-pine">Talk to someone new?</h1>
            <p className="mt-3 max-w-sm text-pine/60">{CONFIG.COPY.landingSub}</p>
            <button
              onClick={start}
              className="mt-8 rounded-full bg-mint px-8 py-3.5 text-lg font-semibold text-white shadow-soft transition hover:bg-mint-deep"
            >
              {CONFIG.COPY.landingCta}
            </button>
          </>
        ) : (
          <>
            <BuddyAnim animation="searching" size={96} />
            <div className="mt-2">
              <BuddyAnim animation="buddy-sleepy" size={88} />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-pine">{CONFIG.COPY.matchingTitle}</h1>
            <p className="mt-2 text-pine/50">Hang tight — there’s always someone around.</p>
            <button
              onClick={cancel}
              className="mt-8 rounded-full border border-mint-soft px-6 py-2.5 font-semibold text-pine/70 transition hover:bg-mint-soft/30"
            >
              Never mind
            </button>
          </>
        )}
      </div>
    </div>
  );
}
