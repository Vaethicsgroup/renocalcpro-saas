// components/layout/SidebarAdmin.tsx — Sidebar admin v3.0 (Sprint v2.4)
// Fond forest-900 dense (cohérent avec sidebar pro) + accent amber pour différencier.
// Banner audit + logo officiel.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/Logo";

interface Props { locale: string }

type AdminSectionKey = "sectionPilotage" | "sectionComptes" | "sectionDonnees" | "sectionSysteme";
type AdminItemKey =
  | "navDashboard" | "navAnalytics" | "navHealth"
  | "navUsers" | "navProfessionals" | "navOrganizations" | "navImpersonations"
  | "navProjects" | "navAids" | "navLibrary" | "navContent"
  | "navWebhooks" | "navAbtests" | "navFunnels" | "navAiAssistant" | "navSettings";

interface NavSection { titleKey: AdminSectionKey; items: Array<{ href: string; icon: string; labelKey: AdminItemKey }> }

const NAV: NavSection[] = [
  {
    titleKey: "sectionPilotage",
    items: [
      { href: "/admin",                icon: "📊", labelKey: "navDashboard" },
      { href: "/admin/analytics",      icon: "📈", labelKey: "navAnalytics" },
      { href: "/admin/health",         icon: "💚", labelKey: "navHealth" },
    ],
  },
  {
    titleKey: "sectionComptes",
    items: [
      { href: "/admin/users",          icon: "👤", labelKey: "navUsers" },
      { href: "/admin/professionals",  icon: "🧑‍💼", labelKey: "navProfessionals" },
      { href: "/admin/organizations",  icon: "🏢", labelKey: "navOrganizations" },
      { href: "/admin/impersonations", icon: "🔑", labelKey: "navImpersonations" },
    ],
  },
  {
    titleKey: "sectionDonnees",
    items: [
      { href: "/admin/projects",       icon: "📁", labelKey: "navProjects" },
      { href: "/admin/aids",           icon: "💶", labelKey: "navAids" },
      { href: "/admin/library",        icon: "📚", labelKey: "navLibrary" },
      { href: "/admin/content",        icon: "📝", labelKey: "navContent" },
    ],
  },
  {
    titleKey: "sectionSysteme",
    items: [
      { href: "/admin/webhook-deliveries", icon: "🔔", labelKey: "navWebhooks" },
      { href: "/admin/abtests",            icon: "🧪", labelKey: "navAbtests" },
      { href: "/admin/funnels",            icon: "📐", labelKey: "navFunnels" },
      { href: "/admin/ai-assistant",       icon: "🤖", labelKey: "navAiAssistant" },
      { href: "/admin/settings",           icon: "⚙️", labelKey: "navSettings" },
    ],
  },
];

export function SidebarAdmin({ locale }: Props) {
  const pathname = usePathname();
  const t = useTranslations("adminSidebar");
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return pathname === `/${locale}${href}` || pathname?.startsWith(`/${locale}${href}/`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
        className="fixed left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cream-300 bg-white shadow-card md:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-forest-800" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-30 bg-night-900/60 md:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}

      <aside
        aria-label={t("ariaNav")}
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-night-900 bg-night-900 p-5 text-cream-100 transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Header LOGO officiel (variante blanche) */}
        <div className="mb-4 flex items-center justify-between">
          <Logo href={`/${locale}/admin`} variant="wordmark" theme="light" />
          <button type="button" onClick={() => setOpen(false)} aria-label={t("closeMenu")} className="rounded-lg p-1 text-cream-200/60 hover:bg-night-800 md:hidden">✕</button>
        </div>

        {/* Badge espace admin */}
        <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-amber-300">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          Espace Admin
        </div>

        {/* Banner audit */}
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-2xs text-amber-200">
          🛡️ Accès admin · toutes les actions sont auditées
        </div>

        {/* Navigation groupée */}
        <nav className="flex-1 overflow-y-auto space-y-5 pr-1" aria-label={t("ariaSections")}>
          {NAV.map(s => (
            <div key={s.titleKey}>
              <h3 className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-wider text-cream-200/50">
                {t(s.titleKey)}
              </h3>
              <ul className="space-y-0.5">
                {s.items.map(n => {
                  const active = isActive(n.href);
                  return (
                    <li key={n.href}>
                      <Link
                        href={`/${locale}${n.href}`}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-night-700 text-amber-300"
                            : "text-cream-100/80 hover:bg-night-700/70 hover:text-amber-300",
                        ].join(" ")}
                      >
                        {active && <span aria-hidden className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-amber-400" />}
                        <span aria-hidden className="text-base">{n.icon}</span>
                        <span>{t(n.labelKey)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
