// tests/ai-assistant-extended.test.ts
// Tests Sprint 27 : i18n locale-aware, abtest-prompt, knowledge étendu, sanitizer edge cases.

import { describe, it, expect } from "vitest";
import { getFieldHelpI18n, getAidExplainI18n, getI18nCoverage } from "@/lib/ai/assistant/knowledge/i18n";
import { selectPromptVersion, computeHelpfulRateByVersion } from "@/lib/ai/assistant/abtest-prompt";
import { sanitizeText, sanitizeObject } from "@/lib/ai/assistant/sanitizer";
import { getRecognizeGuide } from "@/lib/ai/assistant/knowledge/recognize";
import { getComparator } from "@/lib/ai/assistant/knowledge/comparators";
import { getFieldHelp } from "@/lib/ai/assistant/knowledge/field-help";

describe("i18n — FIELD_HELP locale-aware", () => {
  it("retourne FR par défaut", () => {
    const help = getFieldHelpI18n("project.surfaceM2");
    expect(help?.label).toContain("Surface");
  });

  it("retourne EN si locale=en", () => {
    const help = getFieldHelpI18n("project.surfaceM2", "en");
    expect(help?.label).toContain("Habitable surface");
    expect(help?.whatToPut).toContain("loi Carrez");
  });

  it("retourne ES si locale=es", () => {
    const help = getFieldHelpI18n("project.surfaceM2", "es");
    expect(help?.label).toContain("Superficie");
  });

  it("retourne DE si locale=de", () => {
    const help = getFieldHelpI18n("project.surfaceM2", "de");
    expect(help?.label).toContain("Wohnfläche");
  });

  it("retourne PT si locale=pt", () => {
    const help = getFieldHelpI18n("project.surfaceM2", "pt");
    expect(help?.label).toContain("Superfície");
  });

  it("fallback FR si traduction manquante", () => {
    // Champ qui n'a PAS de traduction EN — fallback FR
    const help = getFieldHelpI18n("project.numberOfLevels", "en");
    expect(help).not.toBeNull();
    expect(help?.label).toBeTruthy();
  });

  it("retourne null si champ inexistant", () => {
    expect(getFieldHelpI18n("foo.bar", "fr")).toBeNull();
    expect(getFieldHelpI18n("foo.bar", "en")).toBeNull();
  });
});

describe("i18n — AIDS_HELP locale-aware", () => {
  it("ES retourne IVA reducido", () => {
    const aid = getAidExplainI18n("tva_reduite", "es");
    expect(aid?.label).toContain("IVA");
  });

  it("DE retourne MwSt", () => {
    const aid = getAidExplainI18n("tva_reduite", "de");
    expect(aid?.label).toContain("MwSt");
  });

  it("PT retourne IVA reduzido", () => {
    const aid = getAidExplainI18n("tva_reduite", "pt");
    expect(aid?.label).toContain("IVA");
  });
});

describe("i18n — coverage stats", () => {
  it("FR à 100%", () => {
    const cov = getI18nCoverage();
    expect(cov.fr.pct).toBe(100);
  });

  it("EN > 0% (au moins 5 champs traduits)", () => {
    const cov = getI18nCoverage();
    expect(cov.en.fields).toBeGreaterThanOrEqual(5);
  });

  it("ES/DE/PT > 0% Sprint 27", () => {
    const cov = getI18nCoverage();
    expect(cov.es.pct).toBeGreaterThan(0);
    expect(cov.de.pct).toBeGreaterThan(0);
    expect(cov.pt.pct).toBeGreaterThan(0);
  });
});

describe("abtest-prompt — selectPromptVersion", () => {
  it("retourne control si treatmentPct=0", () => {
    const v = selectPromptVersion("org-123", { control: "v1.2026-05", treatment: "v2.2026-06", treatmentPct: 0 });
    expect(v).toBe("v1.2026-05");
  });

  it("retourne treatment si treatmentPct=100", () => {
    const v = selectPromptVersion("org-123", { control: "v1.2026-05", treatment: "v2.2026-06", treatmentPct: 100 });
    expect(v).toBe("v2.2026-06");
  });

  it("est deterministic pour la même org", () => {
    const config = { control: "v1.2026-05" as const, treatment: "v2.2026-06" as const, treatmentPct: 50 };
    const v1 = selectPromptVersion("org-stable-id", config);
    const v2 = selectPromptVersion("org-stable-id", config);
    expect(v1).toBe(v2);
  });

  it("force whitelist", () => {
    const v = selectPromptVersion("org-X", {
      control: "v1.2026-05", treatment: "v2.2026-06", treatmentPct: 0,
      forceTreatmentOrgIds: ["org-X"],
    });
    expect(v).toBe("v2.2026-06");
  });

  it("force blacklist", () => {
    const v = selectPromptVersion("org-Y", {
      control: "v1.2026-05", treatment: "v2.2026-06", treatmentPct: 100,
      forceControlOrgIds: ["org-Y"],
    });
    expect(v).toBe("v1.2026-05");
  });
});

