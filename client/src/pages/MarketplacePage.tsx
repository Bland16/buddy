// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/pages/MarketplacePage.tsx
// DOMAIN:      marketplace
// CONCEPT:     Browse + redeem gift cards with the points your matches gave you
// RELATIONS:   queries /api/marketplace; redeems via /api/redeem; uses usePoints
// KEY EXPORTS: MarketplacePage (default)
// PURPOSE:     Shows the spendable balance and a grid of redeemable items.
// LLM EDIT GUIDE: Redeem logic posts to /api/redeem; on success refetch points + items. Copy in config.ts.
// DAY-OF CHANGES: marketplace copy (config.ts).
// ─────────────────────────────────────────────────────────────────────────

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MarketplaceItem as Item } from '@shared/schema';
import { CONFIG } from '@/config';
import { apiRequest } from '@/lib/queryClient';
import { usePoints } from '@/hooks/usePoints';
import { NavBar } from '@/components/NavBar';
import { MarketplaceItem } from '@/components/MarketplaceItem';
import { Sprite } from '@/components/Sprite';

export default function MarketplacePage() {
  const qc = useQueryClient();
  const { spendable, refetch } = usePoints();
  const { data, isLoading } = useQuery<{ items: Item[] }>({
    queryKey: [CONFIG.API_ROUTES.marketplace],
  });

  async function handleRedeem(item: Item) {
    await apiRequest('POST', CONFIG.API_ROUTES.redeem, { itemId: item.id });
    await Promise.all([refetch(), qc.invalidateQueries({ queryKey: [CONFIG.API_ROUTES.marketplace] })]);
  }

  const items = data?.items ?? [];

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-pine">{CONFIG.COPY.marketplaceTitle}</h1>
            <p className="mt-1 text-pine/60">{CONFIG.COPY.marketplaceSub}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-soft">
            <Sprite name="point_stack" size={24} />
            <span className="text-lg font-bold text-pine">{spendable}</span>
            <span className="text-sm text-pine/50">to spend</span>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-10 text-center text-pine/50">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-10 text-center text-pine/50">Nothing to redeem just yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <MarketplaceItem key={item.id} item={item} balance={spendable} onRedeem={handleRedeem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
