// components/audit/lazy.tsx
// Lazy wrappers pour les composants audit lourds — réduit le bundle initial
// du SaaS. Charge à la demande quand l'utilisateur ouvre le tab/modal.
//
// Utilisation : import { LazyMaterialPicker, LazyMeasureAssistant, LazyInsulationDetector } from "@/components/audit/lazy";
//
// Bénéfice mesuré (Sprint 17 bundle:analyze) :
//   - MaterialPicker         : 14 Ko gz (catalogue + radiogroup) → lazy
//   - MeasureAssistant       : 28 Ko gz (6 schémas SVG inline)   → lazy
//   - InsulationDetector     : 18 Ko gz (4 schémas SVG)          → lazy
//   - HygroChecker           : 6 Ko gz                           → eager
//   - ComfortRadar           : 8 Ko gz                           → eager
//   - CoverageScoreCard      : 7 Ko gz                           → eager
//   - FieldHelp              : 3 Ko gz                           → eager

import dynamic from "next/dynamic";

// Skeleton pendant le chargement
const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-stone-200 bg-stone-100 p-6">
    <div className="h-4 w-1/3 rounded bg-stone-200" />
    <div className="mt-3 h-3 w-2/3 rounded bg-stone-200" />
    <div className="mt-2 h-3 w-1/2 rounded bg-stone-200" />
  </div>
);

const SkeletonModal = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30">
    <div className="h-64 w-full max-w-3xl animate-pulse rounded-2xl bg-stone-100" />
  </div>
);

export const LazyMaterialPicker = dynamic(
  () => import("./MaterialPicker").then(m => ({ default: m.MaterialPicker })),
  { loading: () => <SkeletonCard />, ssr: false },
);

export const LazyMeasureAssistant = dynamic(
  () => import("./MeasureAssistant").then(m => ({ default: m.MeasureAssistant })),
  { loading: () => <SkeletonModal />, ssr: false },
);

export const LazyInsulationDetector = dynamic(
  () => import("./InsulationDetector").then(m => ({ default: m.InsulationDetector })),
  { loading: () => <SkeletonCard />, ssr: false },
);
