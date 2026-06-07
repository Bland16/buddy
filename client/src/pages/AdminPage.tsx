// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/pages/AdminPage.tsx
// DOMAIN:      admin
// CONCEPT:     Operator console — sponsors, moderation logs, inventory, and tunables
// RELATIONS:   queries /api/admin/* + /api/admin/sponsors; uses AdminTable + gear-sync animation
// KEY EXPORTS: AdminPage (default)
// PURPOSE:     Lets admins manage sponsors, review moderation, and see inventory/settings.
// LLM EDIT GUIDE: All endpoints here require admin (server enforces). Add a tab by adding a section.
// DAY-OF CHANGES: none here; the point-drop rate itself is POINT_DROP_RATE in server/config.ts.
// ─────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Sponsor, ModerationLog, MarketplaceItem } from '@shared/schema';
import { CONFIG } from '@/config';
import { apiRequest } from '@/lib/queryClient';
import { NavBar } from '@/components/NavBar';
import { AdminTable, type Column } from '@/components/AdminTable';
import { BuddyAnim } from '@/components/BuddyAnim';

type Tab = 'sponsors' | 'moderation' | 'inventory' | 'settings';

interface Settings {
  pointDropRate: number;
  claudeModel: string;
  eduAllowlist: string[];
  maxMessagesPerSession: number;
}

