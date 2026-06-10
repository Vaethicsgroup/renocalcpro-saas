// tests/ai-assistant.test.ts
// Tests Vitest pour l'assistant IA métier — sanitizer, knowledge, guards, prompt builder.

import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeObject, buildAnonymousProjectSnapshot } from "@/lib/ai/assistant/sanitizer";
import { applyGuards } from "@/lib/ai/assistant/guards";
import { getFieldHelp, searchFieldHelp } from "@/lib/ai/assistant/knowledge/field-help";
import { getSectionHelp } from "@/lib/ai/assistant/knowledge/section-help";
import { getRecognizeGuide, listRecognizeGuides } from "@/lib/ai/assistant/knowledge/recognize";
import { getComparator } from "@/lib/ai/assistant/knowledge/comparators";
import { getAidExplain } from "@/lib/ai/assistant/knowledge/aids-help";
import { buildKnowledgeSlice } from "@/lib/ai/assistant/context-builder";
import { buildSystemPrompt } from "@/lib/ai/assistant/prompts";

describe("sanitizer — RGPD PII masking", () => {
  it("masque emails", () => {
    expect(sanitizeText("Mon email est jean@example.com merci")).toContain("[email]");
    expect(sanitizeText("Mon email est jean@example.com")).not.toContain("jean@example.com");
  });

  it("masque téléphones FR", () => {
    expect(sanitizeText("Appelez-moi au 06 12 34 56 78")).toContain("[téléphone]");
    expect(sanitizeText("Mon n° est +33 6 12 34 56 78")).toContain("[téléphone]");
  });

  it("masque IBAN", () => {
    expect(sanitizeText("IBAN FR76 3000 6000 0112 3456 7890 189")).toContain("[IBAN]");
  });

  it("masque NIR (numéro sécu)", () => {
    expect(sanitizeText("NIR 1850178123456 78")).toContain("[n° sécu]");
  });

  it("masque adresse précise si maskAddress=true", () => {
    const out = sanitizeText("J'habite 12 rue de la Paix 75001 Paris", { maskAddress: true });
    expect(out).toContain("[adresse]");
    expect(out).toContain("75001");
  });

  it("masque noms si maskNames=true", () => {
    expect(sanitizeText("M. Jean Dupont", { maskNames: true })).toContain("[nom]");
  });

  it("strippe clés sensibles dans objet", () => {
    const sanitized = sanitizeObject({ name: "Test", password: "secret123", token: "abc", nested: { apiKey: "xxx" } });
    expect(sanitized).toEqual({ name: "Test", password: "[redacted]", token: "[redacted]", nested: { apiKey: "[redacted]" } });
  });

  it("buildAnonymousProjectSnapshot retourne JSON < 4000 chars", () => {
    const snapshot = buildAnonymousProjectSnapshot({
      ownerName: "Jean Dupont",
      ownerEmail: "jean@example.com",
      address: "12 rue de la Paix 75001 Paris",
      surface: 120,
      buildingYear: 1975,
    });
    expect(snapshot.length).toBeLessThan(4000);
    expect(snapshot).toContain("[email]");
    expect(snapshot).toContain("[adresse]");
  });
});

