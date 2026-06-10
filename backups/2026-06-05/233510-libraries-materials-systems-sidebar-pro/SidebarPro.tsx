// components/layout/SidebarPro.tsx — Sidebar espace pro v3.0 (Sprint v2.4)
// Fond forest-800 dense + logo officiel en theme="light" (blanc sur fond foncé).
// Active state : fond forest-700 + bord gauche forest-400.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Globe,
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Link2,
  Layers,
  Settings as SettingsIcon,
  CreditCard,
  Palette,
  Library,
  Wrench,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import {
  SidebarAccountSwitcher,
  type ProfileKind,
} from "./SidebarAccountSwitcher";

interface Props {
  locale: string;
  currentProfile?: ProfileKind;
  userIdentifier?: string;
  availableProfiles?: ReadonlyArray<ProfileKind>;
}

interface NavSection {
  title: string;
  items: Array<{ href: string; Icon: LucideIcon; label: string }>;
}

// Menu logique reorganisé : Production en haut, Bibliothèque (outils), Org,
// Compte tout en bas avec switcher d'espaces et déconnexion.
const NAV: NavSection[] = [
  {
    title: "Production",
    items: [
      { href: "/o/dashboard", Icon: LayoutDashboard, label: "Tableau de bord" },
      { href: "/o/projects", Icon: FolderKanban, label: "Dossiers" },
      { href: "/o/reports", Icon: FileText, label: "Rapports" },
    ],
  },
  {
    title: "Relation client",
    items: [
      { href: "/o/clients", Icon: Users, label: "Clients" },
      { href: "/o/portal", Icon: Link2, label: "Portail client" },
    ],
  },
  {
    title: "Bibliothèque",
    items: [
      { href: "/o/library/materials", Icon: Library, label: "Matériaux" },
      { href: "/o/library/systems", Icon: Wrench, label: "Systèmes" },
    ],
  },
  {
    title: "Organisation",
    items: [
      { href: "/o/team", Icon: Users, label: "Équipe & accès" },
      { href: "/o/branding", Icon: Palette, label: "Marque & entreprise" },
    ],
  },
  {
    title: "Compte",
    items: [
      { href: "/o/billing", Icon: CreditCard, label: "Facturation & justificatifs" },
      { href: "/o/settings", Icon: SettingsIcon, label: "Paramètres" },
    ],
  },
];

export function SidebarPro({
  locale,
  currentProfile = "PRO",
  userIdentifier = "Jean Dupont",
  availableProfiles = ["PRO"],
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return pathname?.includes(href);
  }

  return (
    <>
      {/* Hamburger mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="fixed left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cream-300 bg-white shadow-card md:hidden"
      >
        <Menu className="h-5 w-5 text-forest-800" strokeWidth={1.75} aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-30 bg-night-900/60 md:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}

      <aside
        aria-label="Navigation espace pro"
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-night-900 bg-night-800 p-5 text-cream-100 transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Header LOGO officiel (variante blanche pour fond foncé) */}
        <div className="mb-6 flex items-center justify-between">
          <Logo href={`/${locale}/o/dashboard`} variant="wordmark" theme="light" withTagline />
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-lg p-1 text-cream-200/60 hover:bg-night-700 md:hidden">
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Navigation groupée */}
        <nav className="flex-1 overflow-y-auto space-y-5 pr-1" aria-label="Sections">
          {NAV.map(s => (
            <div key={s.title}>
              <h3 className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-wider text-night-200/80">
                {s.title}
              </h3>
              <ul className="space-y-0.5">
                {s.items.map(n => {
                  const active = isActive(n.href);
                  const Icon = n.Icon;
                  return (
                    <li key={n.href}>
                      <Link
                        href={`/${locale}${n.href}`}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-night-700 text-cream-50 shadow-inner"
                            : "text-cream-200/85 hover:bg-night-700/60 hover:text-cream-50",
                        ].join(" ")}
                      >
                        {active && <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-forest-500" />}
                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                        <span>{n.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Retour à l'accueil */}
        <div className="mt-4 border-t border-night-700/60 pt-3">
          <Link
            href={`/${locale}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-cream-200/85 transition-colors hover:bg-night-700/60 hover:text-white"
          >
            <Globe
              className="h-[18px] w-[18px] shrink-0 text-cream-200/70"
              strokeWidth={1.75}
              aria-hidden
            />
            <span>Retour au site</span>
          </Link>
        </div>

        {/* Carte compte + switch profil + déconnexion (même UX que particulier) */}
        <SidebarAccountSwitcher
          locale={locale}
          currentProfile={currentProfile}
          userIdentifier={userIdentifier}
          availableProfiles={availableProfiles}
        />
      </aside>
    </>
  );
}
