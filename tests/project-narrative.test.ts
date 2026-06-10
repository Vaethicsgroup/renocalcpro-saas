// tests/project-narrative.test.ts
// Tests unitaires sur la lib pure de génération de résumé projet.
// Pas de DB, pas de localStorage — pure function avec translator injecté.

import { describe, expect, it } from "vitest";
import {
  generateProjectNarrativeSummary,
  serializeNarrativeToText,
  type NarrativeOptions,
  type ProjectNarrativeInputs,
  type VisitNotes,
} from "@/lib/project-summary/project-narrative";

/**
 * Faux translator pour tests :
 *   - retourne `key` si pas de params
 *   - retourne `key{a=1, b=2}` (params triés) si params
 * Permet d'asserter à la fois la clé utilisée ET les params interpolés sans
 * dépendre du contenu réel des messages files.
 */
const fakeT = (key: string, params?: Record<string, unknown>): string => {
  if (!params || Object.keys(params).length === 0) return key;
  const flat = Object.entries(params)
    .map(([k, v]) => `${k}=${String(v)}`)
    .sort()
    .join("|");
  return `${key}{${flat}}`;
};

const baseOptions: NarrativeOptions = {
  tone: "professional",
  includeUncertaintyNotes: false,
  locale: "fr",
  t: fakeT,
};

describe("generateProjectNarrativeSummary — maison 1975 typique", () => {
  const inputs: ProjectNarrativeInputs = {
    buildingType: "maison",
    constructionYear: 1975,
    surfaceHabitableM2: 110,
    city: "Bordeaux",
    climateZone: "H2",
    heatingSystem: "chaudière gaz",
    heatingEnergy: "gaz naturel",
    dhwSystem: "ballon électrique",
    ventilationSystem: "VMC simple flux",
    wallsType: "parpaing creux 1975",
    wallsInsulation: "none",
    roofType: "combles aménagés",
    roofInsulation: "partial",
    floorType: "plancher sur vide sanitaire",
    floorInsulation: "unknown",
    windowsType: "double vitrage 4-16-4 récent",
  };
  const notes: VisitNotes = {};

  it("produit un titre avec le bon ton et toutes les valeurs interpolées", () => {
    const r = generateProjectNarrativeSummary(inputs, notes, { ...baseOptions, tone: "professional" });
    expect(r.title).toContain("projectSummary.title.professional");
    expect(r.title).toContain("year=1975");
    expect(r.title).toContain("city=Bordeaux");
  });

  it("section systèmes inclut chauffage, ECS et ventilation", () => {
    const r = generateProjectNarrativeSummary(inputs, notes, baseOptions);
    expect(r.systemsOverview).toContain("projectSummary.systems.heatingWithEnergy");
    expect(r.systemsOverview).toContain("system=chaudière gaz");
    expect(r.systemsOverview).toContain("energy=gaz naturel");
    expect(r.systemsOverview).toContain("projectSummary.systems.dhw");
    expect(r.systemsOverview).toContain("projectSummary.systems.ventilation");
  });

  it("section enveloppe traite murs / toiture / plancher / menuiseries", () => {
    const r = generateProjectNarrativeSummary(inputs, notes, baseOptions);
    expect(r.envelopeOverview).toContain("projectSummary.envelope.walls");
    expect(r.envelopeOverview).toContain("projectSummary.envelope.roof");
    expect(r.envelopeOverview).toContain("projectSummary.envelope.floor");
    expect(r.envelopeOverview).toContain("projectSummary.envelope.windows");
  });

  it("plancher inconnu → confidence note alimentée", () => {
    const r = generateProjectNarrativeSummary(inputs, notes, baseOptions);
    expect(r.confidenceNotes).toContain("projectSummary.confidence.floorInsulation");
  });
});

