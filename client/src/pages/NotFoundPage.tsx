// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/pages/NotFoundPage.tsx
// DOMAIN:      ui
// CONCEPT:     wouter fallback route for unknown paths
// RELATIONS:   default Route in App.tsx
// KEY EXPORTS: NotFoundPage (default)
// PURPOSE:     A friendly, low-key 404.
// LLM EDIT GUIDE: Keep copy warm and short (brand voice). One way back home.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { Link } from 'wouter';
import { BuddyAnim } from '@/components/BuddyAnim';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <BuddyAnim animation="buddy-think" size={104} />
      <h1 className="mt-6 text-2xl font-bold text-pine">Nothing here.</h1>
      <p className="mt-2 text-pine/60">That page wandered off.</p>
      <Link to="/" className="mt-6 rounded-full bg-mint px-6 py-2.5 font-semibold text-white transition hover:bg-mint-deep">
        Back to talking
      </Link>
    </div>
  );
}
