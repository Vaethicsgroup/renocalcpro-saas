// app/[locale]/p/documents/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Page "Documents" v2 — ajoute upload réel (drag-drop, file picker, métadonnées,
// preview images, persistance localStorage).
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  Upload,
  Trash2,
  Eye,
  Camera,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  DocumentUploader,
  loadPersistedDocuments,
  removePersistedDocument,
  CATEGORY_LABELS_FR,
  type UploadedDocument,
  type DocumentCategory,
} from "@/components/documents/DocumentUploader";

interface DocItem {
  id: string;
  name: string;
  category: DocumentCategory;
  projectName: string;
  size: string;
  uploadedAt: string;
  format: string;
  /** Lecture seule (échantillon démo). */
  readonly_demo?: boolean;
  /** Data URL pour preview si disponible (cas upload utilisateur). */
  dataUrl?: string;
}

const SAMPLE_DOCS: ReadonlyArray<DocItem> = [
  {
    id: "d1-demo",
    name: "Rapport diagnostic énergétique — Maison des Tilleuls",
    category: "RAPPORT",
    projectName: "Maison des Tilleuls",
    size: "2,3 Mo",
    uploadedAt: "2026-06-01",
    format: "PDF",
    readonly_demo: true,
  },
  {
    id: "d2-demo",
    name: "Devis ITE laine de roche — Artisan RGE Couvreur Pro",
    category: "DEVIS",
    projectName: "Maison des Tilleuls",
    size: "180 Ko",
    uploadedAt: "2026-05-12",
    format: "PDF",
    readonly_demo: true,
  },
  {
    id: "d3-demo",
    name: "Attestation RGE QualiPAC — installateur PAC",
    category: "ATTESTATION",
    projectName: "Maison des Tilleuls",
    size: "95 Ko",
    uploadedAt: "2026-05-08",
    format: "PDF",
    readonly_demo: true,
  },
];

const SAMPLE_PROJECTS = [
  { id: "demo", name: "Maison des Tilleuls" },
];

type CatKey = "catRapport" | "catDevis" | "catAttestation" | "catPhoto" | "catFacture" | "catPlan" | "catAutre";

const CATEGORY_META: Record<
  DocumentCategory,
  { labelKey: CatKey; icon: typeof FileText; color: string }
> = {
  RAPPORT: { labelKey: "catRapport", icon: ClipboardList, color: "text-forest-700 bg-forest-100" },
  DEVIS: { labelKey: "catDevis", icon: Receipt, color: "text-amber-700 bg-amber-100" },
  ATTESTATION: { labelKey: "catAttestation", icon: ShieldCheck, color: "text-night-700 bg-night-100" },
  PHOTO: { labelKey: "catPhoto", icon: Camera, color: "text-info-700 bg-info-100" },
  FACTURE: { labelKey: "catFacture", icon: Receipt, color: "text-terracotta-700 bg-terracotta-100" },
  PLAN: { labelKey: "catPlan", icon: FileType2, color: "text-stone-700 bg-stone-100" },
  AUTRE: { labelKey: "catAutre", icon: FileText, color: "text-stone-700 bg-stone-100" },
};

