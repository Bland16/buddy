// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/pages/LandingPage.tsx
// DOMAIN:      ui
// CONCEPT:     The signed-out landing — logo, headline, and the single "Start talking" action
// RELATIONS:   links to /api/login (Replit Auth or dev fake-login); uses buddy-wave greeting
// KEY EXPORTS: LandingPage (default)
// PURPOSE:     One calm, type-forward screen with exactly one obvious thing to do.
// LLM EDIT GUIDE: Copy lives in config.ts (brand voice). One action only — don't add clutter.
// DAY-OF CHANGES: headline/sub/CTA copy (config.ts).
// ─────────────────────────────────────────────────────────────────────────

import { CONFIG } from '@/config';
import { BuddyAnim } from '@/components/BuddyAnim';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* faint plaid accent band, never behind body text */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-plaid opacity-60" aria-hidden />

      <BuddyAnim animation="buddy-wave" size={132} />
      <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight text-pine sm:text-5xl">
        {CONFIG.COPY.landingHeadline}
      </h1>
      <p className="mt-4 max-w-sm text-lg text-pine/60">{CONFIG.COPY.landingSub}</p>

      <a
        href={CONFIG.API_ROUTES.login}
        className="mt-8 rounded-full bg-mint px-8 py-3.5 text-lg font-semibold text-white shadow-soft transition hover:bg-mint-deep"
      >
        {CONFIG.COPY.landingCta}
      </a>

      <p className="mt-6 text-sm text-pine/40">Sign in with your .edu email. No names shown to anyone.</p>
    </div>
  );
}
