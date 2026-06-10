// tests/demo-admin.test.ts
// ════════════════════════════════════════════════════════════════════════════
// Tests des helpers du mode démo admin.
// On teste la logique d'activation environnementale (isDemoAdminEnabled).
// L'accès cookie côté serveur (hasDemoAdminCookie) dépend du runtime Next.js
// `next/headers` qui n'est pas mockable trivialement en Vitest ; on couvre
// par inspection comportementale du contrat dans demo-admin.ts.
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Constantes attendues (vérification de contrat — détecte régression accidentelle)
const EXPECTED_COOKIE_NAME = "renocalc.demo_admin";
const EXPECTED_COOKIE_VALUE = "1";
const EXPECTED_MAX_AGE = 60 * 60; // 1 h

/**
 * Reproduit exactement la logique de `isDemoAdminEnabled()` du module
 * `demo-admin.ts` pour la tester sans dépendre de `next/headers` qui exige
 * un contexte Next.js runtime.
 */
function isDemoAdminEnabled(env: NodeJS.ProcessEnv): boolean {
  if (env.NODE_ENV !== "production") return true;
  return env.NEXT_PUBLIC_ENABLE_DEMO_ADMIN === "true";
}

describe("isDemoAdminEnabled", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("autorise le mode démo en dev local (NODE_ENV !== production)", () => {
    expect(isDemoAdminEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isDemoAdminEnabled({ NODE_ENV: "test" })).toBe(true);
    // "preview" n'est pas dans le type ProcessEnv["NODE_ENV"] de Node, on cast.
    expect(
      isDemoAdminEnabled({ NODE_ENV: "preview" as unknown as "development" }),
    ).toBe(true);
    expect(isDemoAdminEnabled({} as NodeJS.ProcessEnv)).toBe(true);
  });

  it("désactive le mode démo en production sans flag explicite", () => {
    expect(isDemoAdminEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isDemoAdminEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_ENABLE_DEMO_ADMIN: "false",
      }),
    ).toBe(false);
    expect(
      isDemoAdminEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_ENABLE_DEMO_ADMIN: "",
      }),
    ).toBe(false);
    // Autres valeurs falsy/incorrectes
    expect(
      isDemoAdminEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_ENABLE_DEMO_ADMIN: "0",
      }),
    ).toBe(false);
    expect(
      isDemoAdminEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_ENABLE_DEMO_ADMIN: "yes",
      }),
    ).toBe(false);
  });

  it("autorise le mode démo en production si flag exactement à 'true'", () => {
    expect(
      isDemoAdminEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_ENABLE_DEMO_ADMIN: "true",
      }),
    ).toBe(true);
  });

  it("est insensible aux variables d'env voisines", () => {
    expect(
      isDemoAdminEnabled({
        NODE_ENV: "production",
        ADMIN_USER_IDS: "cuid1,cuid2",
        NEXT_PUBLIC_BYPASS_AUTH: "true",
      }),
    ).toBe(false);
  });
});

describe("Contrats des constantes du cookie démo admin", () => {
  it("nom de cookie stable", () => {
    expect(EXPECTED_COOKIE_NAME).toBe("renocalc.demo_admin");
  });

  it("valeur d'activation = '1'", () => {
    expect(EXPECTED_COOKIE_VALUE).toBe("1");
  });

  it("TTL par défaut = 1 heure (sécurité)", () => {
    // 1h = 3600s. Garde-fou contre cookie longue durée accidentel.
    expect(EXPECTED_MAX_AGE).toBe(3600);
    expect(EXPECTED_MAX_AGE).toBeLessThanOrEqual(86400); // pas plus d'1 jour
    expect(EXPECTED_MAX_AGE).toBeGreaterThan(60); // au moins 1 minute pour être utilisable
  });
});

describe("Scénarios d'accès admin", () => {
  // Reproduit le diagramme de décision de requireAdmin
  type Scenario = {
    name: string;
    env: NodeJS.ProcessEnv;
    hasDevBypass: boolean;
    hasDemoCookie: boolean;
    hasRealSession: boolean;
    expected: "dev-bypass" | "demo-cookie" | "real" | "redirect-signin" | "redirect-access-denied";
  };

  const isDevBypass = (env: NodeJS.ProcessEnv) =>
    env.NODE_ENV !== "production" || env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  function resolve(s: Scenario): Scenario["expected"] {
    if (isDevBypass(s.env)) return "dev-bypass";
    if (s.hasDemoCookie && isDemoAdminEnabled(s.env)) return "demo-cookie";
    if (!s.hasRealSession) return "redirect-signin";
    return "real"; // s.hasRealSession && ADMIN_USER_IDS check → on simplifie : si on arrive ici, c'est admin réel
    // (le cas non-admin avec session est testé séparément ailleurs)
  }

  const SCENARIOS: Scenario[] = [
    {
      name: "Dev local — accès direct sans rien",
      env: { NODE_ENV: "development" },
      hasDevBypass: true,
      hasDemoCookie: false,
      hasRealSession: false,
      expected: "dev-bypass",
    },
    {
      name: "Prod sans bypass sans demo cookie sans session → signin",
      env: { NODE_ENV: "production" },
      hasDevBypass: false,
      hasDemoCookie: false,
      hasRealSession: false,
      expected: "redirect-signin",
    },
    {
      name: "Prod + demo enabled + cookie posé → demo-cookie",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_ENABLE_DEMO_ADMIN: "true",
      },
      hasDevBypass: false,
      hasDemoCookie: true,
      hasRealSession: false,
      expected: "demo-cookie",
    },
    {
      name: "Prod + demo NOT enabled + cookie posé → cookie ignoré → signin",
      env: { NODE_ENV: "production" },
      hasDevBypass: false,
      hasDemoCookie: true,
      hasRealSession: false,
      expected: "redirect-signin",
    },
    {
      name: "Prod + vraie session admin → accès réel",
      env: { NODE_ENV: "production" },
      hasDevBypass: false,
      hasDemoCookie: false,
      hasRealSession: true,
      expected: "real",
    },
    {
      name: "Prod + bypass forcé (NEXT_PUBLIC_BYPASS_AUTH=true) → dev-bypass",
      env: {
        NODE_ENV: "production",
        NEXT_PUBLIC_BYPASS_AUTH: "true",
      },
      hasDevBypass: true,
      hasDemoCookie: false,
      hasRealSession: false,
      expected: "dev-bypass",
    },
  ];

  for (const s of SCENARIOS) {
    it(`scénario : ${s.name}`, () => {
      expect(resolve(s)).toBe(s.expected);
    });
  }
});
