// app/[locale]/(public)/api-docs/graphql/page.tsx
// Page publique avec GraphiQL Explorer embarqué pour explorer le schéma GraphQL.
// Charge GraphiQL depuis cdnjs (zero npm dep client-side).

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "GraphQL API Explorer — Réno·Calc Pro",
  description: "Explorez l'API GraphQL expérimentale de Réno·Calc Pro. Authentification Bearer requise.",
  alternates: { canonical: "https://renocalcpro.fr/fr/api-docs/graphql" },
};

interface Props { params: Promise<{ locale: string }> }

const EXAMPLE_QUERIES = [
  {
    name: "Get current account context",
    query: `query Me {
  me {
    organization { id name plan }
    apiKey { prefix scope name }
    quotas {
      projects { used limit }
      reports { used limit }
    }
  }
}`,
  },
  {
    name: "List recent projects",
    query: `query Projects($page: Int, $pageSize: Int) {
  projects(page: $page, pageSize: $pageSize) {
    data {
      id
      name
      surfaceM2
      buildingType
      status
      createdAt
    }
    pagination { total page hasMore }
  }
}`,
  },
  {
    name: "Get project detail",
    query: `query Project($id: ID!) {
  project(id: $id) {
    id
    name
    address
    surfaceM2
    buildingType
    constructionYear
    status
    createdAt
  }
}`,
  },
  {
    name: "Create project",
    query: `mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    id
    name
    createdAt
  }
}

# Variables :
# {
#   "input": {
#     "name": "Maison Dupont",
#     "surfaceM2": 95,
#     "buildingType": "maison",
#     "constructionYear": 1978
#   }
# }`,
  },
  {
    name: "Queue a report",
    query: `mutation QueueReport($projectId: ID!, $input: QueueReportInput!) {
  queueReport(projectId: $projectId, input: $input) {
    id
    status
    template
    createdAt
  }
}

# Variables :
# {
#   "projectId": "clx...",
#   "input": {
#     "template": "AUDIT_PARTICULIER",
#     "mode": "complet",
#     "locale": "fr"
#   }
# }`,
  },
  {
    name: "List active catalog overrides",
    query: `query Overrides {
  appliedOverrides {
    kind
    entryId
    canonicalName
    overriddenFields
    reason
    updatedAt
  }
}`,
  },
];

export default async function GraphQLDocsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <div className="border-b border-stone-200 bg-gradient-to-r from-purple-50 to-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
            GraphQL API · Expérimental
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            GraphQL Explorer
          </h1>
          <p className="mt-3 max-w-2xl text-stone-700">
            Explorez le schéma GraphQL Réno·Calc Pro v1 (expérimental, gated par feature flag <code className="rounded bg-purple-100 px-1.5 py-0.5 text-xs">GRAPHQL_API</code>).
            Authentification Bearer requise (clé API <a href={`/${locale}/help/api-key`} className="font-semibold text-purple-700 hover:underline">obtenue depuis vos paramètres org</a>).
          </p>

          <div className="mt-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>⚠ Expérimental</strong> : ce schéma peut évoluer sans préavis pendant la phase beta. Pour la stabilité, utilisez l'<a href={`/${locale}/api-docs`} className="font-semibold underline">API REST v1</a>.
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href="/api/v1/graphql" className="rounded-md border border-purple-600 bg-white px-4 py-2 font-semibold text-purple-700 hover:bg-purple-50">
              📥 Télécharger SDL
            </a>
            <a href={`/${locale}/api-docs`} className="rounded-md border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-700 hover:bg-stone-100">
              📚 REST API v1
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Exemples */}
        <section className="mb-8">
          <h2 className="font-serif text-2xl font-semibold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            Exemples de requêtes
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Copier-coller dans GraphiQL ci-dessous, ajouter votre token Bearer dans Headers : <code className="rounded bg-stone-100 px-1.5 py-0.5">Authorization: Bearer rnc_live_xxx.yyy</code>
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {EXAMPLE_QUERIES.map((ex, i) => (
              <details key={i} className="rounded-xl border border-stone-200 bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-stone-900 hover:text-purple-700">
                  📘 {ex.name}
                </summary>
                <pre className="mt-3 max-h-72 overflow-auto rounded bg-stone-900 p-3 text-xs text-stone-100">
                  <code>{ex.query}</code>
                </pre>
              </details>
            ))}
          </div>
        </section>

        {/* GraphiQL embed */}
        <section>
          <h2 className="font-serif text-2xl font-semibold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            GraphiQL Explorer
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Ajoutez votre token dans le panneau "Headers" en bas, puis exécutez vos requêtes.
          </p>

          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/graphiql/3.7.1/graphiql.min.css" />
          <div id="graphiql" style={{ height: "70vh", marginTop: "1rem" }} className="rounded-xl border border-stone-200 bg-white" />
          <script
            crossOrigin="anonymous"
            src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"
            defer
          />
          <script
            crossOrigin="anonymous"
            src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"
            defer
          />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/graphiql/3.7.1/graphiql.min.js" defer />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.addEventListener('load', function () {
                  if (typeof GraphiQL === 'undefined' || typeof React === 'undefined') return;
                  const fetcher = GraphiQL.createFetcher({ url: '/api/v1/graphql' });
                  ReactDOM.createRoot(document.getElementById('graphiql')).render(
                    React.createElement(GraphiQL, {
                      fetcher: fetcher,
                      defaultHeaders: '{"Authorization":"Bearer rnc_live_xxx.yyy"}',
                      defaultQuery: \`# Bienvenue dans GraphiQL\\n# 1. Ajoutez votre token dans Headers ci-dessous\\n# 2. Tapez votre requête ici\\n\\nquery Me {\\n  me {\\n    organization { name plan }\\n  }\\n}\`,
                    })
                  );
                });
              `,
            }}
          />
        </section>

        <section className="mt-12 rounded-xl border border-stone-200 bg-stone-50 p-5 text-sm">
          <h3 className="font-semibold text-stone-900">📐 Limites & versioning</h3>
          <ul className="mt-3 space-y-1 text-stone-700">
            <li>• <strong>Endpoint</strong> : <code>POST https://renocalcpro.fr/api/v1/graphql</code></li>
            <li>• <strong>Auth</strong> : Bearer token comme REST (BASIC scope min, FULL pour mutations)</li>
            <li>• <strong>Rate-limit</strong> : 60 req/min (BASIC) ou 600 req/min (FULL) — partagé avec REST</li>
            <li>• <strong>Pas de subscriptions</strong> en v1 (pas de WebSocket support)</li>
            <li>• <strong>Introspection</strong> : disponible via <code>GET /api/v1/graphql</code> (SDL brut)</li>
            <li>• <strong>Breaking changes</strong> : possible en bêta — abonnez-vous au <a href={`/${locale}/changelog`} className="font-semibold text-purple-700 hover:underline">changelog</a></li>
          </ul>
        </section>
      </div>
    </>
  );
}
