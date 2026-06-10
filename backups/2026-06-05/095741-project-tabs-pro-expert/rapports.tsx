// app/[locale]/o/projects/[id]/rapports/page.tsx — Documents v2
"use client";

import { useState } from "react";
import {
  FileText, Upload, Download, Eye, Trash2, Search, Camera, ClipboardList,
  Receipt, ShieldCheck, FileType2, Image as ImageIcon, Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface Doc {
  id: string;
  name: string;
  category: "RAPPORT" | "PHOTO" | "DEVIS" | "ATTESTATION" | "PLAN" | "FACTURE";
  size: string;
  uploadedAt: string;
  format: string;
}

const SAMPLE_DOCS: Doc[] = [
  { id: "d1", name: "Rapport audit énergétique v2.pdf", category: "RAPPORT", size: "4,2 Mo", uploadedAt: "2026-05-22", format: "PDF" },
  { id: "d2", name: "Audit thermique simulation.xlsx", category: "RAPPORT", size: "1,8 Mo", uploadedAt: "2026-05-21", format: "XLSX" },
  { id: "d3", name: "Photo façade sud.jpg", category: "PHOTO", size: "3,5 Mo", uploadedAt: "2026-05-18", format: "JPG" },
  { id: "d4", name: "Photo combles.jpg", category: "PHOTO", size: "2,9 Mo", uploadedAt: "2026-05-18", format: "JPG" },
  { id: "d5", name: "Photo chaudière existante.jpg", category: "PHOTO", size: "1,4 Mo", uploadedAt: "2026-05-18", format: "JPG" },
  { id: "d6", name: "Plan cadastral.pdf", category: "PLAN", size: "850 Ko", uploadedAt: "2026-05-15", format: "PDF" },
  { id: "d7", name: "Plans intérieur RDC + R+1.pdf", category: "PLAN", size: "2,1 Mo", uploadedAt: "2026-05-15", format: "PDF" },
  { id: "d8", name: "Devis ITE Façades 13 Provence.pdf", category: "DEVIS", size: "320 Ko", uploadedAt: "2026-05-25", format: "PDF" },
  { id: "d9", name: "Devis PAC Sud Énergie.pdf", category: "DEVIS", size: "280 Ko", uploadedAt: "2026-05-26", format: "PDF" },
  { id: "d10", name: "Attestation RGE QualiPAC.pdf", category: "ATTESTATION", size: "180 Ko", uploadedAt: "2026-05-26", format: "PDF" },
  { id: "d11", name: "Facture gaz 2024.pdf", category: "FACTURE", size: "240 Ko", uploadedAt: "2026-05-20", format: "PDF" },
  { id: "d12", name: "Avis MaPrimeRénov' Anah.pdf", category: "ATTESTATION", size: "190 Ko", uploadedAt: "2026-06-02", format: "PDF" },
];

const META: Record<Doc["category"], { label: string; Icon: typeof FileText; color: string }> = {
  RAPPORT: { label: "Rapport", Icon: ClipboardList, color: "bg-forest-100 text-forest-700" },
  PHOTO: { label: "Photo", Icon: Camera, color: "bg-info-100 text-info-700" },
  DEVIS: { label: "Devis", Icon: Receipt, color: "bg-amber-100 text-amber-700" },
  ATTESTATION: { label: "Attestation", Icon: ShieldCheck, color: "bg-night-100 text-night-700" },
  PLAN: { label: "Plan", Icon: Building2, color: "bg-stone-100 text-stone-700" },
  FACTURE: { label: "Facture", Icon: Receipt, color: "bg-terracotta-100 text-terracotta-700" },
};

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Doc["category"] | "ALL">("ALL");

  const filtered = SAMPLE_DOCS.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== "ALL" && d.category !== filter) return false;
    return true;
  });

  const counts = (Object.keys(META) as Doc["category"][]).reduce(
    (acc, c) => ({ ...acc, [c]: SAMPLE_DOCS.filter((d) => d.category === c).length }),
    {} as Record<Doc["category"], number>,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
            Documents du dossier
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {SAMPLE_DOCS.length} documents · rapports, photos, devis, attestations, plans, factures.
          </p>
        </div>
        <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white hover:bg-forest-800">
          <Upload className="h-4 w-4" />
          Importer un document
        </button>
      </div>

      {/* Stats catégories */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {(Object.keys(META) as Doc["category"][]).map((c) => {
          const m = META[c];
          const Icon = m.Icon;
          const isActive = filter === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(isActive ? "ALL" : c)}
              className={[
                "flex items-center gap-2 rounded-lg border p-3 text-left transition-colors",
                isActive ? "border-forest-500 bg-white" : "border-cream-200 bg-white hover:border-forest-300",
              ].join(" ")}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.color}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{m.label}</p>
                <p className="font-serif text-lg font-bold text-forest-900 leading-tight">{counts[c]}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un document…"
              className="h-9 w-full rounded-md border border-cream-300 pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-cream-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                <th className="px-4 py-3 text-left">Document</th>
                <th className="hidden px-3 py-3 text-center md:table-cell">Catégorie</th>
                <th className="hidden px-3 py-3 text-right md:table-cell">Taille</th>
                <th className="px-3 py-3 text-right">Date</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {filtered.map((d) => {
                const m = META[d.category];
                const FormatIcon = d.format === "JPG" ? ImageIcon : FileType2;
                return (
                  <tr key={d.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${m.color}`}>
                          <FormatIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-forest-900">{d.name}</p>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500">{d.format}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 text-center md:table-cell">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${m.color}`}>{m.label}</span>
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-stone-700 md:table-cell">{d.size}</td>
                    <td className="px-3 py-3 text-right text-stone-600">
                      {new Date(d.uploadedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" aria-label="Aperçu" className="rounded-md border border-cream-300 bg-white p-1.5 text-stone-700 hover:bg-cream-50"><Eye className="h-3 w-3" /></button>
                        <button type="button" aria-label="Télécharger" className="rounded-md border border-forest-300 bg-white p-1.5 text-forest-700 hover:bg-forest-50"><Download className="h-3 w-3" /></button>
                        <button type="button" aria-label="Supprimer" className="rounded-md border border-red-200 bg-white p-1.5 text-red-700 hover:bg-red-50"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
