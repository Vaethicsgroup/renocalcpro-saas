"use client";
// components/help/HelpSearch.tsx — Recherche fuzzy client-side dans les articles.

import { useMemo, useState } from "react";
import Link from "next/link";

interface Article { slug: string; title: string; summary: string; category: string }

export function HelpSearch({ articles, placeholder }: { articles: Article[]; placeholder: string }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    if (!q.trim() || q.length < 2) return [];
    const ql = q.toLowerCase();
    return articles
      .map(a => ({
        a,
        score:
          (a.title.toLowerCase().includes(ql) ? 10 : 0) +
          (a.summary.toLowerCase().includes(ql) ? 5 : 0) +
          (a.category.toLowerCase().includes(ql) ? 2 : 0) +
          // Fuzzy : compte les mots de la requête présents dans title+summary
          ql.split(/\s+/).filter(w => w.length > 1 && (a.title + " " + a.summary).toLowerCase().includes(w)).length,
      }))
      .filter(({ score }) => score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, 8)
      .map(({ a }) => a);
  }, [q, articles]);

  return (
    <div className="relative">
      <input
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border-2 border-stone-200 bg-white px-5 py-3 text-base shadow-sm focus-visible:border-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
      />
      {results.length > 0 && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-10 mt-2 max-h-96 overflow-auto rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          {results.map(a => (
            <li key={a.slug}>
              <Link
                href={`/help/${a.slug}`}
                className="block rounded-lg p-3 transition hover:bg-teal-50"
              >
                <span className="font-medium text-stone-900">{a.title}</span>
                <span className="mt-0.5 block text-xs text-stone-600">{a.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
