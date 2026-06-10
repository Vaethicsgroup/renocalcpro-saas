// e2e/api-v1-overrides-schemas.spec.ts
// Tests E2E sur les endpoints Sprint 19 : /me/overrides + /schemas/material-patch.json + /schemas/system-patch.json
// + validation patch conforme/non-conforme.

import { test, expect } from "@playwright/test";

const API_TOKEN = process.env.E2E_API_TOKEN ?? "rnc_test_e2e_token.localdev";
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("API v1 — overrides & schemas (Sprint 19) @api", () => {
  test.beforeEach(() => {
    test.skip(!process.env.E2E_API_TOKEN, "E2E_API_TOKEN non défini");
  });

  test("GET /api/v1/me/overrides — retourne data + pagination + note", async ({ request }) => {
    const r = await request.get(`${BASE}/api/v1/me/overrides`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    expect(r.status()).toBe(200);
    expect(r.headers()["x-api-version"]).toBe("1.0");

    const body = await r.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty("pagination");
    expect(body).toHaveProperty("note");

    // Si overrides existent, valider le shape
    if (body.data.length > 0) {
      const first = body.data[0];
      expect(first).toHaveProperty("kind");
      expect(["MATERIAL", "SYSTEM"]).toContain(first.kind);
      expect(first).toHaveProperty("entryId");
      expect(first).toHaveProperty("canonicalName");
      expect(first).toHaveProperty("patch");
      expect(first).toHaveProperty("overriddenFields");
      expect(Array.isArray(first.overriddenFields)).toBe(true);
    }
  });

  test("GET /api/v1/me/overrides — refuse sans token", async ({ request }) => {
    const r = await request.get(`${BASE}/api/v1/me/overrides`);
    expect(r.status()).toBe(401);
  });

  test("GET /api/v1/schemas/material-patch.json — JSON Schema valide Draft 2020-12", async ({ request }) => {
    const r = await request.get(`${BASE}/api/v1/schemas/material-patch.json`);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("application/schema+json");

    const schema = await r.json();
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.title).toBe("MaterialPatch");
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties).toHaveProperty("name");
    expect(schema.properties).toHaveProperty("thermal");
    expect(schema.properties).toHaveProperty("unitPrice");
    expect(schema.properties).toHaveProperty("sources");
    expect(schema.properties).toHaveProperty("carbonFootprint");

    // Bornes des propriétés
    expect(schema.properties.thermal.properties.lambda.minimum).toBe(0.005);
    expect(schema.properties.thermal.properties.lambda.maximum).toBe(5);
    expect(schema.properties.thermal.properties.mass.enum).toEqual([1, 2, 3, 4, 5]);
  });

  test("GET /api/v1/schemas/system-patch.json — JSON Schema valide", async ({ request }) => {
    const r = await request.get(`${BASE}/api/v1/schemas/system-patch.json`);
    expect(r.status()).toBe(200);

    const schema = await r.json();
    expect(schema.title).toBe("SystemPatch");
    expect(schema.properties).toHaveProperty("typicalPerformance");
    expect(schema.properties.unitPrice.maximum).toBe(100000);  // €
  });

  test("Schemas sont publics (pas d'auth requise) + cache headers", async ({ request }) => {
    const r = await request.get(`${BASE}/api/v1/schemas/material-patch.json`);
    expect(r.status()).toBe(200);
    const cacheControl = r.headers()["cache-control"];
    expect(cacheControl).toContain("max-age=");
    expect(cacheControl).toContain("public");
  });

  test("OPTIONS preflight retourne 204 + headers CORS", async ({ request }) => {
    const r = await request.fetch(`${BASE}/api/v1/me/overrides`, { method: "OPTIONS" });
    expect(r.status()).toBe(204);
    expect(r.headers()["access-control-allow-methods"]).toContain("GET");
  });
});

test.describe("Validation patch conforme/non-conforme (via override admin) @api", () => {
  test.skip(true, "Nécessite seed admin user — activer quand fixture e2e admin disponible");

  // Pseudo-test (à activer avec fixture) :
  //   1. Login admin via magic-link mock
  //   2. POST /api/admin/catalog-overrides avec patch conforme schema → 201
  //   3. POST avec patch invalide (lambda: -5) → 400 avec breakdown Zod
  //   4. PATCH avec patch hors-clés autorisées → 400 (additionalProperties: false)
  //   5. DELETE override → 200
});
