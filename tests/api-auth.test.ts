// tests/api-auth.test.ts — Couverture du parsing Bearer + format des erreurs.
// Pour les tests d'intégration complets (bcrypt + Prisma + canUse + rate-limit),
// voir tests/e2e/api-v1.spec.ts qui utilise un mock DB en SQLite.

import { describe, it, expect } from "vitest";
import { apiError, apiJson } from "@/lib/api/auth";

describe("apiError", () => {
  it("retourne une Response 401 avec error JSON", async () => {
    const r = apiError(401, "invalid_api_key");
    expect(r.status).toBe(401);
    expect(r.headers.get("Content-Type")).toContain("application/json");
    const body = await r.json();
    expect(body.error).toBe("invalid_api_key");
    expect(body.docs_url).toContain("renocalcpro.fr");
  });

  it("inclut details si fournis", async () => {
    const r = apiError(429, "rate_limit_exceeded", { limit: 60, retryAfterSec: 12 });
    const body = await r.json();
    expect(body.details).toEqual({ limit: 60, retryAfterSec: 12 });
  });

  it("ne pose pas details si absent", async () => {
    const r = apiError(404, "not_found");
    const body = await r.json();
    expect(body).not.toHaveProperty("details");
  });
});

describe("apiJson", () => {
  it("default 200 + Content-Type JSON + X-Api-Version", async () => {
    const r = apiJson({ ok: true });
    expect(r.status).toBe(200);
    expect(r.headers.get("Content-Type")).toContain("application/json");
    expect(r.headers.get("X-Api-Version")).toBe("1.0");
    expect(await r.json()).toEqual({ ok: true });
  });

  it("respecte le statut custom", () => {
    const r = apiJson({ id: "x" }, 201);
    expect(r.status).toBe(201);
  });
});

describe("Bearer token format (regex parsing)", () => {
  // Réplique du regex utilisé dans authenticateApiRequest pour smoketest
  const BEARER_RE = /^Bearer\s+([\w-]+)\.([\w-]+)$/;

  it("accepte un Bearer bien formé", () => {
    const m = "Bearer rnc_live_a1b2c3d4.xxxxxxxxyyyyyyyy".match(BEARER_RE);
    expect(m).not.toBeNull();
    expect(m![1]).toBe("rnc_live_a1b2c3d4");
    expect(m![2]).toBe("xxxxxxxxyyyyyyyy");
  });

  it("rejette si pas de point séparateur", () => {
    expect("Bearer rnc_live_abc".match(BEARER_RE)).toBeNull();
  });

  it("rejette si pas de 'Bearer ' prefix", () => {
    expect("Token rnc_live_a.b".match(BEARER_RE)).toBeNull();
  });

  it("rejette si vide", () => {
    expect("".match(BEARER_RE)).toBeNull();
  });

  it("rejette si caractères spéciaux dans le token", () => {
    expect("Bearer rnc/live.xx".match(BEARER_RE)).toBeNull();
    expect("Bearer rnc_live.x x".match(BEARER_RE)).toBeNull();
  });
});
