// src/components/o/ProjectSubTabs.tsx
// Onglets de sous-navigation projet pro v2 — design conforme maquette client.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface Props {
  locale: string;
  projectId: string;
}

const TABS: ReadonlyArray<{ key: string; labelKey: string }> = [
  { key: "identite", labelKey: "tabSynthese" },
  { key: "scenarios", labelKey: "tabScenarios" },
  { key: "confort", labelKey: "tabThermique" },
  { key: "aides", labelKey: "tabDevis" },
  { key: "rapports", labelKey: "tabDocuments" },
  { key: "enveloppe", labelKey: "tabHistorique" },
];

export function ProjectSubTabs({ locale, projectId }: Props) {
  const pathname = usePathname();
  const t = useTranslations("oWorkspace");
  return (
    <nav aria-label={t("tabsAria")} className="border-b border-cream-300">
      <div className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const href = `/${locale}/o/projects/${projectId}/${tab.key}`;
          const isActive =
            pathname === href || pathname?.endsWith(`/${tab.key}`);
          return (
            <Link
              key={tab.key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex shrink-0 items-center border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-forest-600 text-forest-900"
                  : "border-transparent text-stone-600 hover:border-cream-400 hover:text-forest-900",
              ].join(" ")}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
