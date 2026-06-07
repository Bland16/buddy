// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/hooks/usePoints.ts
// DOMAIN:      points
// CONCEPT:     The user's gift-point balance (spendable + lifetime received)
// RELATIONS:   queries /api/points; used by PointsDisplay, MarketplacePage, ProfilePage
// KEY EXPORTS: usePoints
// PURPOSE:     Returns the balance and a refetch so a point drop can refresh it live.
// LLM EDIT GUIDE: Drops arrive over the socket (useChat); call refetch() on a drop to update.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { CONFIG } from '@/config';

interface PointsResponse {
  spendable: number;
  lifetimeReceived: number;
}

export function usePoints() {
  const query = useQuery<PointsResponse>({
    queryKey: [CONFIG.API_ROUTES.points],
    staleTime: 10_000,
  });

  return {
    spendable: query.data?.spendable ?? 0,
    lifetimeReceived: query.data?.lifetimeReceived ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
