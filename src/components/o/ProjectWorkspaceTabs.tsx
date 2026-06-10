// components/o/ProjectWorkspaceTabs.tsx — Onglets denses workspace projet pro
// v3.0 « Energy Trust » : pictogrammes Lucide sobres, accent vert énergie sur
// tab actif, hover stone, kbd rounded forest-100.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ClipboardList,
  Layers,
  Settings,
  Thermometer,
  BarChart3,
  Coins,
  FileText,
  type LucideIcon,
} from "lucide-react";

interface Props {
  locale: string;
  projectId: string;
}

interface TabDef {
  key: string;
  labelKey: string;
  shortcut: string;
  Icon: LucideIcon;
}

const TABS: ReadonlyArray<TabDef> = [
  { key: "identite",  labelKey: "tabIdentite",  shortcut: "1", Icon: ClipboardList },
  { key: "enveloppe", labelKey: "tabEnveloppe", shortcut: "2", Icon: Layers },
  { key: "systemes",  labelKey: "tabSystemes",  shortcut: "3", Icon: Settings },
  { key: "confort",   labelKey: "tabConfort",   shortcut: "4", Icon: Thermometer },
  { key: "scenarios", labelKey: "tabScenarios", shortcut: "5", Icon: BarChart3 },
  { key: "aides",     labelKey: "tabAides",     shortcut: "6", Icon: Coins },
  { key: "rapports",  labelKey: "tabRapports",  shortcut: "7", Icon: FileText },
];

export function ProjectWorkspaceTabs({ locale, projectId }: Props) {
  const t = useTranslations("projectTabs");
  const pathname = usePathname();
  return (
    <nav
      aria-label={t("ariaTabs")}
      className="border-b border-cream-300"
    >
      <div className="-mb-px flex flex-wrap gap-0 overflow-x-auto">
        {TABS.map((tab) => {
          const href = `/${locale}/o/projects/${projectId}/${tab.key}`;
          const active = pathname === href || pathname?.endsWith(`/${tab.key}`);
          return (
            <Link
              key={tab.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "group inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-forest-600 bg-forest-50/40 text-night-800"
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
              <kbd
                className={[
                  "ml-1 hidden rounded border px-1 text-2xs font-mono lg:inline",
                  active
                    ? "border-forest-200 bg-forest-100 text-forest-700"
                    : "border-cream-300 bg-cream-100 text-stone-500",
                ].join(" ")}
              >
                {tab.shortcut}
              </kbd>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
