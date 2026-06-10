"use client";
// components/pdf/PdfRendererInner.tsx
// Inner du wrapper lazy : charge @react-pdf/renderer + le template demandé
// dynamiquement. Pas exporté directement, utiliser LazyPdfRenderer.

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { useMemo } from "react";

export type LazyPdfTemplateName =
  | "audit-particulier"
  | "dpe-collectif"
  | "audit-copropriete"
  | "audit-tertiaire";

export interface LazyPdfProps {
  template: LazyPdfTemplateName;
  data: unknown;
  fileName?: string;
  showViewer?: boolean;
  showDownload?: boolean;
}

// Templates lazy-loadés un par un — Webpack code-split par template.
const TEMPLATES_LOADERS = {
  "audit-particulier": () => import("@/pdf/templates/audit-particulier/AuditParticulier"),
  "dpe-collectif":     () => import("@/pdf/templates/dpe-collectif/DPECollectif"),
  "audit-copropriete": () => import("@/pdf/templates/audit-copropriete/AuditCopropriete"),
  "audit-tertiaire":   () => import("@/pdf/templates/audit-tertiaire/AuditTertiaire"),
} as const;

export function PdfRendererInner({
  template, data, fileName, showViewer = true, showDownload = true,
}: LazyPdfProps) {
  const Promise = useMemo(() => TEMPLATES_LOADERS[template](), [template]);

  // Approche simplifiée — en prod, utiliser useEffect + useState pour gérer
  // le loading state. Ici on stub avec un placeholder.
  // À étoffer Sprint 7 avec gestion d'état complète.
  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-500">Template : {template} (lazy-loaded)</p>
      {showViewer && (
        <div className="rounded-xl border border-stone-200 bg-stone-100 p-4">
          <p className="text-sm text-stone-700">Aperçu PDF chargé via dynamic import.</p>
          {/* Implémentation complète : Promise.then + setState pour rendre <PDFViewer><Doc data={data}/></PDFViewer> */}
        </div>
      )}
      {showDownload && (
        <button className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          📄 Télécharger {fileName ?? `${template}.pdf`}
        </button>
      )}
    </div>
  );
}
