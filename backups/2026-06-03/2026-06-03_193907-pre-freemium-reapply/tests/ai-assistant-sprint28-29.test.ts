// tests/ai-assistant-sprint28-29.test.ts
// Tests Sprint 28-29 : degraded mode, persona AGENCY, i18n ES/DE/PT étendu, recap email building.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildDegradedReply } from "@/lib/ai/assistant/degraded-mode";
import { askAssistant } from "@/lib/ai/assistant/client";
import { getFieldHelpI18n, getI18nCoverage } from "@/lib/ai/assistant/knowledge/i18n";
import { getPersonaPrompt } from "@/lib/ai/assistant/prompts/personas";

describe("degraded mode — knowledge brut sans LLM", () => {
  it("FORM_FIELD retourne fiche FIELD_HELP formatée", () => {
    const r = buildDegradedReply("FORM_FIELD", "project.surfaceM2");
    expect(r).not.toBeNull();
    expect(r!.content).toContain("Surface");
    expect(r!.content).toContain("Que mettre");
    expect(r!.content).toContain("Service IA temporairement indisponible");
    expect(r!.guardsTriggered).toContain("degraded_mode_no_llm");
    expect(r!.confidence).toBe("CERTAIN");
    expect(r!.sources[0].kind).toBe("help");
  });

  it("FORM_SECTION retourne fiche SECTION_HELP", () => {
    const r = buildDegradedReply("FORM_SECTION", "envelope");
    expect(r).not.toBeNull();
    expect(r!.content).toContain("Enveloppe");
    expect(r!.content).toContain("À quoi sert");
    expect(r!.content).toContain("Préparer avant");
  });

  it("MATERIAL_RECOGNIZE retourne guide", () => {
    const r = buildDegradedReply("MATERIAL_RECOGNIZE", "wall:moellons");
    expect(r).not.toBeNull();
    expect(r!.content).toContain("Indices visuels");
    expect(r!.content).toContain("Tests simples");
  });

  it("CHOICE_HELP retourne comparateur structuré", () => {
    const r = buildDegradedReply("CHOICE_HELP", "wall_insulation");
    expect(r).not.toBeNull();
    expect(r!.content).toContain("Options");
    expect(r!.content).toContain("Recommandations selon profil");
    expect(r!.guardsTriggered).toContain("expert_verification_added");
  });

  it("AID_EXPLAIN retourne aide formatée + lien officiel", () => {
    const r = buildDegradedReply("AID_EXPLAIN", "mpr_classique");
    expect(r).not.toBeNull();
    expect(r!.content).toContain("MaPrimeRénov");
    expect(r!.content).toContain("Source officielle");
    expect(r!.content).toContain("france-renov");
  });

  it("retourne null si knowledge introuvable", () => {
    expect(buildDegradedReply("FORM_FIELD", "inexistant.field")).toBeNull();
    expect(buildDegradedReply("CHOICE_HELP", undefined)).toBeNull();
    expect(buildDegradedReply("GENERAL", "anything")).toBeNull();
  });
});

describe("client askAssistant — fallback degraded sur erreur LLM", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "fake-key";
  });

  afterEach(() => {
    if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
    else delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ASSISTANT_DEGRADED_MODE;
    vi.restoreAllMocks();
  });

  it("env ASSISTANT_DEGRADED_MODE=true bypass LLM si knowledge dispo", async () => {
    process.env.ASSISTANT_DEGRADED_MODE = "true";
    const r = await askAssistant({
      persona: "INDIVIDUAL",
      contextType: "FORM_FIELD",
      contextRef: "project.surfaceM2",
      locale: "fr",
      history: [],
      userMessage: "Comment mesurer ?",
    });
    expect(r.guardsTriggered).toContain("degraded_mode_no_llm");
    expect(r.tokensIn).toBe(0);
    expect(r.tokensOut).toBe(0);
  });

  it("503 LLM → fallback degraded automatique", async () => {
    global.fetch = vi.fn(async () => new Response("Service Unavailable", { status: 503 })) as never;
    const r = await askAssistant({
      persona: "PRO_AUDITEUR",
      contextType: "FORM_FIELD",
      contextRef: "envelope.walls.materialKey",
      locale: "fr",
      history: [],
      userMessage: "Quel matériau ?",
    });
    expect(r.guardsTriggered).toContain("degraded_mode_no_llm");
  });

  it("429 LLM → fallback degraded automatique", async () => {
    global.fetch = vi.fn(async () => new Response("Rate limited", { status: 429 })) as never;
    const r = await askAssistant({
      persona: "INDIVIDUAL",
      contextType: "AID_EXPLAIN",
      contextRef: "tva_reduite",
      locale: "fr",
      history: [],
      userMessage: "Quel taux TVA ?",
    });
    expect(r.guardsTriggered).toContain("degraded_mode_no_llm");
    expect(r.content).toContain("TVA");
  });

  it("503 LLM mais knowledge introuvable → throw error", async () => {
    global.fetch = vi.fn(async () => new Response("Service Unavailable", { status: 503 })) as never;
    await expect(
      askAssistant({
        persona: "INDIVIDUAL",
        contextType: "GENERAL",
        contextRef: undefined,
        locale: "fr",
        history: [],
        userMessage: "question hors knowledge",
      }),
    ).rejects.toThrow(/Anthropic API/);
  });
});

describe("persona PRO_AGENCY", () => {
  it("a un prompt distinct des autres", () => {
    const agency = getPersonaPrompt("PRO_AGENCY");
    const auditor = getPersonaPrompt("PRO_AUDITEUR");
    expect(agency).not.toBe(auditor);
    expect(agency).toContain("AGENCE IMMOBILIÈRE");
    expect(agency).toContain("CONSEIL VENTE");
    expect(agency).toContain("calendrier");
  });

  it("évite jargon thermique", () => {
    const agency = getPersonaPrompt("PRO_AGENCY");
    expect(agency).toContain("Évite");
    expect(agency).toContain("jargon");
  });
});

describe("i18n ES/DE/PT étendu Sprint 29", () => {
  it("ES couvre champs Sprint 26-27 (envelope.windows.glazingKind)", () => {
    const help = getFieldHelpI18n("envelope.windows.glazingKind", "es");
    expect(help?.label).toContain("acristalamiento");
  });

  it("DE couvre champs Sprint 26-27 (systems.heating.fuelType)", () => {
    const help = getFieldHelpI18n("systems.heating.fuelType", "de");
    expect(help?.label).toContain("Hauptheiz");
  });

  it("PT couvre comfort.summerComplaints", () => {
    const help = getFieldHelpI18n("comfort.summerComplaints", "pt");
    expect(help?.label).toContain("verão");
  });

  it("coverage ES/DE/PT fields > 5", () => {
    const cov = getI18nCoverage();
    expect(cov.es.fields).toBeGreaterThan(5);
    expect(cov.de.fields).toBeGreaterThan(5);
    expect(cov.pt.fields).toBeGreaterThan(5);
  });
});
