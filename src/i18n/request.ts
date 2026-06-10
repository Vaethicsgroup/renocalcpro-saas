// i18n/request.ts — Charge dynamiquement les messages selon la locale.
// Merge le fichier principal `{locale}.json` avec les modules optionnels :
//   - legal.{locale}.json (CGU/CGV/Privacy/Cookies)
// Si un module locale est absent, fallback sur la version FR du module.

import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const MODULES = ["legal", "help"] as const;

async function loadModule(name: string, locale: string): Promise<Record<string, unknown>> {
  try {
    return (await import(`../../messages/${name}.${locale}.json`)).default;
  } catch {
    try {
      return (await import(`../../messages/${name}.fr.json`)).default;
    } catch {
      return {};
    }
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  const main = (await import(`../../messages/${locale}.json`)).default;
  const modules = await Promise.all(MODULES.map(m => loadModule(m, locale!)));
  const messages = Object.assign({}, main, ...modules);

  return { locale, messages, timeZone: "Europe/Paris" };
});
