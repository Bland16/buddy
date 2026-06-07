// ── PERSEUS GRAPH NODE ────────────────────────────────────────────────────
// FILE:        client/src/components/AdminTable.tsx
// DOMAIN:      admin
// CONCEPT:     A generic, lightly-sortable data table for the Admin page
// RELATIONS:   used by AdminPage for moderation logs, inventory, and sponsors
// KEY EXPORTS: AdminTable, type Column
// PURPOSE:     Render any row[] given a column spec; click a header to sort.
// LLM EDIT GUIDE: Keep it generic — pass columns with a `render` for custom cells. No business logic.
// DAY-OF CHANGES: none expected.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}

export function AdminTable<T extends Record<string, unknown>>({ columns, rows, empty = 'Nothing here yet.' }: AdminTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey as keyof T];
      const bv = b[sortKey as keyof T];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return asc ? cmp : -cmp;
    });
  }, [rows, sortKey, asc]);

  function toggleSort(key: string) {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-mint-soft/60 bg-white shadow-soft">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-mint-soft/50 text-pine/60">
            {columns.map((c) => (
              <th
                key={String(c.key)}
                onClick={() => c.sortable !== false && toggleSort(String(c.key))}
                className={`px-4 py-3 font-semibold ${c.sortable !== false ? 'cursor-pointer select-none hover:text-pine' : ''}`}
              >
                {c.header}
                {sortKey === c.key ? (asc ? ' ↑' : ' ↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-pine/50">
                {empty}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={i} className="border-b border-mint-soft/20 last:border-0">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-4 py-3 text-pine">
                    {c.render ? c.render(row) : String(row[c.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
