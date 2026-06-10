// components/p/ProjectTabs.tsx — Onglets de navigation projet particulier v3.0
// « Energy Trust » : pictogrammes Lucide sobres, accent vert énergie sur tab
// actif, hover stone, plus d'emojis.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Camera,
  BarChart3,
  Thermometer,
  Coins,
  Hammer,
  HandCoins,
  FileText,
  Pencil,
  type LucideIcon,
} from "lucide-react";

interface Props {
  locale: string;
  projectId: string;
}

interface TabDef {
  key: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: ReadonlyArray<TabDef> = [
  { key: "synthese",  label: "Synthèse",  Icon: ClipboardList },
  { key: "edit",      label: "Modifier",  Icon: Pencil },
  { key: "photos",    label: "Photos",    Icon: Camera },
  { key: "results",   label: "Résultats", Icon: BarChart3 },
  { key: "comfort",   label: "Confort",   Icon: Thermometer },
  { key: "savings",   label: "Économies", Icon: Coins },
  { key: "works",     label: "Travaux",   Icon: Hammer },
  { key: "aids",      label: "Aides",     Icon: HandCoins },
  { key: "documents", label: "Documents", Icon: FileText },
];

export function ProjectTabs({ locale, projectId }: Props) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation projet" className="border-b border-cream-300">
      <div className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const href = `/${locale}/p/projects/${projectId}/${t.key}`;
          const active = pathname === href || pathname?.endsWith(`/${t.key}`);
          return (
            <Link
              key={t.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-forest-600 text-forest-800"
                  : "border-transparent text-stone-600 hover:border-cream-400 hover:text-night-800",
              ].join(" ")}
            >
              <t.Icon
                className={[
                  "h-4 w-4 shrink-0",
                  active ? "text-forest-600" : "text-stone-500",
                ].join(" ")}
                strokeWidth={1.75}
                aria-hidden
              />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
