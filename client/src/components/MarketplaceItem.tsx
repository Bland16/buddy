// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/MarketplaceItem.tsx
// DOMAIN:      marketplace
// CONCEPT:     A single gift-card card with a redeem action (success plays a celebration)
// RELATIONS:   rendered by MarketplacePage; calls /api/redeem; uses buddy-celebrate + redeem_seal
// KEY EXPORTS: MarketplaceItem
// PURPOSE:     Shows merchant, point cost, face value, inventory, and a redeem button.
// LLM EDIT GUIDE: Disable redeem when balance < cost or inventory is 0. Copy from config.ts.
// DAY-OF CHANGES: none here; add a category badge if items gain categories.
// ─────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import type { MarketplaceItem as Item } from '@shared/schema';
import { Sprite } from './Sprite';
import { BuddyAnim } from './BuddyAnim';

interface MarketplaceItemProps {
  item: Item;
  balance: number;
  onRedeem: (item: Item) => Promise<void>;
}

/** Pick a themed sprite for a merchant (coffee for Starbucks, else a generic gift card). */
function iconFor(merchant: string): 'coffee_cup' | 'gift_card' {
  return /starbucks|coffee|cafe/i.test(merchant) ? 'coffee_cup' : 'gift_card';
}

export function MarketplaceItem({ item, balance, onRedeem }: MarketplaceItemProps) {
  const [state, setState] = useState<'idle' | 'redeeming' | 'done'>('idle');
  const affordable = balance >= item.pointCost;
  const inStock = item.inventoryCount > 0;
  const canRedeem = affordable && inStock && state === 'idle';

  async function handle() {
    if (!canRedeem) return;
    setState('redeeming');
    try {
      await onRedeem(item);
      setState('done');
    } catch {
      setState('idle');
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-mint-soft/60 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint-soft/30">
          {state === 'done' ? <Sprite name="redeem_seal" size={32} /> : <Sprite name={iconFor(item.merchantName)} size={32} />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-pine">{item.merchantName}</p>
          <p className="text-sm text-pine/60">${Number(item.faceValueUsd).toFixed(2)} value</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-sm font-semibold text-pine">
          <Sprite name="point_coin" size={18} />
          {item.pointCost}
        </span>
        {!inStock ? (
          <span className="text-sm text-pine/50">Sold out</span>
        ) : state === 'done' ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-mint-deep">
            <BuddyAnim animation="buddy-celebrate" size={28} /> On its way
          </span>
        ) : (
          <button
            onClick={handle}
            disabled={!canRedeem}
            className="rounded-full bg-mint px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-mint-deep disabled:opacity-40"
          >
            {state === 'redeeming' ? '…' : affordable ? 'Redeem' : 'Not yet'}
          </button>
        )}
      </div>
    </div>
  );
}