describe("abtest-prompt — computeHelpfulRateByVersion", () => {
  it("agrège correctement", () => {
    const stats = computeHelpfulRateByVersion([
      { promptVersion: "v1", feedbackHelpful: true },
      { promptVersion: "v1", feedbackHelpful: false },
      { promptVersion: "v1", feedbackHelpful: true },
      { promptVersion: "v2", feedbackHelpful: true },
      { promptVersion: "v2", feedbackHelpful: true },
    ]);
    const v1 = stats.find(s => s.version === "v1");
    const v2 = stats.find(s => s.version === "v2");
    expect(v1?.helpfulRatePct).toBeCloseTo(66.66, 1);
    expect(v2?.helpfulRatePct).toBe(100);
  });

  it("ignore feedback null", () => {
    const stats = computeHelpfulRateByVersion([
      { promptVersion: "v1", feedbackHelpful: null },
      { promptVersion: "v1", feedbackHelpful: true },
    ]);
    expect(stats[0].totalFeedback).toBe(1);
  });
});

describe("knowledge étendu Sprint 26 — vérif présence", () => {
  it("nouveaux champs FIELD_HELP existent", () => {
    expect(getFieldHelp("envelope.windows.totalAreaM2")).not.toBeNull();
    expect(getFieldHelp("systems.heating.distribution")).not.toBeNull();
    expect(getFieldHelp("systems.cooling.kind")).not.toBeNull();
    expect(getFieldHelp("comfort.summerComplaints")).not.toBeNull();
  });

  it("nouveaux RECOGNIZE_GUIDES existent", () => {
    expect(getRecognizeGuide("wall:pisé")).not.toBeNull();
    expect(getRecognizeGuide("wall:torchis")).not.toBeNull();
    expect(getRecognizeGuide("insulation:ouate_cellulose")).not.toBeNull();
    expect(getRecognizeGuide("system:photovoltaique")).not.toBeNull();
    expect(getRecognizeGuide("system:vmc_double_flux")).not.toBeNull();
  });

  it("nouveaux COMPARATORS existent", () => {
    expect(getComparator("roof_insulation")).not.toBeNull();
    expect(getComparator("dhw_change")).not.toBeNull();
    expect(getComparator("ventilation_choice")).not.toBeNull();
    expect(getComparator("glazing_change")).not.toBeNull();
  });

  it("comparateur roof_insulation a 3 options", () => {
    const c = getComparator("roof_insulation");
    expect(c?.options.length).toBeGreaterThanOrEqual(3);
  });
});

describe("sanitizer — edge cases supplémentaires", () => {
  it("masque plusieurs emails dans le même texte", () => {
    const out = sanitizeText("emails : a@b.com et c@d.fr et e@f.org");
    expect((out.match(/\[email\]/g) ?? []).length).toBe(3);
  });

  it("préserve texte sans PII", () => {
    const text = "Mur en pierre de 60 cm avec isolation laine de roche 10 cm";
    expect(sanitizeText(text)).toBe(text);
  });

  it("sanitizeObject sur tableau imbriqué", () => {
    const out = sanitizeObject({
      items: [{ email: "x@y.z", note: "ok" }, { password: "secret" }],
    });
    const obj = out as { items: Array<{ email?: string; note?: string; password?: string }> };
    expect(obj.items[0].email).toBe("[redacted]"); // clé sensible
    expect(obj.items[0].note).toBe("ok");
    expect(obj.items[1].password).toBe("[redacted]");
  });

  it("ne casse pas null/undefined", () => {
    expect(sanitizeObject(null)).toBeNull();
    expect(sanitizeObject(undefined)).toBeUndefined();
  });
});
