// src/lib/expert-building/to-building-inputs.ts
// ════════════════════════════════════════════════════════════════════════════
// Mapping ExpertBuildingEnvelope → BuildingInputs (moteur calc).
//
// PRINCIPES :
//   - Pure / déterministe / fail-safe.
//   - LECTURE SEULE de l'envelope expert + des helpers calc existants.
//   - Tolérante : si un champ de l'envelope est manquant, on utilise des
//     défauts conservateurs ou on omet le champ optionnel.
//   - PAS de modification du type `BuildingInputs` (pas d'extension de
//     champs côté moteur dans ce lot).
//
// CHAMPS PERDUS au mapping (documentés explicitement) :
//   - inseeCode, departmentCode, region        — pas dans BuildingInputs
//   - cadastralParcelId                         — pas dans BuildingInputs
//   - geoSourceQuality                          — pas dans BuildingInputs
//   - thermalBridges détaillés                  — agrégés en hasThermalBridges
//   - assumption.source/confidence par champ    — pas dans BuildingInputs
//   - facadeSurfaces par orientation            — agrégées en wall.surface_m2
//   - openings dimensionnées individuelles      — agrégées en surface_m2
//   - counterPartition                          — fusionnée dans layers[]
//
// USAGE : appeler quand le wizard expert valide, pour produire l'input
// moteur réel. La perte d'information est acceptable pour MVP.
// ════════════════════════════════════════════════════════════════════════════

import type {
  BuildingInputs,
  OpaqueWall,
  Opening,
  HeatingSystem,
  DhwSystem,
  VentilationSystem,
  ClimateZone,
  WallType,
  RoofType,
  FloorType,
  GlazingType,
  WindowFrame,
  HeatingSystemKind,
  DhwSystemKind,
  VentilationKind,
  EnergyCarrier,
  MaterialLayer,
} from "@/lib/calc/types";
import type {
  ExpertBuildingEnvelope,
  ExpertWall,
  ExpertFloor,
  ExpertRoof,
  ExpertOpening,
  ExpertHeating,
  ExpertDhw,
  FloorAdjacentSpace,
  GlazingParam,
  WindowFrameMaterial,
  HeatingGenerator,
  DhwGenerator,
  VentilationGenerator,
} from "./types";

// ─── HELPERS PURS ─────────────────────────────────────────────────────────

const orientationMap: Record<string, OpaqueWall["orientation"]> = {
  N: "N", NE: "NE", E: "E", SE: "SE", S: "S", SO: "SO", O: "O", NO: "NO",
};

function mapWallSubtype(_wall: ExpertWall): WallType {
  // Pour l'instant : tous les murs experts → EXT (extérieur).
  // À enrichir quand on saura distinguer extérieur / mitoyen / enterré.
  return "EXT";
}

function mapFloorSubtype(adjacent: FloorAdjacentSpace): FloorType {
  switch (adjacent) {
    case "CRAWL_SPACE":        return "BAS_VIDE_SANIT";
    case "GROUND":             return "BAS_TERRE_PLEIN";
    case "UNHEATED_CELLAR":
    case "HEATED_CELLAR":      return "BAS_SOUS_SOL";
    case "OUTSIDE_AIR":
    case "UNHEATED_GARAGE":
    case "ADJACENT_HEATED":
    default:                   return "INTER";
  }
}

function mapRoofSubtype(kind: ExpertRoof["roofType"]): RoofType {
  switch (kind) {
    case "COMBLES_PERDUS":            return "COMBLES_PERDUS";
    case "COMBLES_AMENAGES_RAMPANTS": return "COMBLES_AMENAGES";
    case "TOITURE_TERRASSE":
    case "TOITURE_VEGETALISEE":       return "TERRASSE";
    default:                          return "TOITURE";
  }
}

