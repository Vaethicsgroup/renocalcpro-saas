// app/[locale]/(public)/legal/layout.tsx
// Layout commun aux 5 pages légales — sidebar de navigation + warning juridique.

import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function LegalLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("legal.nav");

  const items = [
    { href: "/legal/cgu",      key: "cgu" },
    { href: "/legal/cgv",      key: "cgv" },
    { href: "/legal/privacy",  key: "privacy" },
    { href: "/legal/cookies",  key: "cookies" },
    { href: "/legal/mentions", key: "mentions" },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Bandeau warning juridique en haut de chaque page légale */}
      <div role="note" aria-label="Avertissement juridique" className="mb-8 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">⚠ {t("warningTitle")}</p>
        <p className="mt-1">{t("warningBody")}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside aria-label={t("ariaLabel")}>
          <h2 className="mb-4 font-serif text-sm font-semibold uppercase tracking-wider text-stone-500" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {t("heading")}
          </h2>
          <nav>
            <ul className="space-y-1">
              {items.map(it => (
                <li key={it.key}>
                  <Link
                    href={it.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-teal-50 hover:text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                  >
                    {t(`items.${it.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="prose prose-stone max-w-none rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          {children}
        </article>
      </div>
    </div>
  );
}
