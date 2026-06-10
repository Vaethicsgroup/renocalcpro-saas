"use client";
// components/pdf/LazyPdfRenderer.tsx
// Wrapper qui charge @react-pdf/renderer (~600 Ko gzip) UNIQUEMENT à la
// demande — divise par ~2 le bundle initial. Usage :
//   <LazyPdfRenderer template="audit-particulier" data={...} />

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const PdfRendererInner = dynamic(
  () => import("./PdfRendererInner").then(m => m.PdfRendererInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center rounded-xl bg-stone-50">
        <div className="text-center">
          <LoadingSpinner size={48} />
          <p className="mt-4 text-sm text-stone-600">Chargement du moteur PDF…</p>
        </div>
      </div>
    ),
  },
);

export type { LazyPdfTemplateName, LazyPdfProps } from "./PdfRendererInner";
export { PdfRendererInner as LazyPdfRenderer };