describe("garage / locaux non chauffés", () => {
  it("hasAttachedGarage=true insère la mention dans l'enveloppe", () => {
    const r = generateProjectNarrativeSummary(
      { buildingType: "maison", hasAttachedGarage: true },
      {},
      baseOptions,
    );
    expect(r.envelopeOverview).toContain("projectSummary.envelope.attachedGarage");
  });

  it("hasUnheatedRoom=true insère la mention adjacente", () => {
    const r = generateProjectNarrativeSummary(
      { buildingType: "maison", hasUnheatedRoom: true },
      {},
      baseOptions,
    );
    expect(r.envelopeOverview).toContain("projectSummary.envelope.unheatedRoom");
  });

  it("hasAtticAccess=true insère la mention combles", () => {
    const r = generateProjectNarrativeSummary(
      { buildingType: "maison", hasAtticAccess: true },
      {},
      baseOptions,
    );
    expect(r.envelopeOverview).toContain("projectSummary.envelope.atticAccess");
  });
});

describe("données inconnues → 'à confirmer' / confidenceNotes", () => {
  it("inputs entièrement vides → toutes les confidenceNotes principales sont là", () => {
    const r = generateProjectNarrativeSummary({}, {}, baseOptions);
    expect(r.confidenceNotes).toEqual(
      expect.arrayContaining([
        "projectSummary.confidence.surface",
        "projectSummary.confidence.year",
        "projectSummary.confidence.heating",
        "projectSummary.confidence.dhw",
        "projectSummary.confidence.ventilation",
        "projectSummary.confidence.walls",
        "projectSummary.confidence.roof",
        "projectSummary.confidence.floor",
        "projectSummary.confidence.windows",
      ]),
    );
  });

  it("includeUncertaintyNotes=false → corps reste minimal sans 'à confirmer' visibles", () => {
    const r = generateProjectNarrativeSummary({}, {}, { ...baseOptions, includeUncertaintyNotes: false });
    expect(r.propertyOverview).not.toContain("projectSummary.property.surfaceTbd");
    expect(r.systemsOverview).not.toContain("projectSummary.systems.heatingTbd");
    expect(r.envelopeOverview).not.toContain("projectSummary.envelope.wallsTbd");
  });

  it("includeUncertaintyNotes=true → corps contient les 'à confirmer' visibles", () => {
    const r = generateProjectNarrativeSummary({}, {}, { ...baseOptions, includeUncertaintyNotes: true });
    expect(r.propertyOverview).toContain("projectSummary.property.surfaceTbd");
    expect(r.systemsOverview).toContain("projectSummary.systems.heatingTbd");
    expect(r.envelopeOverview).toContain("projectSummary.envelope.wallsTbd");
  });

  it("disclaimers contient 'dataToConfirm' quand des champs sont manquants", () => {
    const r = generateProjectNarrativeSummary({}, {}, baseOptions);
    expect(r.disclaimers).toContain("projectSummary.disclaimers.dataToConfirm");
  });

  it("disclaimers minimaux toujours présents", () => {
    const r = generateProjectNarrativeSummary({}, {}, baseOptions);
    expect(r.disclaimers).toContain("projectSummary.disclaimers.indicative");
    expect(r.disclaimers).toContain("projectSummary.disclaimers.notAudit3CL");
  });
});

describe("notes utilisateur intégrées", () => {
  it("chaque champ note avec valeur → entrée dans visitObservations", () => {
    const r = generateProjectNarrativeSummary({}, {
      general: "Façade ouest très exposée au vent dominant.",
      walls: "Quelques fissures verticales en pied de mur.",
      humidity: "Salpêtre visible côté nord.",
    }, baseOptions);
    expect(r.visitObservations).toContain("projectSummary.obs.general");
    expect(r.visitObservations).toContain("value=Façade ouest très exposée au vent dominant.");
    expect(r.visitObservations).toContain("projectSummary.obs.walls");
    expect(r.visitObservations).toContain("projectSummary.obs.humidity");
  });

  it("notes vides ou whitespace-only → ignorées + 'obs.empty' affiché", () => {
    const r = generateProjectNarrativeSummary({}, {
      general: "",
      walls: "   ",
      humidity: undefined,
    }, baseOptions);
    expect(r.visitObservations).toBe("projectSummary.obs.empty");
  });

  it("notes.priorities → routées vers renovationPriorities", () => {
    const r = generateProjectNarrativeSummary({}, {
      priorities: "Isolation toiture en priorité, puis menuiseries.",
    }, baseOptions);
    expect(r.renovationPriorities).toContain("projectSummary.priorities.userIntro");
    expect(r.renovationPriorities).toContain("value=Isolation toiture en priorité, puis menuiseries.");
  });

  it("scénario recommandé fourni → texte priorité avec name/dpe/cost", () => {
    const r = generateProjectNarrativeSummary({
      recommendedScenarios: [
        { name: "Bouquet équilibré", dpeAfter: "C", costEur: 45800 },
      ],
    }, {}, baseOptions);
    expect(r.renovationPriorities).toContain("projectSummary.priorities.topScenario.professional");
    expect(r.renovationPriorities).toContain("name=Bouquet équilibré");
    expect(r.renovationPriorities).toContain("dpe=C");
    expect(r.renovationPriorities).toContain("cost=45800");
  });

  it("pas de priorité utilisateur ni de scénario → priorities.empty", () => {
    const r = generateProjectNarrativeSummary({}, {}, baseOptions);
    expect(r.renovationPriorities).toContain("projectSummary.priorities.empty");
  });
});

