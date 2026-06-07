// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        shared/domain-vocab.ts
// DOMAIN:      types
// CONCEPT:     Domain vocabulary index — every Buddy term → plain English + where it lives
// RELATIONS:   imported by client + server via @shared/domain-vocab; the Perseus concept map
// KEY EXPORTS: DOMAIN_VOCAB, DomainTerm
// PURPOSE:     One paste-able concept map so any agent (or human) knows what each term means
//              and which files implement it.
// LLM EDIT GUIDE: When you add a domain concept, add an entry here pointing at its files. This is
//                 the file to paste to Claude when a change touches multiple files.
// DAY-OF CHANGES: add an entry for any new feature so the team/agents can find it.
// ─────────────────────────────────────────────────────────────────────────

export interface DomainTerm {
  definition: string;
  implementedIn: string[];
}

export const DOMAIN_VOCAB = {
  GiftPoint: {
    definition: 'A point earned during chat that only the recipient (your match) can redeem, never the earner',
    implementedIn: ['shared/schema.ts#giftPoints', 'server/services/points.ts', 'server/routes/points.ts'],
  },
  MatchSession: {
    definition: 'One anonymous pairing of two users for a text-only chat (waiting → active → ended)',
    implementedIn: ['shared/schema.ts#matchSessions', 'server/services/matchmaking.ts', 'server/routes/match.ts'],
  },
  Matchmaking: {
    definition: 'The algorithm that anonymously pairs two waiting users into a MatchSession',
    implementedIn: ['server/services/matchmaking.ts', 'client/src/hooks/useMatch.ts'],
  },
  ModerationNudge: {
    definition: 'A Claude-generated, gentle in-chat message sent to both users when a guideline risk is detected',
    implementedIn: ['server/services/moderation.ts', 'server/websocket/chatSocket.ts', 'client/src/components/ModerationNudge.tsx'],
  },
  ModerationVerdict: {
    definition: 'The structured result of a Claude screen: clean | flagged, plus the guideline and nudge text',
    implementedIn: ['server/config.ts#RECORD_VERDICT_TOOL', 'server/services/moderation.ts', 'server/types/index.ts'],
  },
  EduCheck: {
    definition: 'Enforcement that only verified .edu (or allowlisted) email domains may use Buddy',
    implementedIn: ['server/middleware/requireEdu.ts', 'server/config.ts#EDU_DOMAIN_ALLOWLIST'],
  },
  AnonymousAlias: {
    definition: 'The playful, non-identifying name shown to a match; also seeds the deterministic avatar sprite',
    implementedIn: ['shared/schema.ts#users.anonymousAlias', 'client/src/pages/OnboardingPage.tsx', 'client/src/components/MatchCard.tsx'],
  },
  SponsoredWallpaper: {
    definition: 'Tiled sponsor logos rendered behind chat bubbles — Buddy\'s primary ad unit and revenue source',
    implementedIn: ['client/src/components/SponsoredWallpaper.tsx', 'client/src/components/AdBanner.tsx', 'server/routes/sponsors.ts'],
  },
  AdImpression: {
    definition: 'One logged render of a sponsor tile, billed at the sponsor CPM rate',
    implementedIn: ['shared/schema.ts#adImpressions', 'server/routes/sponsors.ts'],
  },
  Redemption: {
    definition: 'Spending gift points on a real marketplace item; creates a Stripe PaymentIntent',
    implementedIn: ['shared/schema.ts#redemptions', 'server/routes/marketplace.ts', 'client/src/components/MarketplaceItem.tsx'],
  },
  MarketplaceItem: {
    definition: 'A redeemable gift card listing (merchant, point cost, face value, inventory)',
    implementedIn: ['shared/schema.ts#marketplaceItems', 'client/src/pages/MarketplacePage.tsx'],
  },
  ReplitAuth: {
    definition: 'OIDC login via Replit; upserts the user and provides the verified email for the .edu check',
    implementedIn: ['server/replitAuth.ts', 'client/src/hooks/useAuth.ts', 'server/routes/auth.ts'],
  },
  Storage: {
    definition: 'The IStorage abstraction — every DB read/write goes through it, never raw db calls in routes',
    implementedIn: ['server/storage.ts'],
  },
} as const satisfies Record<string, DomainTerm>;

export type DomainTermName = keyof typeof DOMAIN_VOCAB;
