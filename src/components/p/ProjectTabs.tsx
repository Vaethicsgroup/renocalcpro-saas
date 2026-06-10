// components/p/ProjectTabs.tsx — Onglets de navigation projet particulier v3.0
// « Energy Trust » : pictogrammes Lucide sobres, accent vert énergie sur tab
// actif, hover stone, plus d'emojis.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  labelKey: string;
  Icon: LucideIcon;
}

const TABS: ReadonlyArray<TabDef> = [
  { key: "synthese",  labelKey: "tabSynthese",  Icon: ClipboardList },
  { key: "edit",      labelKey: "tabEdit",      Icon: Pencil },
  { key: "photos",    labelKey: "tabPhotos",    Icon: Camera },
  { key: "results",   labelKey: "tabResults",   Icon: BarChart3 },
  { key: "comfort",   labelKey: "tabComfort",   Icon: Thermometer },
  { key: "savings",   labelKey: "tabSavings",   Icon: Coins },
  { key: "works",     labelKey: "tabWorks",     Icon: Hammer },
  { key: "aids",      labelKey: "tabAids",      Icon: HandCoins },
  { key: "documents", labelKey: "tabDocuments", Icon: FileText },
];

export function ProjectTabs({ locale, projectId }: Props) {
  const pathname = usePathname();
  const t = useTranslations("pWorkspace");

  return (
    <nav aria-label={t("navAria")} className="border-b border-cream-300">
      <div className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const href = `/${locale}/p/projects/${projectId}/${tab.key}`;
          const active = pathname === href || pathname?.endsWith(`/${tab.key}`);
          return (
            <Link
              key={tab.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-forest-600 text-forest-800"
                  : "border-transparent text-stone-600 hover:border-cream-400 hover:text-night-800",
              ].join(" ")}
            >
              <tab.Icon
                className={[
                  "h-4 w-4 shrink-0",
                  active ? "text-forest-600" : "text-stone-500",
                ].join(" ")}
                strokeWidth={1.75}
                aria-hidden
              />
              <span>{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
