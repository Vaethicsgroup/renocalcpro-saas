// app/page.tsx — Redirection racine vers la locale par défaut.
// Avec `localePrefix: "always"` côté next-intl, toute URL doit être préfixée /[locale].
// Cette page sert de filet de sécurité si le middleware ne déclenche pas pour `/`.

import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
