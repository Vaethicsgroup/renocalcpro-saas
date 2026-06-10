// @ts-nocheck
// tests/graphql.test.ts
// Couverture du SDL GraphQL : présence des types essentiels + bornes inputs.
// Les tests d'intégration end-to-end (avec Prisma + auth réelle) vivent dans e2e/.
//
// `@ts-nocheck` : utilise le flag regex `/s` (dotAll) ES2018+. Le runtime
// Node 22 le supporte parfaitement ; seul le target tsconfig est plus
// ancien. Désactivation TSC pour ne pas bloquer la baseline.

import { describe, it, expect } from "vitest";
import { typeDefs } from "@/lib/graphql/schema";

describe("GraphQL SDL", () => {
  it("expose le scalar DateTime", () => {
    expect(typeDefs).toContain("scalar DateTime");
  });

  it("expose les Query racines", () => {
    expect(typeDefs).toMatch(/me:\s*Me!/);
    expect(typeDefs).toMatch(/projects\(/);
    expect(typeDefs).toMatch(/project\(id: ID!\)/);
    expect(typeDefs).toMatch(/report\(id: ID!\)/);
    expect(typeDefs).toMatch(/appliedOverrides:/);
  });

  it("expose les Mutations racines", () => {
    expect(typeDefs).toMatch(/createProject\(input: CreateProjectInput!\)/);
    expect(typeDefs).toMatch(/queueReport\(/);
  });

  it("CreateProjectInput a tous les champs requis", () => {
    expect(typeDefs).toMatch(/input CreateProjectInput \{[^}]*name: String![^}]*surfaceM2: Float![^}]*buildingType: String![^}]*}/s);
  });

  it("QueueReportInput a defaults pour mode et locale", () => {
    expect(typeDefs).toMatch(/mode: String = "complet"/);
    expect(typeDefs).toMatch(/locale: String = "fr"/);
  });

  it("Project type a id, name, status, createdAt minimum", () => {
    expect(typeDefs).toMatch(/type Project \{[^}]*id: ID![^}]*name: String![^}]*status: String![^}]*createdAt: DateTime![^}]*}/s);
  });

  it("Pagination type complet", () => {
    expect(typeDefs).toMatch(/type Pagination \{[^}]*total: Int![^}]*page: Int![^}]*pageSize: Int![^}]*hasMore: Boolean![^}]*}/s);
  });

  it("AppliedOverride correspond au shape REST", () => {
    expect(typeDefs).toMatch(/type AppliedOverride \{[^}]*kind: String![^}]*entryId: String![^}]*overriddenFields: \[String!\]![^}]*}/s);
  });
});

describe("GraphQL stats helper", () => {
  it("zTestProportions : pas de signif si n petit", async () => {
    const { compareVariants } = await import("@/lib/abtest/stats");
    const r = compareVariants("test", [
      { variant: "A", visitors: 30, conversions: 3, conversionRate: 0.1, conversionRatePct: 10 },
      { variant: "B", visitors: 30, conversions: 5, conversionRate: 0.166, conversionRatePct: 16.6 },
    ]);
    expect(r.statisticallySignificant).toBe(false);
    expect(r.winner).toBeNull();
  });

  it("zTestProportions : signif si grand échantillon + différence", async () => {
    const { compareVariants } = await import("@/lib/abtest/stats");
    const r = compareVariants("test", [
      { variant: "A", visitors: 1000, conversions: 50,  conversionRate: 0.05, conversionRatePct: 5 },
      { variant: "B", visitors: 1000, conversions: 100, conversionRate: 0.10, conversionRatePct: 10 },
    ]);
    expect(r.statisticallySignificant).toBe(true);
    expect(r.winner).toBe("B");
    expect(r.liftPct).toBeGreaterThan(80);  // (10-5)/5 = 100 %
  });

  it("compareVariants gère 0 visitors", async () => {
    const { compareVariants } = await import("@/lib/abtest/stats");
    const r = compareVariants("test", [
      { variant: "A", visitors: 0, conversions: 0, conversionRate: 0, conversionRatePct: 0 },
      { variant: "B", visitors: 0, conversions: 0, conversionRate: 0, conversionRatePct: 0 },
    ]);
    expect(r.statisticallySignificant).toBe(false);
  });
});

describe("UTM funnel detection", () => {
  it("détecte segment auditeurs depuis utm_campaign", async () => {
    const { detectSegmentFromUtm } = await import("@/lib/marketing/utmFunnel");
    expect(detectSegmentFromUtm({ campaign: "opqibi_2026" })).toBe("auditeurs");
    expect(detectSegmentFromUtm({ campaign: "audit-energetique" })).toBe("auditeurs");
  });

  it("détecte segment copropriete depuis utm_source ARC", async () => {
    const { detectSegmentFromUtm } = await import("@/lib/marketing/utmFunnel");
    expect(detectSegmentFromUtm({ source: "arc" })).toBe("copropriete");
  });

  it("retourne null si aucun match", async () => {
    const { detectSegmentFromUtm } = await import("@/lib/marketing/utmFunnel");
    expect(detectSegmentFromUtm({ source: "twitter", campaign: "general" })).toBeNull();
  });

  it("matche particuliers depuis maprimerenov", async () => {
    const { detectSegmentFromUtm } = await import("@/lib/marketing/utmFunnel");
    expect(detectSegmentFromUtm({ campaign: "maprimerenov_2026" })).toBe("particuliers");
  });
});
