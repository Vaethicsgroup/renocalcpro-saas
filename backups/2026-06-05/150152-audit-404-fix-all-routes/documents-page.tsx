// app/[locale]/p/documents/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Page "Documents" — centralise tous les documents générés par les projets
// du user (rapports PDF, attestations RGE, devis, justificatifs aides…).
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Filter,
  Search,
  FileType2,
  ImageIcon,
  ShieldCheck,
  Receipt,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface DocItem {
  id: string;
  name: string;
  category: "RAPPORT" | "DEVIS" | "ATTESTATION" | "PHOTO" | "FACTURE" | "AUTRE";
  projectName: string;
  size: string;
  uploadedAt: string;
  format: "PDF" | "JPG" | "PNG" | "DOCX" | "XLSX";
}

const SAMPLE_DOCS: ReadonlyArray<DocItem> = [
  {
    id: "d1",
    name: "Rapport diagnostic énergétique — Maison des Tilleuls",
    category: "RAPPORT",
    projectName: "Maison des Tilleuls",
    size: "2,3 Mo",
    uploadedAt: "2026-06-01",
    format: "PDF",
  },
  {
    id: "d2",
    name: "Devis ITE laine de roche — Artisan RGE Couvreur Pro",
    category: "DEVIS",
    projectName: "Maison des Tilleuls",
    size: "180 Ko",
    uploadedAt: "2026-05-12",
    format: "PDF",
  },
  {
    id: "d3",
    name: "Attestation RGE QualiPAC — installateur PAC",
    category: "ATTESTATION",
    projectName: "Maison des Tilleuls",
    size: "95 Ko",
    uploadedAt: "2026-05-08",
    format: "PDF",
  },
  {
    id: "d4",
    name: "Photo façade sud — état initial",
    category: "PHOTO",
    projectName: "Maison des Tilleuls",
    size: "4,1 Mo",
    uploadedAt: "2026-04-20",
    format: "JPG",
  },
  {
    id: "d5",
    name: "Avis MaPrimeRénov' — Notification ANAH",
    category: "ATTESTATION",
    projectName: "Maison des Tilleuls",
    size: "210 Ko",
    uploadedAt: "2026-05-25",
    format: "PDF",
  },
];

const CATEGORY_META: Record<
  DocItem["category"],
  { label: string; icon: typeof FileText; color: string }
> = {
  RAPPORT: { label: "Rapports", icon: ClipboardList, color: "text-forest-700 bg-forest-100" },
  DEVIS: { label: "Devis", icon: Receipt, color: "text-amber-700 bg-amber-100" },
  ATTESTATION: { label: "Attestations", icon: ShieldCheck, color: "text-night-700 bg-night-100" },
  PHOTO: { label: "Photos", icon: ImageIcon, color: "text-info-700 bg-info-100" },
  FACTURE: { label: "Factures", icon: Receipt, color: "text-terracotta-700 bg-terracotta-100" },
  AUTRE: { label: "Autres", icon: FileText, color: "text-stone-700 bg-stone-100" },
};

const FORMAT_ICON: Record<DocItem["format"], typeof FileText> = {
  PDF: FileType2,
  JPG: ImageIcon,
  PNG: ImageIcon,
  DOCX: FileText,
  XLSX: FileText,
};

export default function MesDocumentsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    DocItem["category"] | "all"
  >("all");

  const filtered = SAMPLE_DOCS.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
    return true;
  });

  // Stats par catégorie
  const statsByCategory = SAMPLE_DOCS.reduce(
    (acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<DocItem["category"], number>,
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-night-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-night-700 text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-night-700">
              Bibliothèque
            </p>
            <h1
              className="font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Documents
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Rapports, devis, attestations, photos et justificatifs liés à vos
              projets — {SAMPLE_DOCS.length} document
              {SAMPLE_DOCS.length > 1 ? "s" : ""}.
            </p>
          </div>
        </div>

        {/* Stats par catégorie */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(Object.keys(CATEGORY_META) as DocItem["category"][]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const count = statsByCategory[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat ? "all" : cat)
                }
                className={[
                  "flex items-center gap-2 rounded-lg border p-3 text-left transition-colors",
                  categoryFilter === cat
                    ? "border-forest-500 bg-white shadow-sm"
                    : "border-cream-300 bg-white hover:border-forest-300",
                ].join(" ")}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${meta.color}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                    {meta.label}
                  </p>
                  <p className="font-serif text-lg font-bold text-forest-900">
                    {count}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cream-300 bg-white p-3 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un document…"
            className="h-9 w-full rounded-md border border-cream-300 pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(
              e.target.value as DocItem["category"] | "all",
            )
          }
          className="h-9 rounded-md border border-cream-300 bg-white px-3 text-sm font-medium text-stone-700 focus:border-forest-500 focus:outline-none"
        >
          <option value="all">Toutes catégories</option>
          {(Object.keys(CATEGORY_META) as DocItem["category"][]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <Filter className="mx-auto h-6 w-6 text-stone-400" />
          <p className="mt-2 text-sm text-stone-600">
            Aucun document ne correspond à vos critères.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-cream-300 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
                <th className="px-4 py-3 text-left">Document</th>
                <th className="hidden px-3 py-3 text-left sm:table-cell">
                  Projet
                </th>
                <th className="hidden px-3 py-3 text-center md:table-cell">
                  Catégorie
                </th>
                <th className="hidden px-3 py-3 text-right md:table-cell">
                  Taille
                </th>
                <th className="px-3 py-3 text-right">Date</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {filtered.map((d) => {
                const meta = CATEGORY_META[d.category];
                const FormatIcon = FORMAT_ICON[d.format];
                return (
                  <tr key={d.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${meta.color}`}
                        >
                          <FormatIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-forest-900">
                            {d.name}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500">
                            {d.format}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 text-stone-700 sm:table-cell">
                      {d.projectName}
                    </td>
                    <td className="hidden px-3 py-3 text-center md:table-cell">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-stone-700 md:table-cell">
                      {d.size}
                    </td>
                    <td className="px-3 py-3 text-right text-stone-600">
                      {new Date(d.uploadedAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-cream-300 bg-white px-2 py-1 text-xs font-semibold text-forest-700 hover:border-forest-300 hover:bg-cream-50"
                      >
                        <Download className="h-3 w-3" />
                        Télécharger
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Note pédagogique */}
      <Card>
        <CardContent>
          <p className="text-xs text-stone-600">
            <strong>Pourquoi cette bibliothèque ?</strong> Les documents y sont
            conservés en sécurité pour vos démarches futures (revente,
            transmission, contrôle ANAH/Direccte, déclarations fiscales). Vous
            pouvez télécharger à tout moment et conserver une trace de votre
            parcours rénovation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
