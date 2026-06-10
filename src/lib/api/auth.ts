// lib/api/auth.ts
// Auth Bearer pour l'API publique v1.
// Gate par feature flag REST_API + scope (BASIC = lecture, FULL = écriture).
// Rate-limit en mémoire fallback si Redis absent (60 req/min basic, 600 req/min full).

import { prisma } from "@/lib/db/client";
import { canUse } from "@/lib/features/canUse";
import { rateLimitForPath } from "@/lib/security/rateLimit";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import type { ApiKey, ApiScope } from "@prisma/client";

export interface AuthedRequest {
  apiKey: ApiKey;
  organizationId: string;
}

export type ApiAuthResult =
  | { ok: true; auth: AuthedRequest }
  | { ok: false; status: number; error: string; details?: unknown };

/**
 * Extrait + valide la clé API du header `Authorization: Bearer <prefix>.<secret>`.
 * Vérifie REST_API feature flag, scope, expiration, révocation.
 * Rate-limit appliqué (60 req/min basic, 600 req/min full).
 */
export async function authenticateApiRequest(
  req: NextRequest,
  requiredScope: ApiScope = "BASIC",
): Promise<ApiAuthResult> {
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+([\w-]+)\.([\w-]+)$/);
  if (!m) {
    return { ok: false, status: 401, error: "missing_or_malformed_bearer_token" };
  }
  const [, prefix, secret] = m;

  const apiKey = await prisma.apiKey.findUnique({ where: { prefix } });
  if (!apiKey) return { ok: false, status: 401, error: "invalid_api_key" };
  if (apiKey.revokedAt) return { ok: false, status: 401, error: "key_revoked" };
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { ok: false, status: 401, error: "key_expired" };
  }

  const valid = await bcrypt.compare(`${prefix}.${secret}`, apiKey.secretHash);
  if (!valid) return { ok: false, status: 401, error: "invalid_api_key" };

  // Scope check : FULL accepte tout, BASIC refuse les endpoints FULL.
  if (requiredScope === "FULL" && apiKey.scope !== "FULL") {
    return { ok: false, status: 403, error: "scope_insufficient", details: { required: "FULL", current: apiKey.scope } };
  }

  // Feature flag REST_API gate
  const can = await canUse(apiKey.organizationId, "REST_API");
  if (!can.allowed) {
    return { ok: false, status: 402, error: "rest_api_not_enabled_for_plan", details: { reason: can.reason } };
  }

  // CORS allowedOrigins gate
  const cors = checkOrigin(req, apiKey.allowedOrigins);
  if (!cors.allowed) {
    return { ok: false, status: 403, error: "origin_not_allowed", details: { origin: cors.originHeader } };
  }

  // Rate-limit (réutilise la stack Redis générique si présente)
  const rl = await rateLimitForPath(req.nextUrl.pathname, req);
  if (rl && !rl.success) {
    return {
      ok: false,
      status: 429,
      error: "rate_limit_exceeded",
      details: { limit: rl.limit, retryAfterSec: rl.retryAfterSec },
    };
  }

  // Update lastUsedAt (best-effort, fire-and-forget)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        lastUsedIp: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null,
      },
    })
    .catch(() => undefined);

  return { ok: true, auth: { apiKey, organizationId: apiKey.organizationId } };
}

/**
 * Helper pour générer une réponse JSON erreur normalisée.
 */
export function apiError(status: number, error: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({
      error,
      ...(details ? { details } : {}),
      docs_url: "https://renocalcpro.fr/api-docs",
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/**
 * Helper pour générer une réponse JSON OK normalisée avec headers de version.
 */
export function apiJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Version": "1.0",
    },
  });
}

/**
 * Vérifie l'origine de la requête contre `apiKey.allowedOrigins`.
 * - Liste vide ⇒ tout autorisé (mode serveur-à-serveur, pas de CORS strict)
 * - Liste non vide ⇒ origine doit matcher exactement (protocol+host+port)
 * Returns: { allowed: boolean, originHeader: string | null }
 */
export function checkOrigin(req: NextRequest, allowedOrigins: string[]): { allowed: boolean; originHeader: string | null } {
  const origin = req.headers.get("origin");
  if (allowedOrigins.length === 0) return { allowed: true, originHeader: origin };
  if (!origin) return { allowed: true, originHeader: null }; // Server-side calls (no Origin)
  return { allowed: allowedOrigins.includes(origin), originHeader: origin };
}

/**
 * Construit les headers CORS pour la réponse.
 * Si origin est null ou liste vide → echo `*` (mais sans crédentials).
 * Sinon → echo strict de l'origin validée.
 */
export function corsHeaders(origin: string | null, allowList: string[]): HeadersInit {
  const allowOrigin =
    allowList.length === 0 ? "*" : (origin && allowList.includes(origin) ? origin : "null");
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Réponse pour OPTIONS preflight. */
export function corsPreflight(req: NextRequest, allowList: string[] = []): Response {
  const origin = req.headers.get("origin");
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin, allowList),
  });
}
