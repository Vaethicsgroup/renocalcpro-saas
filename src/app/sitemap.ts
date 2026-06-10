// app/sitemap.ts — Sitemap multilingue généré dynamiquement.
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const HOST = process.env.NEXTAUTH_URL ?? "https://renocalcpro.fr";

const PUBLIC_PATHS = [
  { path: "",                priority: 1.0, changeFrequency: "weekly"  as const },
  { path: "/pricing",        priority: 0.9, changeFrequency: "weekly"  as const },
  { path: "/help",           priority: 0.7, changeFrequency: "weekly"  as const },
  { path: "/status",         priority: 0.5, changeFrequency: "hourly"  as const },
  { path: "/legal/cgu",      priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/legal/cgv",      priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/legal/privacy",  priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/legal/cookies",  priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/legal/mentions", priority: 0.3, changeFrequency: "yearly"  as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const items: MetadataRoute.Sitemap = [];

  // 1 entry par locale × path, avec alternates hreflang
  for (const path of PUBLIC_PATHS) {
    for (const locale of routing.locales) {
      items.push({
        url: `${HOST}/${locale}${path.path}`,
        lastModified: now,
        changeFrequency: path.changeFrequency,
        priority: path.priority,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map(l => [l, `${HOST}/${l}${path.path}`]),
          ),
        },
      });
    }
  }

  return items;
}
