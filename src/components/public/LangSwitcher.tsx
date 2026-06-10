"use client";
// components/public/LangSwitcher.tsx — bascule de locale (DA Energy Trust).
// Drapeaux emoji retirés au profit de codes ISO sobres.
import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";
import { useLocale } from "next-intl";

export function LangSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function setLocale(l: string) {
    const segments = pathname.split("/");
    if ((routing.locales as readonly string[]).includes(segments[1] ?? "")) {
      segments[1] = l;
    } else {
      segments.splice(1, 0, l);
    }
    router.push(segments.join("/") || `/${l}`);
  }

  return (
    <label className="flex items-center gap-1 text-sm">
      <span className="sr-only">Langue</span>
      <select
        value={locale}
        onChange={e => setLocale(e.target.value)}
        className="rounded-md border border-cream-300 bg-white px-2 py-1 text-sm font-medium text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest-400"
      >
        {routing.locales.map(l => (
          <option key={l} value={l}>{l.toUpperCase()}</option>
        ))}
      </select>
    </label>
  );
}
