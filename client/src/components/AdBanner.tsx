// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/AdBanner.tsx
// DOMAIN:      ads
// CONCEPT:     A single sponsor tile (logo + name pill) used to tile the chat wallpaper
// RELATIONS:   rendered repeatedly by SponsoredWallpaper.tsx
// KEY EXPORTS: AdBanner
// PURPOSE:     One visually-secondary sponsor badge; logo uses object-fit: contain.
// LLM EDIT GUIDE: Keep it low-key (secondary to chat). Click tracking would be added here.
// DAY-OF CHANGES: none here; opacity/density live in SponsoredWallpaper.
// ─────────────────────────────────────────────────────────────────────────

import type { Sponsor } from '@shared/schema';

interface AdBannerProps {
  sponsor: Sponsor;
}

export function AdBanner({ sponsor }: AdBannerProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm">
      {sponsor.logoUrl ? (
        <img
          src={sponsor.logoUrl}
          alt={sponsor.companyName}
          className="h-5 w-auto"
          style={{ objectFit: 'contain' }}
          draggable={false}
        />
      ) : (
        <span className="text-xs font-semibold text-pine/70">{sponsor.companyName}</span>
      )}
    </div>
  );
}
