"use client";
// components/ui/EmptyState.tsx — État vide illustré v3 (Sprint v2.5)
// Illustrations SVG cohérentes avec la DA Forest & Cream + variantes premium.

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

type Variant = "projects" | "photos" | "reports";

interface EmptyStateProps {
  type: Variant;
  title?: string;
  description?: string;
  action?: ReactNode;
}

const VARIANTS: Record<Variant, { titleKey: string; descKey: string; illustration: ReactNode }> = {
  projects: {
    titleKey: "noProjectsTitle",
    descKey: "firstAudit",
    illustration: (
      <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <circle cx="64" cy="64" r="56" fill="#dde9dd" />
        <rect x="38" y="46" width="52" height="52" rx="6" fill="#fff" stroke="#2d5a3e" strokeWidth="2"/>
        <rect x="46" y="56" width="36" height="3" rx="1" fill="#94b395"/>
        <rect x="46" y="64" width="28" height="3" rx="1" fill="#94b395"/>
        <rect x="46" y="72" width="32" height="3" rx="1" fill="#94b395"/>
        <circle cx="92" cy="36" r="14" fill="#fbbf24"/>
        <text x="92" y="42" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1f4d2e">+</text>
      </svg>
    ),
  },
  photos: {
    titleKey: "noPhotosTitle",
    descKey: "photosEmpty",
    illustration: (
      <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <circle cx="64" cy="64" r="56" fill="#f5efdd" />
        <rect x="32" y="40" width="64" height="48" rx="8" fill="#fff" stroke="#2d5a3e" strokeWidth="2"/>
        <rect x="50" y="32" width="28" height="12" rx="2" fill="#fff" stroke="#2d5a3e" strokeWidth="2"/>
        <circle cx="64" cy="64" r="14" fill="#94b395"/>
        <circle cx="64" cy="64" r="8" fill="#fff"/>
        <circle cx="86" cy="50" r="2.5" fill="#2d5a3e"/>
      </svg>
    ),
  },
  reports: {
    titleKey: "noReportTitle",
    descKey: "noReportDesc",
    illustration: (
      <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
        <circle cx="64" cy="64" r="56" fill="#dde9dd" />
        <rect x="40" y="32" width="48" height="64" rx="6" fill="#fff" stroke="#2d5a3e" strokeWidth="2"/>
        <rect x="48" y="44" width="32" height="3" rx="1" fill="#94b395"/>
        <rect x="48" y="52" width="24" height="3" rx="1" fill="#94b395"/>
        <rect x="48" y="64" width="32" height="22" rx="3" fill="#f1f6f1"/>
        <text x="64" y="79" textAnchor="middle" fontSize="14" fontWeight="700" fill="#2d5a3e">PDF</text>
      </svg>
    ),
  },
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const t = useTranslations("emptyState");
  const data = VARIANTS[type];
  return (
    <div className="rounded-2xl border border-dashed border-cream-400 bg-cream-50 p-12 text-center">
      <div className="mx-auto w-32" aria-hidden>
        {data.illustration}
      </div>
      <h3 className="mt-6 font-serif text-xl font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
        {title ?? t(data.titleKey)}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-forest-900/65">
        {description ?? t(data.descKey)}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
