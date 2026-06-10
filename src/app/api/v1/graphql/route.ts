// app/api/v1/graphql/route.ts
// GraphQL endpoint expérimental — gated par feature flag GRAPHQL_API.
// Utilise un mini-runner GraphQL fait main pour éviter dep lourde graphql-yoga.
// (Pour prod sérieuse : passer à @apollo/server ou graphql-yoga.)

import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api/auth";
import { isFlagEnabled } from "@/lib/featureFlags/runtime";
import { typeDefs } from "@/lib/graphql/schema";
import { resolvers } from "@/lib/graphql/resolvers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export async function POST(req: NextRequest) {
  // 1. Authentification (réutilise stack API REST)
  const authResult = await authenticateApiRequest(req, "BASIC");
  if (!authResult.ok) {
    return NextResponse.json(
      { errors: [{ message: authResult.error, extensions: { code: "UNAUTHENTICATED", status: authResult.status } }] },
      { status: 401 },
    );
  }

  // 2. Feature flag check
  if (!isFlagEnabled("GRAPHQL_API", authResult.auth.organizationId)) {
    return NextResponse.json(
      { errors: [{ message: "graphql_api_not_enabled", extensions: { code: "FEATURE_DISABLED" } }] },
      { status: 403 },
    );
  }

  // 3. Parse body
  let body: GraphQLRequest;
  try { body = await req.json(); }
  catch { return NextResponse.json({ errors: [{ message: "invalid_json_body" }] }, { status: 400 }); }

  if (!body.query) {
    return NextResponse.json({ errors: [{ message: "query_required" }] }, { status: 400 });
  }

  // 4. Mini exécuteur : on supporte uniquement les opérations connues
  // Pour MVP : routing manuel par operationName ou parsing query simple
  // En production : utiliser graphql-yoga ou @apollo/server
  try {
    const result = await executeGraphQL(body, {
      apiKey: authResult.auth.apiKey,
      organizationId: authResult.auth.organizationId,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { errors: [{ message: err instanceof Error ? err.message : String(err) }] },
      { status: 200 },  // GraphQL convention : erreurs métier en 200 OK
    );
  }
}

export async function GET(req: NextRequest) {
  // GET /api/v1/graphql sert le SDL pour introspection statique
  const authResult = await authenticateApiRequest(req, "BASIC");
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  if (!isFlagEnabled("GRAPHQL_API", authResult.auth.organizationId)) {
    return NextResponse.json({ error: "graphql_api_not_enabled" }, { status: 403 });
  }
  return new NextResponse(typeDefs, {
    status: 200,
    headers: { "Content-Type": "application/graphql" },
  });
}

interface RunCtx {
  apiKey: import("@prisma/client").ApiKey;
  organizationId: string;
}

/**
 * Exécuteur minimal — supporte les ops listées via operationName ou pattern matching.
 * NB : Pour MVP démo. Pour prod, utiliser graphql-yoga (5 lignes).
 */
async function executeGraphQL(req: GraphQLRequest, ctx: RunCtx): Promise<{ data?: unknown; errors?: { message: string }[] }> {
  const query = req.query.trim();
  const vars = req.variables ?? {};

  // Détection naive de l'opération
  if (query.includes("query") || query.startsWith("{")) {
    if (query.includes("me")) {
      const data = await resolvers.Query.me(null, null, ctx);
      return { data: { me: data } };
    }
    if (query.includes("appliedOverrides")) {
      const data = await resolvers.Query.appliedOverrides(null, null, ctx);
      return { data: { appliedOverrides: data } };
    }
    if (query.includes("projects(") || query.match(/\bprojects\s*\{/)) {
      const data = await resolvers.Query.projects(null, vars, ctx);
      return { data: { projects: data } };
    }
    if (query.includes("project(")) {
      const id = (vars.id as string) ?? "";
      const data = await resolvers.Query.project(null, { id }, ctx);
      return { data: { project: data } };
    }
    if (query.includes("report(")) {
      const id = (vars.id as string) ?? "";
      const data = await resolvers.Query.report(null, { id }, ctx);
      return { data: { report: data } };
    }
  }

  if (query.includes("mutation")) {
    if (query.includes("createProject")) {
      const input = vars.input as Parameters<typeof resolvers.Mutation.createProject>[1]["input"];
      const data = await resolvers.Mutation.createProject(null, { input }, ctx);
      return { data: { createProject: data } };
    }
    if (query.includes("queueReport")) {
      const input = vars.input as Parameters<typeof resolvers.Mutation.queueReport>[1]["input"];
      const projectId = vars.projectId as string;
      const data = await resolvers.Mutation.queueReport(null, { projectId, input }, ctx);
      return { data: { queueReport: data } };
    }
  }

  return { errors: [{ message: "unsupported_operation — see SDL via GET /api/v1/graphql" }] };
}
