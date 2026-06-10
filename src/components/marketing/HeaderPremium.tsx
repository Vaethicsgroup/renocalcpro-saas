// components/marketing/HeaderPremium.tsx — Header v3.2 (i18n + mobile premium)
// v3.2 :
//  - useTranslations("navMarketing") → labels traduits FR/EN
//  - Drawer mobile : overlay backdrop + scroll-lock + transitions + sélecteur de langue
//  - Cibles tactiles 44px+, hiérarchie typographique
//  - Sélecteur de langue accessible (FR/EN/ES/DE/PT) avec changement de locale via path-rewrite
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu as MenuIcon, X as CloseIcon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface Props { locale: string }

const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "pt"] as const;
// Labels sobres (codes ISO sans drapeaux emoji — direction Energy Trust).
const LANG_LABELS: Record<(typeof SUPPORTED_LOCALES)[number], string> = {
  fr: "FR — Français",
  en: "EN — English",
  es: "ES — Español",
  de: "DE — Deutsch",
  pt: "PT — Português",
};

export function HeaderPremium({ locale }: Props) {
  const t = useTranslations("navMarketing");
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV = [
    { label: t("solutions"), href: "/solutions" },
    { label: t("features"),  href: "/fonctionnalites" },
    { label: t("resources"), href: "/help" },
    { label: t("pricing"),   href: "/tarifs" },
  ];

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll lock quand drawer ouvert
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  function switchLocale(next: string) {
    if (next === locale) return;
    const parts = pathname.split("/");
    if (SUPPORTED_LOCALES.includes(parts[1] as (typeof SUPPORTED_LOCALES)[number])) {
      parts[1] = next;
    } else {
      parts.splice(1, 0, next);
    }
    router.push(parts.join("/") || `/${next}`);
    setMobileOpen(false);
  }

  return (
    <header
      className={[
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled
          ? "border-b border-cream-300 bg-cream-50/95 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-cream-50",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20">
        <Logo href={`/${locale}`} variant="wordmark" theme="dark" />

        {/* Nav desktop */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={`/${locale}${n.href}`}
              className="text-sm font-medium text-forest-900/80 transition-colors hover:text-forest-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* CTAs desktop + sélecteur langue */}
        <div className="hidden items-center gap-3 lg:flex">
          <select
            value={locale}
            onChange={e => switchLocale(e.target.value)}
            aria-label={t("language")}
            className="rounded-lg border border-cream-300 bg-white px-2 py-1.5 text-xs font-medium text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
          >
            {SUPPORTED_LOCALES.map(l => (
              <option key={l} value={l}>{LANG_LABELS[l]}</option>
            ))}
          </select>
          <Link
            href={`/${locale}/auth/signin`}
            className="rounded-lg border border-cream-400 bg-white px-4 py-2 text-sm font-semibold text-forest-800 transition hover:border-forest-300 hover:bg-cream-100"
          >
            {t("signIn")}
          </Link>
          <Link
            href={`/${locale}/auth/signup`}
            className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-forest-800"
          >
            {t("signUp")}
          </Link>
        </div>

        {/* Hamburger mobile */}
        <button
          type="button"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
          aria-expanded={mobileOpen}
          className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-cream-400 bg-white text-forest-800 shadow-sm transition hover:bg-cream-100"
        >
          {mobileOpen ? (
            <CloseIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          ) : (
            <MenuIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>

      {/* Backdrop mobile */}
      {mobileOpen && (
        <button
          type="button"
          aria-label={t("menuClose")}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 top-16 z-30 bg-forest-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Drawer mobile */}
      <div
        id="mobile-drawer"
        className={[
          "fixed inset-x-0 top-16 z-40 origin-top overflow-hidden border-b border-cream-300 bg-cream-50 shadow-2xl transition-all duration-200 ease-out lg:hidden",
          mobileOpen ? "max-h-[calc(100vh-4rem)] opacity-100" : "pointer-events-none max-h-0 opacity-0",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileOpen}
      >
        <nav className="mx-auto flex max-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-1 overflow-y-auto px-5 py-5" aria-label="Navigation mobile">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={`/${locale}${n.href}`}
              onClick={() => setMobileOpen(false)}
              className="flex h-12 items-center rounded-xl px-4 text-base font-semibold text-forest-900 transition hover:bg-cream-200"
            >
              {n.label}
            </Link>
          ))}

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-cream-300 pt-4">
            <Link
              href={`/${locale}/auth/signin`}
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-cream-400 bg-white text-center text-sm font-semibold text-forest-800 transition hover:bg-cream-100"
            >
              {t("signIn")}
            </Link>
            <Link
              href={`/${locale}/auth/signup`}
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-forest-700 text-center text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-forest-800"
            >
              {t("signUp")}
            </Link>
          </div>

          <div className="mt-4 border-t border-cream-300 pt-4">
            <label htmlFor="mobile-lang" className="block text-[11px] font-bold uppercase tracking-wider text-forest-700/70">
              {t("language")}
            </label>
            <select
              id="mobile-lang"
              value={locale}
              onChange={e => switchLocale(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-cream-400 bg-white px-3 text-sm font-medium text-forest-900 focus:outline-none focus:ring-2 focus:ring-forest-400"
            >
              {SUPPORTED_LOCALES.map(l => (
                <option key={l} value={l}>{LANG_LABELS[l]}</option>
              ))}
            </select>
          </div>
        </nav>
      </div>
    </header>
  );
}
