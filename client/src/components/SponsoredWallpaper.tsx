// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/SponsoredWallpaper.tsx
// DOMAIN:      ads
// CONCEPT:     Tiled sponsor logos behind chat — Buddy's primary ad unit + revenue source
// RELATIONS:   fetches /api/sponsors; renders AdBanner tiles; logs /api/ad-impressions on mount
// KEY EXPORTS: SponsoredWallpaper
// PURPOSE:     A faint, repeating grid of sponsor badges behind the message list (CPM logged).
// LLM EDIT GUIDE: Stays visually secondary (low opacity, behind bubbles). One impression per visible
//                 sponsor per mount. Opacity + density are the tunables below.
// DAY-OF CHANGES: TILE_DENSITY, AD_WALLPAPER_OPACITY (config.ts).
// ─────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Sponsor } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { CONFIG } from '@/config';
import { AdBanner } from './AdBanner';

interface SponsoredWallpaperProps {
  sessionId: number | null;
}

const TILE_DENSITY = 24; // DAY-OF CHANGE: number of tiles in the repeating grid

export function SponsoredWallpaper({ sessionId }: SponsoredWallpaperProps) {
  const { data } = useQuery<{ sponsors: Sponsor[] }>({
    queryKey: [CONFIG.API_ROUTES.sponsors],
    enabled: CONFIG.FEATURE_FLAGS.ENABLE_ADS,
  });
  const sponsors = data?.sponsors ?? [];

  // Log one CPM impression per visible sponsor when the wallpaper mounts.
  useEffect(() => {
    if (!CONFIG.FEATURE_FLAGS.ENABLE_ADS || sponsors.length === 0) return;
    sponsors.forEach((s) => {
      apiRequest('POST', CONFIG.API_ROUTES.adImpressions, { sponsorId: s.id, sessionId }).catch(() => undefined);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sponsors.length, sessionId]);

  if (!CONFIG.FEATURE_FLAGS.ENABLE_ADS || sponsors.length === 0) return null;

  const tiles = Array.from({ length: TILE_DENSITY }, (_, i) => sponsors[i % sponsors.length]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: CONFIG.AD_WALLPAPER_OPACITY }} // DAY-OF CHANGE: soften/strengthen
    >
      <div className="flex h-full w-full flex-wrap content-start gap-6 p-6">
        {tiles.map((s, i) => (
          <AdBanner key={`${s.id}-${i}`} sponsor={s} />
        ))}
      </div>
    </div>
  );
}
