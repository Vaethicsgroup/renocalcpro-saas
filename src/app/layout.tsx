// app/layout.tsx — Root layout obligatoire Next.js 15 App Router.
// Rend <html lang={locale}><body> minimal. La locale est lue depuis le header
// `x-next-intl-locale` injecté par le middleware next-intl (cf. src/middleware.ts).
// Tout le contenu i18n (fonts, NextIntlClientProvider, scripts) reste dans
// [locale]/layout.tsx qui s'imbrique sous ce root layout.
//
// ⚠ A11y / SEO : `lang` doit être sur la balise <html> racine pour que
// `document.documentElement.lang` soit correct (lecteurs d'écran, moteurs de
// recherche, hyphenation). Mettre `lang` sur un <div> enfant ne suffit pas.

import "@/app/globals.css";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Lecture du header injecté par le middleware next-intl. Fail-safe :
  // si absent (page hors middleware ou not-found racine), fallback sur defaultLocale.
  const headersList = await headers();
  const headerLocale = headersList.get("x-next-intl-locale");
  const locale =
    headerLocale && (routing.locales as readonly string[]).includes(headerLocale)
      ? headerLocale
      : routing.defaultLocale;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
