// app/[locale]/(public)/api-docs/page.tsx — Documentation API publique (Swagger UI via CDN).
// Utilise swagger-ui-dist depuis cdnjs (no npm dep), pointe vers /api/v1/openapi.json.

import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API REST — Documentation | Réno·Calc Pro",
  description:
    "Documentation interactive de l'API REST publique Réno·Calc Pro v1 — créer des dossiers, générer des audits PDF, intégrer dans vos workflows.",
  alternates: { canonical: "https://renocalcpro.fr/fr/api-docs" },
};

interface Props { params: Promise<{ locale: string }> }

export default async function ApiDocsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <div className="border-b border-stone-200 bg-gradient-to-r from-teal-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">API REST v1</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            Documentation API
          </h1>
          <p className="mt-3 max-w-2xl text-stone-700">
            Intégrez Réno·Calc Pro dans vos workflows : création de dossiers, génération de rapports, récupération des données structurées.
            Authentification par clé API (Bearer), rate-limit 60 req/min (basic) ou 600 req/min (full).
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href="/api/v1/openapi.json" className="rounded-md border border-teal-600 bg-white px-4 py-2 font-semibold text-teal-700 hover:bg-teal-50">
              📥 openapi.json
            </a>
            <a href={`/${locale}/help/rest-api`} className="rounded-md border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-700 hover:bg-stone-100">
              📚 Guide de démarrage
            </a>
            <a
              href={`https://github.com/vinciaflora/renocal-pro/blob/main/saas/docs/api/${locale}.md`}
              target="_blank" rel="noopener noreferrer"
              className="rounded-md border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-700 hover:bg-stone-100"
            >
              📄 Doc API ({locale.toUpperCase()})
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI mount point */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui.min.css" />
        <div id="swagger-ui" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-bundle.min.js" defer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function () {
                if (typeof SwaggerUIBundle === 'undefined') return;
                SwaggerUIBundle({
                  url: '/api/v1/openapi.json',
                  dom_id: '#swagger-ui',
                  deepLinking: true,
                  presets: [SwaggerUIBundle.presets.apis],
                  layout: 'BaseLayout',
                  tryItOutEnabled: true,
                  syntaxHighlight: { theme: 'agate' },
                });
              });
            `,
          }}
        />
      </div>
    </>
  );
}