export default function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('sponsors');

  const sponsorsQ = useQuery<{ sponsors: Sponsor[] }>({ queryKey: [CONFIG.API_ROUTES.adminSponsors] });
  const logsQ = useQuery<{ logs: ModerationLog[] }>({ queryKey: [CONFIG.API_ROUTES.adminModerationLogs] });
  const inventoryQ = useQuery<{ items: MarketplaceItem[] }>({ queryKey: [CONFIG.API_ROUTES.adminInventory] });
  const settingsQ = useQuery<Settings>({ queryKey: [CONFIG.API_ROUTES.adminSettings] });

  const [newSponsor, setNewSponsor] = useState({ companyName: '', cpmRateUsd: '2.50' });
  const createSponsor = useMutation({
    mutationFn: () =>
      apiRequest('POST', CONFIG.API_ROUTES.adminSponsors, {
        companyName: newSponsor.companyName,
        cpmRateUsd: newSponsor.cpmRateUsd,
        logoUrl: `https://placehold.co/120x48/5FBF86/FFFFFF?text=${encodeURIComponent(newSponsor.companyName)}`,
        active: true,
        impressionCount: 0,
      }),
    onSuccess: () => {
      setNewSponsor({ companyName: '', cpmRateUsd: '2.50' });
      qc.invalidateQueries({ queryKey: [CONFIG.API_ROUTES.adminSponsors] });
    },
  });
  const toggleSponsor = useMutation({
    mutationFn: (s: Sponsor) => apiRequest('PATCH', `${CONFIG.API_ROUTES.adminSponsors}/${s.id}`, { active: !s.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONFIG.API_ROUTES.adminSponsors] }),
  });

  const sponsorCols: Column<Sponsor>[] = [
    { key: 'companyName', header: 'Sponsor' },
    { key: 'cpmRateUsd', header: 'CPM', render: (s) => `$${Number(s.cpmRateUsd).toFixed(2)}` },
    { key: 'impressionCount', header: 'Impressions' },
    {
      key: 'active',
      header: 'Status',
      render: (s) => (
        <button
          onClick={() => toggleSponsor.mutate(s)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${s.active ? 'bg-mint-soft/50 text-pine' : 'bg-pine/10 text-pine/60'}`}
        >
          {s.active ? 'active' : 'paused'}
        </button>
      ),
      sortable: false,
    },
  ];

  const logCols: Column<ModerationLog>[] = [
    { key: 'verdict', header: 'Verdict', render: (l) => (
      <span className={l.verdict === 'flagged' ? 'font-semibold text-mint-deep' : 'text-pine/60'}>{l.verdict}</span>
    ) },
    { key: 'guidelineTriggered', header: 'Guideline', render: (l) => l.guidelineTriggered ?? '—' },
    { key: 'messageExcerpt', header: 'Excerpt' },
    { key: 'sessionId', header: 'Session' },
  ];

  const itemCols: Column<MarketplaceItem>[] = [
    { key: 'merchantName', header: 'Item' },
    { key: 'pointCost', header: 'Points' },
    { key: 'faceValueUsd', header: 'Value', render: (i) => `$${Number(i.faceValueUsd).toFixed(2)}` },
    { key: 'inventoryCount', header: 'In stock' },
    { key: 'active', header: 'Active', render: (i) => (i.active ? 'yes' : 'no') },
  ];

  const saving = createSponsor.isPending || toggleSponsor.isPending;

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-pine">Admin</h1>
          {saving && <BuddyAnim animation="gear-sync" size={28} />}
        </div>

        <div className="mt-5 flex gap-2">
          {(['sponsors', 'moderation', 'inventory', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
                tab === t ? 'bg-mint text-white' : 'bg-white text-pine/70 hover:bg-mint-soft/30'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'sponsors' && (
            <>
              <div className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border border-mint-soft/60 bg-white p-4 shadow-soft">
                <div className="flex flex-col">
                  <label className="text-xs text-pine/60">Company</label>
                  <input
                    value={newSponsor.companyName}
                    onChange={(e) => setNewSponsor((s) => ({ ...s, companyName: e.target.value }))}
                    className="rounded-lg border border-mint-soft px-3 py-2 outline-none focus:border-mint"
                    placeholder="e.g. Notion"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-pine/60">CPM ($)</label>
                  <input
                    value={newSponsor.cpmRateUsd}
                    onChange={(e) => setNewSponsor((s) => ({ ...s, cpmRateUsd: e.target.value }))}
                    className="w-24 rounded-lg border border-mint-soft px-3 py-2 outline-none focus:border-mint"
                  />
                </div>
                <button
                  onClick={() => createSponsor.mutate()}
                  disabled={!newSponsor.companyName.trim() || createSponsor.isPending}
                  className="rounded-full bg-mint px-5 py-2 font-semibold text-white transition hover:bg-mint-deep disabled:opacity-40"
                >
                  Add sponsor
                </button>
              </div>
              <AdminTable columns={sponsorCols} rows={sponsorsQ.data?.sponsors ?? []} empty="No sponsors yet." />
            </>
          )}

          {tab === 'moderation' && (
            <AdminTable columns={logCols} rows={logsQ.data?.logs ?? []} empty="No moderation activity yet." />
          )}

          {tab === 'inventory' && (
            <AdminTable columns={itemCols} rows={inventoryQ.data?.items ?? []} empty="No marketplace items." />
          )}

          {tab === 'settings' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SettingCard label="Point drop rate" value={settingsQ.data ? `${(settingsQ.data.pointDropRate * 100).toFixed(0)}%` : '…'} hint="server/config.ts → POINT_DROP_RATE" />
              <SettingCard label="Moderation model" value={settingsQ.data?.claudeModel ?? '…'} hint="server/config.ts → CLAUDE_MODEL" />
              <SettingCard label="Allowed domains" value={settingsQ.data?.eduAllowlist.join(', ') ?? '…'} hint="server/config.ts → EDU_DOMAIN_ALLOWLIST" />
              <SettingCard label="Max messages / session" value={String(settingsQ.data?.maxMessagesPerSession ?? '…')} hint="server/config.ts → MAX_MESSAGES_PER_SESSION" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-mint-soft/60 bg-white p-5 shadow-soft">
      <p className="text-sm text-pine/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-pine">{value}</p>
      <p className="mt-2 text-xs text-pine/40">{hint}</p>
    </div>
  );
}
