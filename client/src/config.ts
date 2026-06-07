// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/config.ts
// DOMAIN:      config
// CONCEPT:     All client-side constants — brand tokens, feature flags, UI copy, API route map
// RELATIONS:   read across pages/components/hooks; API_ROUTES used by lib/queryClient.ts
// KEY EXPORTS: CONFIG
// PURPOSE:     One typed place for every client tunable + the user-facing copy (brand voice).
// LLM EDIT GUIDE: Copy strings live HERE and must follow BUDDY_BRAND_AESTHETIC.md (warm, low-key,
//                 banned vocab: practice/confidence/skills/shy/awkward/introvert/community/safe space).
// DAY-OF CHANGES: FEATURE_FLAGS, POINT_DROP_RATE (display), AD_WALLPAPER_OPACITY, COPY strings.
// ─────────────────────────────────────────────────────────────────────────

export const CONFIG = {
  APP_NAME: 'Buddy',
  TAGLINE: 'Meet your kind of person.',

  // Brand palette — mirrored in tailwind.config.ts + index.css :root vars. Keep all three in sync.
  PRIMARY_COLOR: '#5FBF86', // mint — the single brand color
  ACCENT_COLOR: '#3E9B68', // deep green — small accents only
  BG_COLOR: '#F4FAF6', // off-white canvas
  TEXT_COLOR: '#1F4A36', // pine green

  // DAY-OF CHANGE: flip features on/off for the demo without touching code paths.
  FEATURE_FLAGS: {
    ENABLE_AUTH: true, // DAY-OF CHANGE
    ENABLE_MODERATION: true, // DAY-OF CHANGE
    ENABLE_ADS: true, // DAY-OF CHANGE
    ENABLE_MARKETPLACE: true, // DAY-OF CHANGE
  },

  // Display only — the authoritative drop rate lives server-side (server/config.ts).
  POINT_DROP_RATE: 0.08, // DAY-OF CHANGE: increase to make points more common
  MAX_CHAT_DURATION_MINUTES: 30, // DAY-OF CHANGE
  AD_WALLPAPER_OPACITY: 0.35, // DAY-OF CHANGE: soften/strengthen the sponsor wallpaper
  CPM_RATE_USD: 2.5, // DAY-OF CHANGE: shown in admin revenue math

  // Logical name → /api path. apiRequest() and useQuery keys reference these.
  API_ROUTES: {
    authUser: '/api/auth/user',
    login: '/api/login',
    logout: '/api/logout',
    matchJoin: '/api/match/join',
    matchLeave: '/api/match/leave',
    matchCurrent: '/api/match/current',
    chatHistory: (sessionId: number) => `/api/chat/${sessionId}/history`,
    points: '/api/points',
    marketplace: '/api/marketplace',
    redeem: '/api/redeem',
    sponsors: '/api/sponsors',
    adImpressions: '/api/ad-impressions',
    onboarding: '/api/auth/onboarding', // PATCH to set alias + finish onboarding
    adminModerationLogs: '/api/admin/moderation-logs',
    adminInventory: '/api/admin/inventory',
    adminSettings: '/api/admin/settings',
    adminSponsors: '/api/admin/sponsors',
  },

  // ── User-facing copy (brand voice — warm & low-key) ──
  COPY: {
    landingHeadline: 'Meet your kind of person.',
    landingSub: 'No names, no pressure. Just talk to someone and see who you click with.',
    landingCta: 'Start talking',
    onboardingHeader: 'What kind of conversations are you into?',
    onboardingAliasLabel: 'Pick a name to go by',
    onboardingVibes: ['deep dives', 'easy banter', 'niche obsessions', 'anything, honestly'],
    onboardingCta: 'All set',
    matchingTitle: 'Finding someone to talk to…',
    matchFound: 'You’re in. Say anything.',
    chatEmpty: 'Say anything. There’s no wrong opener here.',
    chatPlaceholder: 'Type something…',
    nudgeDefault: "Quick one — let's keep names, numbers, and socials out of it. All good to keep going?",
    pointDrop: (alias: string) => `You picked up a gift point — it’s for ${alias} to spend, not you.`,
    marketplaceTitle: 'Points your matches gave you',
    marketplaceSub: 'Spend them on something real.',
    notEnoughPoints: 'Not enough points yet — your matches give you these.',
    redeemSuccess: 'Done. That’s on the way.',
    profileTitle: 'You, lately',
    sendError: 'That didn’t send — try again?',
  },
} as const;

export type ApiRoutes = typeof CONFIG.API_ROUTES;