function mapGlazing(g?: GlazingParam, gas?: ExpertOpening["gasFill"]): GlazingType {
  if (g === "SIMPLE") return "SIMPLE";
  if (g === "TRIPLE") return "TRIPLE";
  if (g === "OVERGLAZE") return "SURVITRAGE";
  // DOUBLE
  if (gas === "ARGON" || gas === "KRYPTON") return "DOUBLE_ARGON";
  return "DOUBLE_AIR";
}

function mapFrame(f?: WindowFrameMaterial): WindowFrame {
  switch (f) {
    case "WOOD":                 return "BOIS";
    case "PVC":                  return "PVC";
    case "ALU_THERMAL_BREAK":    return "ALU_RP";
    case "ALU_NO_THERMAL_BREAK": return "ALU_SANS_RP";
    case "MIXED_WOOD_ALU":       return "BOIS";
    case "STEEL":                return "METAL";
    default:                     return "PVC";
  }
}

function mapHeatingKind(g: HeatingGenerator): HeatingSystemKind {
  switch (g) {
    case "CHAUDIERE_GAZ_COND":   return "CHAUDIERE_GAZ_COND";
    case "CHAUDIERE_GAZ_STD":    return "CHAUDIERE_GAZ_STD";
    case "CHAUDIERE_FIOUL":      return "CHAUDIERE_FIOUL";
    case "CHAUDIERE_BOIS_BUCHE": return "CHAUDIERE_BOIS_BUCHE";
    case "CHAUDIERE_BOIS_GRANUL":return "CHAUDIERE_BOIS_GRANUL";
    case "PAC_AIR_AIR":          return "PAC_AIR_AIR";
    case "PAC_AIR_EAU":          return "PAC_AIR_EAU";
    case "PAC_GEO":              return "PAC_GEO";
    case "POELE_BOIS":           return "POELE_BOIS_BUCHE";
    case "POELE_GRANUL":         return "POELE_GRANUL";
    case "RADIATEUR_ELEC":       return "RADIATEUR_ELEC";
    case "CONVECTEUR_ELEC_NG":   return "CONVECTEUR_ELEC_NG";
    case "RES_CHALEUR_URBAIN":   return "RES_CHALEUR_URBAIN";
    case "INSERT_CHEMINEE":      return "INSERT_CHEMINEE";
    default:                     return "RADIATEUR_ELEC";
  }
}

function mapDhwKind(g: DhwGenerator): DhwSystemKind {
  switch (g) {
    case "BALLON_ELEC":           return "BALLON_ELEC";
    case "BALLON_THERMODYN":      return "BALLON_THERMODYN";
    case "CHAUDIERE_INTEGREE":    return "CHAUDIERE_INTEGREE";
    case "GAZ_INSTANT":           return "GAZ_INSTANT";
    case "SOLAIRE_THERM_APPOINT": return "SOLAIRE_THERM_APPOINT";
    default:                      return "BALLON_ELEC";
  }
}

function mapVentilation(k: VentilationGenerator): VentilationKind {
  switch (k) {
    case "VMC_SF_AUTO":     return "VMC_SF_AUTO";
    case "VMC_SF_HYGRO_A":  return "VMC_SF_HYGRO_A";
    case "VMC_SF_HYGRO_B":  return "VMC_SF_HYGRO_B";
    case "VMC_DF":          return "VMC_DF";
    case "VMI":             return "VMI";
    case "NATURELLE":       return "NATURELLE";
    default:                return "ABSENTE";
  }
}

function mapEnergyCarrier(energy: ExpertHeating["energy"]): EnergyCarrier {
  switch (energy) {
    case "GAZ":             return "GAZ_NAT";
    case "FIOUL":           return "FIOUL";
    case "ELEC":            return "ELEC";
    case "BOIS":            return "BOIS_BUCHE";  // défaut bûche, à raffiner si granul
    case "RESEAU_CHALEUR":  return "RES_CH";
    default:                return "ELEC";
  }
}

// ─── HELPERS R/U PUR ──────────────────────────────────────────────────────