const FORMAT_ICON: Record<string, typeof FileText> = {
  PDF: FileType2,
  JPG: ImageIcon,
  JPEG: ImageIcon,
  PNG: ImageIcon,
  WEBP: ImageIcon,
  HEIC: ImageIcon,
  DOCX: FileText,
  XLSX: FileText,
  DOC: FileText,
  XLS: FileText,
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export default function MesDocumentsPage() {
  const t = useTranslations("pDocuments");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    DocumentCategory | "all"
  >("all");
  const [showUploader, setShowUploader] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [previewDoc, setPreviewDoc] = useState<DocItem | null>(null);

  // Charger les documents persistés au mount
  useEffect(() => {
    setUploadedDocs(loadPersistedDocuments());
  }, []);

  // Convertir les UploadedDocument en DocItem unifié pour le tableau
  const convertedUploads: DocItem[] = uploadedDocs
    .filter((d) => d.status === "success")
    .map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      projectName:
        SAMPLE_PROJECTS.find((p) => p.id === d.projectId)?.name ??
        t("projectNoAssoc"),
      size: formatSize(d.sizeBytes),
      uploadedAt: d.uploadedAt.slice(0, 10),
      format: d.format,
      dataUrl: d.dataUrl,
    }));

  const allDocs: DocItem[] = [...convertedUploads, ...SAMPLE_DOCS];

  const filtered = allDocs.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
    return true;
  });

  // Stats par catégorie
  const statsByCategory = allDocs.reduce(
    (acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<DocumentCategory, number>,
  );

  const handleDelete = (id: string) => {
    if (id.endsWith("-demo")) return; // Pas de suppression des échantillons
    if (!confirm(t("deleteConfirm"))) return;
    removePersistedDocument(id);
    setUploadedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDownload = (d: DocItem) => {
    if (!d.dataUrl) {
      alert(t("downloadDemoAlert"));
      return;
    }
    const a = document.createElement("a");
    a.href = d.dataUrl;
    a.download = d.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-night-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-night-700 text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-night-700">
                {t("eyebrow")}
              </p>
              <h1
                className="font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {t("title")}
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                {t("subtitle", { count: allDocs.length })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUploader((v) => !v)}
            className={[
              "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold shadow-soft transition-colors",
              showUploader
                ? "border border-cream-300 bg-white text-stone-700 hover:bg-cream-50"
                : "bg-forest-600 text-white hover:bg-forest-800",
            ].join(" ")}
          >
            <Upload className="h-4 w-4" strokeWidth={2} />
            {showUploader ? t("closeImport") : t("importBtn")}
          </button>
        </div>

        {/* Stats catégorie */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {(Object.keys(CATEGORY_META) as DocumentCategory[]).map((cat) => {
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
                  "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors",
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
                    {t(meta.labelKey)}
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

      {/* Zone d'upload (collapsable) */}
      {showUploader && (
        <Card>
          <CardContent>
            <DocumentUploader
              availableProjects={SAMPLE_PROJECTS}
              defaultCategory="AUTRE"
              onUploadComplete={(d) =>
                setUploadedDocs((prev) => [...prev, d])
              }
            />
            <p className="mt-4 rounded-md bg-cream-50 px-3 py-2 text-[11px] text-stone-600">
              <strong>{t("noteTechnical")}</strong>{t("noteTechBody")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cream-300 bg-white p-3 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPh")}
            className="h-9 w-full rounded-md border border-cream-300 pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as DocumentCategory | "all")
          }
          className="h-9 rounded-md border border-cream-300 bg-white px-3 text-sm font-medium text-stone-700 focus:border-forest-500 focus:outline-none"
        >
          <option value="all">{t("allCategories")}</option>
          {(Object.keys(CATEGORY_META) as DocumentCategory[]).map((c) => (
            <option key={c} value={c}>
              {t(CATEGORY_META[c].labelKey)}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
          <Filter className="mx-auto h-6 w-6 text-stone-400" />
          <p className="mt-2 text-sm text-stone-600">{t("noDocsFound")}</p>
          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-forest-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-800"
          >
            <Upload className="h-3 w-3" />
            {t("importOneCta")}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-cream-300 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream-300 bg-cream-50 text-xs font-semibold uppercase tracking-wider text-stone-600">
                <th className="px-4 py-3 text-left">{t("tableDocument")}</th>
                <th className="hidden px-3 py-3 text-left sm:table-cell">
                  {t("tableProject")}
                </th>
                <th className="hidden px-3 py-3 text-center md:table-cell">
                  {t("tableCategory")}
                </th>
                <th className="hidden px-3 py-3 text-right md:table-cell">
                  {t("tableSize")}
                </th>
                <th className="px-3 py-3 text-right">{t("tableDate")}</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {filtered.map((d) => {
                const meta = CATEGORY_META[d.category];
                const FormatIcon = FORMAT_ICON[d.format.toUpperCase()] ?? FileText;
                const isImage =
                  d.format.toUpperCase().match(/^(JPE?G|PNG|WEBP|HEIC)$/);
                return (
                  <tr key={d.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {isImage && d.dataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={d.dataUrl}
                            alt={d.name}
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <span
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${meta.color}`}
                          >
                            <FormatIcon className="h-4 w-4" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-forest-900">
                            {d.name}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-stone-500">
                            {d.format}
                            {d.readonly_demo && " · démo"}
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
                        {t(meta.labelKey)}
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
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isImage && d.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(d)}
                            aria-label={t("ariaPreview")}
                            className="rounded-md border border-cream-300 bg-white p-1.5 text-stone-700 hover:border-forest-300"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownload(d)}
                          aria-label={t("ariaDownload")}
                          className="rounded-md border border-cream-300 bg-white p-1.5 text-forest-700 hover:border-forest-300 hover:bg-cream-50"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        {!d.readonly_demo && (
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            aria-label={t("ariaDelete")}
                            className="rounded-md border border-cream-300 bg-white p-1.5 text-stone-500 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal preview image */}
      {previewDoc && previewDoc.dataUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/80 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="absolute -top-10 right-0 rounded-md bg-white px-3 py-1 text-sm font-semibold text-stone-700"
              aria-label={t("ariaClose")}
            >
              {t("btnClose")}
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewDoc.dataUrl}
              alt={previewDoc.name}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
            <p className="mt-2 text-center text-sm text-white">
              {previewDoc.name}
            </p>
          </div>
        </div>
      )}

      {/* Note pédagogique */}
      <Card>
        <CardContent>
          <p className="text-xs text-stone-600">
            <strong>{t("whyTitle")}</strong> {t("whyBody")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
