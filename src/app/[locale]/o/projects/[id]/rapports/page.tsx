// app/[locale]/o/projects/[id]/rapports/page.tsx — Documents v2
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  FileText, Upload, Download, Eye, Trash2, Search, Camera, ClipboardList,
  Receipt, ShieldCheck, FileType2, Image as ImageIcon, Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ComingSoonButton, ComingSoonPill } from "@/components/ui/ComingSoonButton";

interface Doc {
  id: string;
  nameKey: string;
  category: "RAPPORT" | "PHOTO" | "DEVIS" | "ATTESTATION" | "PLAN" | "FACTURE";
  sizeKey: string;
  uploadedAt: string;
  format: string;
}

const SAMPLE_DOCS: Doc[] = [
  { id: "d1", nameKey: "doc1", category: "RAPPORT", sizeKey: "size1", uploadedAt: "2026-05-22", format: "PDF" },
  { id: "d2", nameKey: "doc2", category: "RAPPORT", sizeKey: "size2", uploadedAt: "2026-05-21", format: "XLSX" },
  { id: "d3", nameKey: "doc3", category: "PHOTO", sizeKey: "size3", uploadedAt: "2026-05-18", format: "JPG" },
  { id: "d4", nameKey: "doc4", category: "PHOTO", sizeKey: "size4", uploadedAt: "2026-05-18", format: "JPG" },
  { id: "d5", nameKey: "doc5", category: "PHOTO", sizeKey: "size5", uploadedAt: "2026-05-18", format: "JPG" },
  { id: "d6", nameKey: "doc6", category: "PLAN", sizeKey: "size6", uploadedAt: "2026-05-15", format: "PDF" },
  { id: "d7", nameKey: "doc7", category: "PLAN", sizeKey: "size7", uploadedAt: "2026-05-15", format: "PDF" },
  { id: "d8", nameKey: "doc8", category: "DEVIS", sizeKey: "size8", uploadedAt: "2026-05-25", format: "PDF" },
  { id: "d9", nameKey: "doc9", category: "DEVIS", sizeKey: "size9", uploadedAt: "2026-05-26", format: "PDF" },
  { id: "d10", nameKey: "doc10", category: "ATTESTATION", sizeKey: "size10", uploadedAt: "2026-05-26", format: "PDF" },
  { id: "d11", nameKey: "doc11", category: "FACTURE", sizeKey: "size11", uploadedAt: "2026-05-20", format: "PDF" },
  { id: "d12", nameKey: "doc12", category: "ATTESTATION", sizeKey: "size12", uploadedAt: "2026-06-02", format: "PDF" },
];

const META: Record<Doc["category"], { labelKey: string; Icon: typeof FileText; color: string }> = {
  RAPPORT: { labelKey: "catRapport", Icon: ClipboardList, color: "bg-forest-100 text-forest-700" },
  PHOTO: { labelKey: "catPhoto", Icon: Camera, color: "bg-info-100 text-info-700" },
  DEVIS: { labelKey: "catDevis", Icon: Receipt, color: "bg-amber-100 text-amber-700" },
  ATTESTATION: { labelKey: "catAttestation", Icon: ShieldCheck, color: "bg-night-100 text-night-700" },
  PLAN: { labelKey: "catPlan", Icon: Building2, color: "bg-stone-100 text-stone-700" },
  FACTURE: { labelKey: "catFacture", Icon: Receipt, color: "bg-terracotta-100 text-terracotta-700" },
};

export default function DocumentsPage() {
  const t = useTranslations("oRapports");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Doc["category"] | "ALL">("ALL");

  const filtered = SAMPLE_DOCS.filter((d) => {
    if (search && !t(d.nameKey).toLowerCase().includes(search.toLowerCase())) return false;
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
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {t("subtitle", { count: SAMPLE_DOCS.length })}
          </p>
        </div>
        <ComingSoonButton variant="primary" size="md" leftIcon={Upload}>
          {t("btnImport")}
        </ComingSoonButton>
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
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{t(m.labelKey)}</p>
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
              placeholder={t("searchPh")}
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
                <th className="px-4 py-3 text-left">{t("thDocument")}</th>
                <th className="hidden px-3 py-3 text-center md:table-cell">{t("thCategory")}</th>
                <th className="hidden px-3 py-3 text-right md:table-cell">{t("thSize")}</th>
                <th className="px-3 py-3 text-right">{t("thDate")}</th>
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
                          <p className="truncate font-semibold text-forest-900">{t(d.nameKey)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500">{d.format}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 text-center md:table-cell">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${m.color}`}>{t(m.labelKey)}</span>
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-stone-700 md:table-cell">{t(d.sizeKey)}</td>
                    <td className="px-3 py-3 text-right text-stone-600">
                      {new Date(d.uploadedAt).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled
                          aria-label={t("ariaPreview")}
                          title={t("tipPreview")}
                          className="rounded-md border border-cream-300 bg-white p-1.5 text-stone-400 cursor-not-allowed opacity-60"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled
                          aria-label={t("ariaDownload")}
                          title={t("tipDownload")}
                          className="rounded-md border border-forest-200 bg-white p-1.5 text-forest-400 cursor-not-allowed opacity-60"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled
                          aria-label={t("ariaDelete")}
                          title={t("tipDelete")}
                          className="rounded-md border border-red-100 bg-white p-1.5 text-red-300 cursor-not-allowed opacity-60"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
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