describe("tone client vs professional vs technical", () => {
  const inputs: ProjectNarrativeInputs = {
    buildingType: "maison",
    constructionYear: 1975,
    recommendedScenarios: [{ name: "X", dpeAfter: "B", costEur: 50000 }],
  };

  it("titre change selon le ton", () => {
    const tClient = generateProjectNarrativeSummary(inputs, {}, { ...baseOptions, tone: "client" });
    const tPro = generateProjectNarrativeSummary(inputs, {}, { ...baseOptions, tone: "professional" });
    const tTech = generateProjectNarrativeSummary(inputs, {}, { ...baseOptions, tone: "technical" });
    expect(tClient.title).toContain("projectSummary.title.client");
    expect(tPro.title).toContain("projectSummary.title.professional");
    expect(tTech.title).toContain("projectSummary.title.technical");
  });

  it("priorités du scénario top utilisent la variante de ton", () => {
    const tClient = generateProjectNarrativeSummary(inputs, {}, { ...baseOptions, tone: "client" });
    const tTech = generateProjectNarrativeSummary(inputs, {}, { ...baseOptions, tone: "technical" });
    expect(tClient.renovationPriorities).toContain("projectSummary.priorities.topScenario.client");
    expect(tTech.renovationPriorities).toContain("projectSummary.priorities.topScenario.technical");
  });
});

describe("robustesse / fail-safe", () => {
  it("inputs null + notes null → ne crash pas, retourne un résultat minimal", () => {
    const r = generateProjectNarrativeSummary(null, null, baseOptions);
    expect(typeof r.title).toBe("string");
    expect(typeof r.propertyOverview).toBe("string");
    expect(typeof r.systemsOverview).toBe("string");
    expect(typeof r.envelopeOverview).toBe("string");
    expect(r.disclaimers.length).toBeGreaterThanOrEqual(2);
  });

  it("recommendedScenarios vide / undefined → priorities.empty sans crash", () => {
    const r = generateProjectNarrativeSummary({ recommendedScenarios: [] }, {}, baseOptions);
    expect(r.renovationPriorities).toContain("projectSummary.priorities.empty");
  });

  it("scénario avec name vide → priorities.empty (pas d'affichage vide)", () => {
    const r = generateProjectNarrativeSummary({ recommendedScenarios: [{ name: "" }] }, {}, baseOptions);
    expect(r.renovationPriorities).toContain("projectSummary.priorities.empty");
  });
});

describe("serializeNarrativeToText", () => {
  it("compose un markdown lisible avec sections et listes", () => {
    const r = generateProjectNarrativeSummary({ buildingType: "maison" }, { general: "Rien à signaler." }, baseOptions);
    const text = serializeNarrativeToText(r, { t: fakeT });
    expect(text).toContain("# "); // titre markdown
    expect(text).toContain("## projectSummary.section.property");
    expect(text).toContain("## projectSummary.section.systems");
    expect(text).toContain("## projectSummary.section.envelope");
    expect(text).toContain("## projectSummary.section.observations");
    expect(text).toContain("## projectSummary.section.priorities");
    expect(text).toContain("## projectSummary.section.disclaimers");
    expect(text).toContain("- projectSummary.disclaimers.indicative");
  });
});