/** Construit les `layers` d'un mur expert si possible. Sinon undefined → moteur fallback. */
function wallToLayers(wall: ExpertWall): MaterialLayer[] | undefined {
  const layers: MaterialLayer[] = [];
  if (wall.structuralMaterial && wall.structuralThicknessCm) {
    layers.push({
      material_key: wall.structuralMaterial,
      thickness_m: wall.structuralThicknessCm / 100,
    });
  }
  if (wall.insulationMaterialKey && wall.insulationThicknessCm) {
    layers.push({
      material_key: wall.insulationMaterialKey,
      thickness_m: wall.insulationThicknessCm / 100,
      lambda_W_mK: wall.insulationLambda,
    });
  }
  if (wall.hasCounterPartition && wall.counterPartitionMaterial && wall.counterPartitionThicknessCm) {
    layers.push({
      material_key: wall.counterPartitionMaterial,
      thickness_m: wall.counterPartitionThicknessCm / 100,
    });
  }
  return layers.length > 0 ? layers : undefined;
}

/** Calcule l'U si on a un R total connu. */
function knownU(wall: { knownR?: number; totalR?: number }): number | undefined {
  const r = wall.knownR ?? wall.totalR;
  return r && r > 0 ? 1 / r : undefined;
}

// ─── MAPPING ENVELOPPE → WALLS / OPENINGS ─────────────────────────────────

function mapExpertWalls(walls: ReadonlyArray<ExpertWall>): OpaqueWall[] {
  return walls.map((w, i) => ({
    id: w.id || `wall-${i}`,
    kind: "WALL",
    surface_m2: Number.isFinite(w.surfaceM2) ? w.surfaceM2 : 0,
    u_value_W_m2K: knownU(w),
    subtype: mapWallSubtype(w),
    orientation: w.facade ? (orientationMap[w.facade] ?? null) : null,
    layers: wallToLayers(w),
  }));
}

function mapExpertFloors(floors: ReadonlyArray<ExpertFloor>): OpaqueWall[] {
  return floors
    .filter((f) => f.floorType === "BAS")
    .map((f, i) => ({
      id: f.id || `floor-${i}`,
      kind: "FLOOR",
      surface_m2: Number.isFinite(f.surfaceM2) ? f.surfaceM2 : 0,
      u_value_W_m2K: knownU(f),
      subtype: mapFloorSubtype(f.adjacentSpace),
    }));
}

function mapExpertRoofs(roofs: ReadonlyArray<ExpertRoof>): OpaqueWall[] {
  return roofs.map((r, i) => ({
    id: r.id || `roof-${i}`,
    kind: "ROOF",
    surface_m2: Number.isFinite(r.surfaceM2) ? r.surfaceM2 : 0,
    u_value_W_m2K: knownU(r),
    subtype: mapRoofSubtype(r.roofType),
  }));
}

function mapExpertOpenings(openings: ReadonlyArray<ExpertOpening>): Opening[] {
  return openings.map((o, i) => {
    const widthM = o.widthCm ? o.widthCm / 100 : 1.2;
    const heightM = o.heightCm ? o.heightCm / 100 : 1.4;
    const unitArea = widthM * heightM;
    const count = Number.isFinite(o.count) && o.count > 0 ? o.count : 1;
    return {
      id: o.id || `opening-${i}`,
      kind:
        o.type === "DOOR_SOLID"  ? "DOOR_SOLID" :
        o.type === "DOOR_GLASS"  ? "DOOR_GLASS" :
                                   "WINDOW",
      surface_m2: unitArea * count,
      u_value_W_m2K: o.knownUw ?? o.calculatedUw,
      glazing: mapGlazing(o.glazingType, o.gasFill),
      frame: mapFrame(o.frameMaterial),
      orientation: o.facade ? (orientationMap[o.facade] ?? undefined) : undefined,
    };
  });
}

