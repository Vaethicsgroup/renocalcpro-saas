// tests/professional-profiles.test.ts
// ════════════════════════════════════════════════════════════════════════════
// Tests unitaires sur la résolution de profil professionnel et la cohérence
// des bundles de dashboard mockés.
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  parseProfile,
  slugForProfile,
  getProfileMeta,
  ALL_PROFILES,
  SPECIALISED_PROFILES,
  type ProfessionalProfile,
} from "@/lib/profiles/professional-profiles";
import { getMockDashboardForProfile } from "@/lib/profiles/pro-dashboard.mock";

describe("parseProfile", () => {
  it("retourne PRO_GENERAL pour null/undefined/string vide", () => {
    expect(parseProfile(null)).toBe("PRO_GENERAL");
    expect(parseProfile(undefined)).toBe("PRO_GENERAL");
    expect(parseProfile("")).toBe("PRO_GENERAL");
    expect(parseProfile("   ")).toBe("PRO_GENERAL");
  });

  it("résout les slugs canoniques", () => {
    expect(parseProfile("auditeur")).toBe("AUDITEUR_ENERGETIQUE");
    expect(parseProfile("diagnostiqueur")).toBe("DIAGNOSTIQUEUR");
    expect(parseProfile("syndic")).toBe("SYNDIC");
    expect(parseProfile("bureau-etudes")).toBe("BUREAU_ETUDES_THERMIQUE");
    expect(parseProfile("agence-immobiliere")).toBe("AGENCE_IMMOBILIERE");
    expect(parseProfile("general")).toBe("PRO_GENERAL");
  });

  it("est insensible à la casse", () => {
    expect(parseProfile("AUDITEUR")).toBe("AUDITEUR_ENERGETIQUE");
    expect(parseProfile("Syndic")).toBe("SYNDIC");
    expect(parseProfile("Bureau-Etudes")).toBe("BUREAU_ETUDES_THERMIQUE");
  });

  it("accepte les alias", () => {
    expect(parseProfile("auditeur-energetique")).toBe("AUDITEUR_ENERGETIQUE");
    expect(parseProfile("bet")).toBe("BUREAU_ETUDES_THERMIQUE");
    expect(parseProfile("agence")).toBe("AGENCE_IMMOBILIERE");
  });

  it("accepte les valeurs canoniques UPPER_SNAKE", () => {
    expect(parseProfile("AUDITEUR_ENERGETIQUE")).toBe("AUDITEUR_ENERGETIQUE");
    expect(parseProfile("BUREAU_ETUDES_THERMIQUE")).toBe(
      "BUREAU_ETUDES_THERMIQUE",
    );
  });

  it("tombe sur PRO_GENERAL pour valeurs inconnues", () => {
    expect(parseProfile("notaire")).toBe("PRO_GENERAL");
    expect(parseProfile("xxx")).toBe("PRO_GENERAL");
    expect(parseProfile("12345")).toBe("PRO_GENERAL");
  });

  it("gère les tableaux (Next.js searchParams peut renvoyer string[])", () => {
    expect(parseProfile(["auditeur"])).toBe("AUDITEUR_ENERGETIQUE");
    expect(parseProfile(["syndic", "auditeur"])).toBe("SYNDIC");
    expect(parseProfile([])).toBe("PRO_GENERAL");
  });
});

describe("slugForProfile", () => {
  it("round-trip : tous les profils ont un slug parseable", () => {
    for (const profile of ALL_PROFILES) {
      const slug = slugForProfile(profile);
      expect(parseProfile(slug)).toBe(profile);
    }
  });

  it("retourne des slugs URL-safe (ASCII, kebab-case, pas d'espace)", () => {
    for (const profile of ALL_PROFILES) {
      const slug = slugForProfile(profile);
      expect(slug).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});

describe("getProfileMeta", () => {
  it("retourne des métadonnées non vides pour chaque profil", () => {
    for (const profile of ALL_PROFILES) {
      const meta = getProfileMeta(profile);
      expect(meta.profile).toBe(profile);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.title.length).toBeGreaterThan(0);
      expect(meta.tagline.length).toBeGreaterThan(0);
    }
  });

  it("expose les 5 profils spécialisés", () => {
    expect(SPECIALISED_PROFILES.length).toBe(5);
    expect(SPECIALISED_PROFILES).toContain("AUDITEUR_ENERGETIQUE");
    expect(SPECIALISED_PROFILES).toContain("DIAGNOSTIQUEUR");
    expect(SPECIALISED_PROFILES).toContain("SYNDIC");
    expect(SPECIALISED_PROFILES).toContain("BUREAU_ETUDES_THERMIQUE");
    expect(SPECIALISED_PROFILES).toContain("AGENCE_IMMOBILIERE");
    expect(SPECIALISED_PROFILES).not.toContain("PRO_GENERAL" as ProfessionalProfile);
  });
});

describe("getMockDashboardForProfile", () => {
  it("retourne un bundle complet pour chaque profil", () => {
    for (const profile of ALL_PROFILES) {
      const data = getMockDashboardForProfile(profile);
      expect(data.profile).toBe(profile);
      expect(data.kpis.length).toBeGreaterThan(0);
      expect(data.quickActions.length).toBeGreaterThan(0);
      // priorités peuvent être vides pour le fallback minimal, mais au
      // moins un élément pour les profils spécialisés
      if (profile !== "PRO_GENERAL") {
        expect(data.priorities.length).toBeGreaterThan(0);
        expect(data.alerts.length).toBeGreaterThan(0);
      }
      expect(data.mockNoticeKey.length).toBeGreaterThan(0);
    }
  });

  it("clés KPI uniques par profil", () => {
    for (const profile of ALL_PROFILES) {
      const data = getMockDashboardForProfile(profile);
      const keys = data.kpis.map((k) => k.key);
      const unique = new Set(keys);
      expect(unique.size).toBe(keys.length);
    }
  });

  it("actions rapides : au moins 1 disponible par profil spécialisé", () => {
    for (const profile of SPECIALISED_PROFILES) {
      const data = getMockDashboardForProfile(profile);
      const available = data.quickActions.filter((a) => a.available);
      expect(available.length).toBeGreaterThan(0);
    }
  });

  it("priorités : niveaux d'urgence valides", () => {
    const validLevels = new Set(["high", "medium", "low"]);
    for (const profile of ALL_PROFILES) {
      const data = getMockDashboardForProfile(profile);
      for (const p of data.priorities) {
        expect(validLevels.has(p.level)).toBe(true);
        expect(p.count).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("alertes : niveaux valides", () => {
    const validLevels = new Set(["info", "warning", "danger", "success"]);
    for (const profile of ALL_PROFILES) {
      const data = getMockDashboardForProfile(profile);
      for (const a of data.alerts) {
        expect(validLevels.has(a.level)).toBe(true);
        expect(a.titleKey.length).toBeGreaterThan(0);
        expect(a.descKey.length).toBeGreaterThan(0);
      }
    }
  });
});