describe("knowledge — field help", () => {
  it("récupère un champ existant", () => {
    const help = getFieldHelp("project.surfaceM2");
    expect(help).not.toBeNull();
    expect(help?.label).toContain("Surface");
    expect(help?.whatToPut).toBeTruthy();
    expect(help?.howToMeasure).toBeTruthy();
    expect(help?.whyUseful).toBeTruthy();
  });

  it("retourne null pour champ inexistant", () => {
    expect(getFieldHelp("foo.bar.baz")).toBeNull();
  });

  it("recherche fuzzy", () => {
    const results = searchFieldHelp("matériau");
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("knowledge — section help", () => {
  it("récupère section project", () => {
    const help = getSectionHelp("project");
    expect(help?.label).toContain("Identification");
    expect(help?.criticalFields.length).toBeGreaterThan(0);
  });

  it("récupère section envelope", () => {
    const help = getSectionHelp("envelope");
    expect(help?.estimatedMinutes).toBeGreaterThan(0);
  });
});

describe("knowledge — recognize", () => {
  it("récupère guide moellons", () => {
    const guide = getRecognizeGuide("wall:moellons");
    expect(guide?.category).toBe("material");
    expect(guide?.visualClues.length).toBeGreaterThan(0);
    expect(guide?.distinguishFrom.length).toBeGreaterThan(0);
  });

  it("liste les guides materials", () => {
    const guides = listRecognizeGuides("material");
    expect(guides.length).toBeGreaterThan(2);
  });

  it("liste les guides systems", () => {
    const guides = listRecognizeGuides("system");
    expect(guides.length).toBeGreaterThan(0);
  });
});

describe("knowledge — comparators", () => {
  it("récupère comparateur isolation murs", () => {
    const c = getComparator("wall_insulation");
    expect(c?.options.length).toBeGreaterThanOrEqual(3);
    expect(c?.axes.length).toBeGreaterThanOrEqual(5);
    expect(c?.recommendationByProfile.length).toBeGreaterThan(0);
  });

  it("récupère comparateur chauffage fioul", () => {
    const c = getComparator("heating_change_for_oil_house");
    expect(c?.options.some(o => o.key === "pac_air_eau")).toBe(true);
  });
});

describe("knowledge — aids", () => {
  it("récupère MPR classique", () => {
    const a = getAidExplain("mpr_classique");
    expect(a?.label).toContain("MaPrimeRénov");
    expect(a?.eligibilityConditions.length).toBeGreaterThan(0);
  });

  it("récupère TVA réduite", () => {
    const a = getAidExplain("tva_reduite");
    expect(a?.cumulableWith.length).toBeGreaterThan(0);
  });
});

describe("guards — protection contre invention", () => {
  it("downgrade confidence si chiffres trop précis sans source", () => {
    const r = applyGuards({
      content: "Le coût exact est de 12345 € pour 67890 m².",
      confidence: "CERTAIN",
      sources: [],
      contextType: "FORM_FIELD",
    });
    expect(r.guardsTriggered).toContain("precise_numbers_no_source");
    expect(r.confidence).not.toBe("CERTAIN");
  });

  it("downgrade confidence si claim réglementaire sans source", () => {
    const r = applyGuards({
      content: "L'arrêté du 4 mai 2022 oblige tous les diagnostics.",
      confidence: "CERTAIN",
      sources: [],
      contextType: "GENERAL",
    });
    expect(r.guardsTriggered).toContain("regulatory_no_source");
  });

  it("ajoute note vérification expert sur AID_EXPLAIN sans mot-clé", () => {
    const r = applyGuards({
      content: "MaPrimeRénov' donne 5000 €.",
      confidence: "ESTIMATED",
      sources: [],
      contextType: "AID_EXPLAIN",
    });
    expect(r.guardsTriggered).toContain("expert_verification_added");
    expect(r.content).toContain("france-renov");
  });

  it("trigger aid_amount_no_source si mention MPR sans source aid", () => {
    const r = applyGuards({
      content: "MaPrimeRénov' propose une aide.",
      confidence: "ESTIMATED",
      sources: [{ kind: "help", ref: "x", label: "y" }],
      contextType: "GENERAL",
    });
    expect(r.guardsTriggered).toContain("aid_amount_no_source");
  });

  it("préserve content si confidence OK et sources présentes", () => {
    const r = applyGuards({
      content: "Information vérifiée.",
      confidence: "CERTAIN",
      sources: [{ kind: "doc", ref: "norm-x", label: "Norme X" }],
      contextType: "FORM_FIELD",
    });
    expect(r.confidence).toBe("CERTAIN");
  });
});

describe("context-builder — knowledge slices", () => {
  it("construit slice FORM_FIELD avec FIELD_HELP", () => {
    const slice = buildKnowledgeSlice({
      contextType: "FORM_FIELD",
      contextRef: "project.surfaceM2",
    });
    expect(slice).toContain("Surface");
    expect(slice).toContain("Que mettre");
    expect(slice).toContain("Comment mesurer");
  });

  it("construit slice CHOICE_HELP avec comparateur", () => {
    const slice = buildKnowledgeSlice({
      contextType: "CHOICE_HELP",
      contextRef: "wall_insulation",
    });
    expect(slice).toContain("Quel type d'isolation");
    expect(slice).toContain("Avantages");
  });

  it("construit slice MATERIAL_RECOGNIZE", () => {
    const slice = buildKnowledgeSlice({
      contextType: "MATERIAL_RECOGNIZE",
      contextRef: "wall:moellons",
    });
    expect(slice).toContain("Indices visuels");
  });

  it("construit slice AID_EXPLAIN", () => {
    const slice = buildKnowledgeSlice({
      contextType: "AID_EXPLAIN",
      contextRef: "mpr_classique",
    });
    expect(slice).toContain("MaPrimeRénov");
    expect(slice).toContain("Conditions d'éligibilité");
  });

  it("retourne string vide pour GENERAL sans ref", () => {
    expect(buildKnowledgeSlice({ contextType: "GENERAL" })).toBe("");
  });
});

describe("prompts — composition", () => {
  it("inclut base + persona + context + knowledge", () => {
    const prompt = buildSystemPrompt({
      persona: "INDIVIDUAL",
      contextType: "FORM_FIELD",
      knowledgeSlice: "## Test slice",
      locale: "fr",
    });
    expect(prompt).toContain("assistant IA métier");
    expect(prompt).toContain("PARTICULIER");
    expect(prompt).toContain("CHAMP");
    expect(prompt).toContain("Test slice");
  });

  it("ajoute instruction locale si non fr", () => {
    const prompt = buildSystemPrompt({
      persona: "INDIVIDUAL",
      contextType: "GENERAL",
      locale: "en",
    });
    expect(prompt).toContain("LOCALE UTILISATEUR : en");
  });

  it("persona PRO_AUDITEUR utilise registre technique", () => {
    const prompt = buildSystemPrompt({
      persona: "PRO_AUDITEUR",
      contextType: "GENERAL",
    });
    expect(prompt).toContain("OPQIBI");
    expect(prompt).toContain("technique");
  });
});
