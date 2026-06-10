"use client";
// components/admin/DataTable.tsx — Table générique sortable + filterable + paginée.

import { useMemo, useState } from "react";

export interface DataTableColumn<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  pageSize?: number;
  searchableFields?: (keyof T & string)[];
  emptyLabel?: string;
}

export function DataTable<T extends { id: string }>({
  rows, columns, pageSize = 50, searchableFields, emptyLabel = "Aucun résultat",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim() || !searchableFields?.length) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(r =>
      searchableFields.some(f => String(r[f] ?? "").toLowerCase().includes(q)),
    );
  }, [rows, search, searchableFields]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey as keyof T] as unknown as string | number;
      const bv = b[sortKey as keyof T] as unknown as string | number;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(k: string) {
    if (sortKey === k) setSortAsc(!sortAsc);
    else { setSortKey(k); setSortAsc(true); }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {searchableFields && (
        <div className="border-b border-stone-100 p-3">
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher…"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
            aria-label="Recherche"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50">
            <tr>
              {columns.map(c => (
                <th
                  key={c.key}
                  scope="col"
                  style={c.width ? { width: c.width } : undefined}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-600 ${c.sortable ? "cursor-pointer hover:bg-stone-100" : ""}`}
                  onClick={() => c.sortable && toggleSort(c.key)}
                  aria-sort={sortKey === c.key ? (sortAsc ? "ascending" : "descending") : undefined}
                >
                  {c.label}
                  {c.sortable && sortKey === c.key && <span aria-hidden className="ml-1">{sortAsc ? "↑" : "↓"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {pageRows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-stone-500">{emptyLabel}</td></tr>
            ) : pageRows.map(row => (
              <tr key={row.id} className="hover:bg-stone-50">
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-3 text-stone-800">
                    {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-100 px-4 py-3 text-xs text-stone-600">
          <span>{sorted.length} résultat{sorted.length > 1 ? "s" : ""} · page {page + 1} / {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded px-3 py-1 hover:bg-stone-100 disabled:opacity-40">← Précédent</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded px-3 py-1 hover:bg-stone-100 disabled:opacity-40">Suivant →</button>
          </div>
        </div>
      )}
    </div>
  );
}
