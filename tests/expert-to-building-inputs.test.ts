// tests/expert-to-building-inputs.test.ts
// Tests unitaires du mapping `expertEnvelopeToBuildingInputs`.

import { describe, expect, it } from "vitest";
import {
  emptyExpertEnvelope,
  type ExpertBuildingEnvelope,
  type ExpertWall,
  type ExpertOpening,
  type ExpertHeating,
} from "@/lib/expert-building/types";
import { expertEnvelopeToBuildingInputs } from "@/lib/expert-building/to-building-inputs";

const BASE = {
  id: "proj-1",
  type: "MAISON_INDIV",
  occupation: "RESIDENCE_PRINCIPALE",
  construction_period: "1975_1981",
  construction_year: 1978,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("expertEnvelopeToBuildingInputs — cas vide", () => {
  it("envelope vide → BuildingInputs minimal mais valide", () => {
    const out = expertEnvelopeToBuildingInputs(emptyExpertEnvelope(), BASE);
    expect(out.id).toBe("proj-1");
    expect(out.climate_zone).toBe("H1a");
    expect(out.altitude_m).toBe(0);
    expect(out.walls).toEqual([]);
    expect(out.openings).toEqual([]);
    expect(out.heating).toEqual([]);
    expect(out.dhw).toEqual([]);
    expect(out.ventilation.kind).toBe("ABSENTE");
  });
});

describe("expertEnvelopeToBuildingInputs — géométrie", () => {
  it("livingArea / hsp / niveaux propagés", () => {
    const env: ExpertBuildingEnvelope = {
      ...emptyExpertEnvelope(),
      geometry: {
        livingAreaM2: 120, hspM: 2.5, levelsCount: 2,
        shape: "RECTANGLE",
      },
    };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.surface_habitable_m2).toBe(120);
    expect(out.surface_thermique_m2).toBe(120); // ≈ SHAB si non fournie
    expect(out.hauteur_sous_plafond_m).toBe(2.5);
    expect(out.niveau_count).toBe(2);
  });

  it("climateZone + altitude propagés", () => {
    const env: ExpertBuildingEnvelope = {
      ...emptyExpertEnvelope(),
      climateZone: "H2c",
      altitudeM: 250,
    };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.climate_zone).toBe("H2c");
    expect(out.altitude_m).toBe(250);
  });
});

describe("expertEnvelopeToBuildingInputs — murs", () => {
  it("mur expert → OpaqueWall avec orientation", () => {
    const wall: ExpertWall = {
      id: "w-s",
      facade: "S",
      surfaceM2: 30,
      structuralMaterial: "PARPAING",
      structuralThicknessCm: 20,
      insulationMaterialKey: "LAINE_VERRE",
      insulationThicknessCm: 10,
      insulationLambda: 0.040,
      confidence: "high",
    };
    const env = { ...emptyExpertEnvelope(), walls: [wall] };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.walls.length).toBe(1);
    expect(out.walls[0].kind).toBe("WALL");
    expect(out.walls[0].subtype).toBe("EXT");
    expect(out.walls[0].surface_m2).toBe(30);
    expect(out.walls[0].orientation).toBe("S");
    expect(out.walls[0].layers).toBeDefined();
    expect(out.walls[0].layers!.length).toBe(2);
  });

  it("knownR → u_value calculé 1/R", () => {
    const wall: ExpertWall = {
      id: "w", surfaceM2: 30,
      structuralMaterial: "PARPAING",
      knownR: 4,
      confidence: "high",
    };
    const env = { ...emptyExpertEnvelope(), walls: [wall] };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.walls[0].u_value_W_m2K).toBe(0.25);
  });
});

