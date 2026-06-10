// app/robots.ts — robots.txt dynamique.
import type { MetadataRoute } from "next";

const HOST = process.env.NEXTAUTH_URL ?? "https://renocalcpro.fr";

export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.NODE_ENV === "production";
  return {
    rules: isProd ? [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin/", "/api/", "/dev/", "/o/", "/p/", "/auth/"],
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "Claude-Web", "ClaudeBot", "Google-Extended", "anthropic-ai"],
        // Politique : on autorise l'indexation des pages publiques + légales,
        // mais pas du contenu utilisateur (qui est de toute façon en /o/ /p/).
        allow: ["/", "/legal/"],
        disallow: ["/admin/", "/api/", "/o/", "/p/", "/auth/"],
      },
    ] : [
      // En staging/dev : interdit toute indexation
      { userAgent: "*", disallow: "/" },
    ],
    sitemap: `${HOST}/sitemap.xml`,
    host: HOST,
  };
}
