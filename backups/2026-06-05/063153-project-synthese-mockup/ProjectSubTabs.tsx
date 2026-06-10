// src/components/o/ProjectSubTabs.tsx
// Onglets de sous-navigation projet pro v2 — design conforme maquette client.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  locale: string;
  projectId: string;
}

const TABS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "identite", label: "Synthèse" },
  { key: "scenarios", label: "Scénarios" },
  { key: "confort", label: "Étude thermique" },
  { key: "aides", label: "Devis" },
  { key: "rapports", label: "Documents" },
  { key: "enveloppe", label: "Historique" },
];

export function ProjectSubTabs({ locale, projectId }: Props) {
  const pathname = usePathname();
  return (
    <nav aria-label="Onglets projet" className="border-b border-cream-300">
      <div className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const href = `/${locale}/o/projects/${projectId}/${t.key}`;
          const isActive =
            pathname === href || pathname?.endsWith(`/${t.key}`);
          return (
            <Link
              key={t.key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex shrink-0 items-center border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-forest-600 text-forest-900"
                  : "border-transparent text-stone-600 hover:border-cream-400 hover:text-forest-900",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