describe("expertEnvelopeToBuildingInputs — ouvertures", () => {
  it("opening 120×140 ×3 → surface 5.04 m² + glazing DOUBLE_ARGON", () => {
    const op: ExpertOpening = {
      id: "win-s",
      facade: "S",
      count: 3,
      type: "WINDOW",
      widthCm: 120,
      heightCm: 140,
      glazingType: "DOUBLE",
      gasFill: "ARGON",
      frameMaterial: "PVC",
      lowEmissivity: true,
      confidence: "high",
    };
    const env = { ...emptyExpertEnvelope(), openings: [op] };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.openings.length).toBe(1);
    expect(out.openings[0].surface_m2).toBeCloseTo(5.04, 2);
    expect(out.openings[0].glazing).toBe("DOUBLE_ARGON");
    expect(out.openings[0].frame).toBe("PVC");
    expect(out.openings[0].orientation).toBe("S");
  });

  it("simple vitrage → SIMPLE", () => {
    const op: ExpertOpening = {
      id: "x", count: 1, type: "WINDOW",
      glazingType: "SIMPLE", frameMaterial: "WOOD",
      confidence: "low",
    };
    const env = { ...emptyExpertEnvelope(), openings: [op] };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.openings[0].glazing).toBe("SIMPLE");
  });

  it("knownUw → u_value override", () => {
    const op: ExpertOpening = {
      id: "x", count: 1, type: "WINDOW",
      glazingType: "DOUBLE", gasFill: "ARGON", frameMaterial: "PVC",
      knownUw: 1.3,
      confidence: "high",
    };
    const env = { ...emptyExpertEnvelope(), openings: [op] };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.openings[0].u_value_W_m2K).toBe(1.3);
  });
});

describe("expertEnvelopeToBuildingInputs — systèmes", () => {
  it("PAC air/eau gaz → HeatingSystem PAC_AIR_EAU + carrier ELEC mappés", () => {
    const heating: ExpertHeating = {
      id: "h1",
      generatorType: "PAC_AIR_EAU",
      energy: "ELEC",
      nominalEfficiency: 0.85,
      confidence: "high",
    };
    const env = { ...emptyExpertEnvelope(), heating: [heating] };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.heating[0].kind).toBe("PAC_AIR_EAU");
    expect(out.heating[0].carrier).toBe("ELEC");
    expect(out.heating[0].efficiency).toBe(0.85);
  });

  it("chaudière gaz → carrier GAZ_NAT", () => {
    const heating: ExpertHeating = {
      id: "h1",
      generatorType: "CHAUDIERE_GAZ_COND",
      energy: "GAZ",
      confidence: "medium",
    };
    const env = { ...emptyExpertEnvelope(), heating: [heating] };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.heating[0].kind).toBe("CHAUDIERE_GAZ_COND");
    expect(out.heating[0].carrier).toBe("GAZ_NAT");
  });

  it("DHW ballon élec → carrier ELEC", () => {
    const env: ExpertBuildingEnvelope = {
      ...emptyExpertEnvelope(),
      dhw: [{ id: "d1", generatorType: "BALLON_ELEC", energy: "ELEC", confidence: "high" }],
    };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.dhw[0].kind).toBe("BALLON_ELEC");
    expect(out.dhw[0].carrier).toBe("ELEC");
  });

  it("VMC double flux → ventilation.kind VMC_DF + heat_recovery", () => {
    const env: ExpertBuildingEnvelope = {
      ...emptyExpertEnvelope(),
      ventilation: { kind: "VMC_DF", heatRecoveryEfficiency: 0.85, confidence: "medium" },
    };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.ventilation.kind).toBe("VMC_DF");
    expect(out.ventilation.heat_recovery_eff).toBe(0.85);
  });
});

describe("expertEnvelopeToBuildingInputs — fail-safe", () => {
  it("surfaces NaN → 0", () => {
    const wall: ExpertWall = {
      id: "w", surfaceM2: Number.NaN, structuralMaterial: "PARPAING", confidence: "low",
    };
    const env = { ...emptyExpertEnvelope(), walls: [wall] };
    const out = expertEnvelopeToBuildingInputs(env, BASE);
    expect(out.walls[0].surface_m2).toBe(0);
  });
});