function mapExpertHeating(items: ReadonlyArray<ExpertHeating>): HeatingSystem[] {
  return items.map((h, i) => ({
    id: h.id || `heating-${i}`,
    kind: mapHeatingKind(h.generatorType),
    carrier: mapEnergyCarrier(h.energy),
    efficiency: h.nominalEfficiency,
    coverage_share: 1,
  }));
}

function mapExpertDhw(items: ReadonlyArray<ExpertDhw>): DhwSystem[] {
  return items.map((d, i) => ({
    id: d.id || `dhw-${i}`,
    kind: mapDhwKind(d.generatorType),
    carrier:
      d.energy === "GAZ"            ? ("GAZ_NAT" as EnergyCarrier) :
      d.energy === "BOIS"           ? ("BOIS_BUCHE" as EnergyCarrier) :
      d.energy === "RESEAU_CHALEUR" ? ("RES_CH" as EnergyCarrier) :
                                      ("ELEC" as EnergyCarrier),
    efficiency: d.nominalEfficiency,
  }));
}

function mapExpertVentilation(v: ExpertBuildingEnvelope["ventilation"]): VentilationSystem {
  // Note : `VentilationSystem` impose `id` ; on le génère ici.
  return {
    id: "ventilation-1",
    kind: mapVentilation(v.kind),
    heat_recovery_eff: v.heatRecoveryEfficiency,
  } as VentilationSystem;
}

// ─── API PUBLIQUE ─────────────────────────────────────────────────────────

/**
 * Convertit un `ExpertBuildingEnvelope` (modèle UI riche) en un
 * `BuildingInputs` (input moteur calc). Lecture seule, fail-safe.
 *
 * Champs perdus au mapping documentés dans l'en-tête du fichier.
 */
export function expertEnvelopeToBuildingInputs(
  envelope: ExpertBuildingEnvelope,
  base: {
    /** Identifiant projet. */
    id: string;
    /** Type de bâtiment (le moteur attend ces enums). */
    type: BuildingInputs["type"];
    occupation: BuildingInputs["occupation"];
    construction_period: BuildingInputs["construction_period"];
    construction_year?: number;
  },
): BuildingInputs {
  const geom = envelope.geometry;
  const climateZone: ClimateZone = envelope.climateZone ?? "H1a";
  const altitudeM = Number.isFinite(envelope.altitudeM) ? envelope.altitudeM ?? 0 : 0;

  const surface_habitable_m2 = Number.isFinite(geom.livingAreaM2) ? geom.livingAreaM2 : 0;
  const surface_thermique_m2 = Number.isFinite(geom.referenceAreaM2) ? geom.referenceAreaM2 : surface_habitable_m2;
  const hauteur_sous_plafond_m = Number.isFinite(geom.hspM) ? geom.hspM : 2.5;
  const niveau_count = Number.isFinite(geom.levelsCount) ? geom.levelsCount : 1;

  const walls: OpaqueWall[] = [
    ...mapExpertWalls(envelope.walls),
    ...mapExpertFloors(envelope.floors),
    ...mapExpertRoofs(envelope.roofs),
  ];

  return {
    id: base.id,
    type: base.type,
    occupation: base.occupation,
    construction_period: base.construction_period,
    construction_year: base.construction_year,
    climate_zone: climateZone,
    altitude_m: altitudeM,
    surface_habitable_m2,
    surface_thermique_m2,
    hauteur_sous_plafond_m,
    niveau_count,
    walls,
    openings: mapExpertOpenings(envelope.openings),
    heating: mapExpertHeating(envelope.heating),
    dhw: mapExpertDhw(envelope.dhw),
    ventilation: mapExpertVentilation(envelope.ventilation),
    setpoint_winter_C: envelope.usage.setpointWinterC,
    setpoint_summer_C: envelope.usage.setpointSummerC,
    occupants: envelope.usage.occupantsTotal,
  };
}
