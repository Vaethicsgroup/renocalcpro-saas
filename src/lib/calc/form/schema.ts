// src/lib/calc/form/schema.ts — Schéma formulaire saisie utilisateur v2.0
// ════════════════════════════════════════════════════════════════════════════
// v2.0 — RICHE : enrichi avec champs métier complets pour audit énergétique
//   réaliste (matériaux paroi, isolation par paroi, multi-systèmes chauffage,
//   travaux passés, hazards, ponts thermiques, frame menuiseries, etc.).
//
// Compatibilité totale avec v1.0 : tous les nouveaux champs sont OPTIONNELS.
// Le moteur retombe sur les fallbacks conventionnels RT quand absent.
//
// Mapping : `formToBuildingInputs` construit un BuildingInputs avec :
//   - walls[] avec MaterialLayer[] si matériau + isolation renseignés
//   - openings[] avec frame BOIS|PVC|ALU_RP|ALU_SANS_RP|METAL
//   - heating[] multi-systèmes (principal + secondaire optionnel)
//   - ventilation avec heat_recovery_eff calculé
//   - hazards[] propagé
//   - inertia : saisi ou déduit (matériau + période)

import type {
  BuildingInputs, Household, Scenario, WorkKind,
  ClimateZone, ConstructionPeriod, BuildingType, OccupationProfile,
  HeatingSystemKind, EnergyCarrier, DhwSystemKind, VentilationKind,
  HazardFlag, MaterialLayer, OpaqueWall, Opening,
} from "../types";

// ════════════════════════════════════════════════════════════════════════════
// TYPES NOUVEAUX (Lot A enrichissement)
// ════════════════════════════════════════════════════════════════════════════

/** Matériaux porteurs des murs (12 catalogue France + Mixte + Inconnu). */
export type WallMaterialKind =
  | "PIERRE"
  | "MOELLON"
  | "BRIQUE_PLEINE"
  | "BRIQUE_CREUSE"
  | "PARPAING"
  | "BETON_BANCHE"
  | "BETON_CELLULAIRE"
  | "OSSATURE_BOIS"
  | "PISE_TERRE_CRUE"
  | "COLOMBAGE"
  | "MACHEFER"
  | "MIXTE"
  | "INCONNU";

/** Type physique de toiture/combles. */
export type RoofKind =
  | "INCLINEE"
  | "TERRASSE"
  | "COMBLES_PERDUS"
  | "COMBLES_AMENAGES"
  | "RAMPANT"
  | "INCONNU";

/** Type de plancher bas (sur quoi il repose). */
export type FloorKind =
  | "TERRE_PLEIN"
  | "VIDE_SANITAIRE"
  | "SOUS_SOL_NC"
  | "GARAGE"
  | "EXTERIEUR"
  | "INCONNU";

/** État d'isolation d'une paroi. */
export type InsulationStatus = "OUI" | "NON" | "INCONNUE";

/** Type d'isolation (position dans la paroi). */
export type InsulationType =
  | "ITE"             // par l'extérieur
  | "ITI"             // par l'intérieur
  | "REPARTIE"        // matériau porteur isolant (ex : béton cellulaire, monomur)
  | "ENTRE_CHEVRONS"  // pour toitures inclinées
  | "INCONNU"
  | "NA";

/** Matériau isolant (10 plus courants en France + Autre + Inconnu). */
export type InsulationMaterialKind =
  | "LAINE_VERRE"
  | "LAINE_ROCHE"
  | "OUATE_CELLULOSE"
  | "FIBRE_BOIS"
  | "POLYSTYRENE_PSE"
  | "POLYURETHANE_PUR"
  | "LIEGE"
  | "CHANVRE"
  | "PAILLE"
  | "BETON_CELLULAIRE"
  | "AUTRE"
  | "INCONNU";

/** Frame des menuiseries (alias de WindowFrame moteur, élargi avec MIXTE/INCONNU). */
export type WindowFrameKind =
  | "BOIS"
  | "PVC"
  | "ALU_RP"          // alu rupture de pont thermique
  | "ALU_SANS_RP"
  | "METAL"
  | "MIXTE"
  | "INCONNU";

/** Mitoyenneté : nombre de murs partagés avec mitoyens (= non déperditifs). */
export type Mitoyennete =
  | "AUCUNE"
  | "UN_MUR"
  | "DEUX_MURS"
  | "TROIS_MURS"
  | "INCONNU";

/** État des ponts thermiques. */
export type ThermalBridges =
  | "NON_TRAITES"
  | "PARTIEL"
  | "TRAITES"
  | "INCONNUS";

/** Protections solaires existantes (confort été). */
export type SolarShade =
  | "AUCUNE"
  | "VOLETS_BATTANTS"
  | "VOLETS_ROULANTS"
  | "BRISE_SOLEIL"
  | "STORES_EXT"
  | "AUVENT"
  | "VEGETATION"
  | "INCONNU";

/** Émetteurs de chauffage. */
export type HeatingEmitterKind =
  | "RAD_FONTE"
  | "RAD_ACIER"
  | "RAD_BT"              // basse température
  | "PLANCHER_CHAUFFANT"
  | "VENTILO_CONVECTEUR"
  | "SPLITS_AIR_AIR"
  | "POELE_LOCALISE"
  | "AUTRE"
  | "INCONNU";

/** Types de travaux passés (cochables avec année). */
export type TravauxPasseType =
  | "ISO_MURS"
  | "ISO_TOITURE"
  | "ISO_PLANCHER"
  | "MENUISERIES"
  | "CHAUFFAGE"
  | "VENTILATION"
  | "SOLAIRE_PV"
  | "SOLAIRE_THERMIQUE"
  | "RENOV_GLOBALE";

export interface TravauxRealise {
  type: TravauxPasseType;
  /** Année approximative ; undefined = "Inconnu". */
  yearApprox?: number;
}

/** Production solaire installée. */
export type SolarProductionKind =
  | "AUCUNE"
  | "PV"                  // photovoltaïque seul
  | "THERMIQUE"           // solaire thermique seul (ECS)
  | "PV_THERM"            // les deux
  | "INCONNU";

/** Orientation cardinale (façade principale ou entrée). */
export type Orientation =
  | "N" | "NE" | "E" | "SE" | "S" | "SO" | "O" | "NO" | "INCONNU";

/** Environnement végétal / paysager autour du bâtiment. */
export type EnvironmentVegetation =
  | "AUCUN"           // terrain dégagé
  | "ARBRES_PROCHES"  // grands arbres < 10 m
  | "ARBRES_MOYENS"   // végétation moyenne
  | "DENSE"           // forêt / jardin très planté
  | "INCONNU";

/** Type de terrain. */
export type TerrainSlope =
  | "PLAT"
  | "PENTE_LEGERE"
  | "PENTE_FORTE"
  | "DEMI_NIVEAU"
  | "INCONNU";

/** Exposition au vent dominant. */
export type WindExposure =
  | "ABRITE"          // entouré bâtiments / végétation dense
  | "MODEREE"         // ouverture partielle
  | "EXPOSEE"         // façade face vent dominant
  | "TRES_EXPOSEE"    // crête, plateau, bord de mer
  | "INCONNU";

// ════════════════════════════════════════════════════════════════════════════
// BUILDING FORM DATA — v2.0 (rétro-compat : tous champs nouveaux sont optionnels)
// ════════════════════════════════════════════════════════════════════════════

export interface BuildingFormData {
  // ─── Identification (inchangé) ────────────────────────────────────────────
  projectName: string;
  buildingType: BuildingType;
  constructionPeriod: ConstructionPeriod;
  climateZone: ClimateZone;
  altitudeM: number;

  /** v2.0 — Année exacte si connue (override période). */
  constructionYearExact?: number;
  /** v2.0 — Occupation pour ECS et hypothèses. */
  occupation?: OccupationProfile;

  // ─── Géométrie (inchangé) ────────────────────────────────────────────────
  surfaceHabitableM2: number;
  hauteurSousPlafondM: number;
  niveauCount: number;

  /** v2.0 — Mitoyenneté (réduit surface mur déperditive). */
  mitoyennete?: Mitoyennete;

  // ─── Enveloppe agrégée (inchangé) ────────────────────────────────────────
  wallSurfaceM2: number;
  roofSurfaceM2: number;
  floorSurfaceM2: number;
  windowSurfaceM2: number;
  windowGlazing: "SIMPLE" | "DOUBLE_AIR" | "DOUBLE_ARGON" | "TRIPLE";

  // ─── MURS détail (v2.0) ──────────────────────────────────────────────────
  wallMaterial?: WallMaterialKind;
  wallInsulationStatus?: InsulationStatus;
  wallInsulationType?: InsulationType;
  wallInsulationMaterial?: InsulationMaterialKind;
  /** Épaisseur isolant murs en CENTIMÈTRES (UX). Le mapping convertit en m. */
  wallInsulationThicknessCm?: number;
  wallInsulationYear?: number;
  /** R en m².K/W si connu (override). */
  wallRValue?: number;
  /** U en W/m².K si connu (override). */
  wallUValue?: number;

  // ─── TOITURE / COMBLES détail (v2.0) ─────────────────────────────────────
  roofKind?: RoofKind;
  roofInsulationStatus?: InsulationStatus;
  roofInsulationMaterial?: InsulationMaterialKind;
  roofInsulationThicknessCm?: number;
  roofInsulationYear?: number;
  roofRValue?: number;
  roofUValue?: number;

  // ─── PLANCHER BAS détail (v2.0) ──────────────────────────────────────────
  floorKind?: FloorKind;
  floorInsulationStatus?: InsulationStatus;
  floorInsulationMaterial?: InsulationMaterialKind;
  floorInsulationThicknessCm?: number;
  floorRValue?: number;
  floorUValue?: number;

  // ─── MENUISERIES détail (v2.0) ───────────────────────────────────────────
  windowFrame?: WindowFrameKind;
  /** Volets / protections existantes. */
  windowShutters?: "OUI" | "NON" | "INCONNU";
  windowRenovationYear?: number;

  // ─── Ponts thermiques (v2.0) ─────────────────────────────────────────────
  thermalBridges?: ThermalBridges;

  // ─── Systèmes (existant + extensions v2.0) ────────────────────────────────
  heatingKind: HeatingSystemKind;
  heatingInstallYear?: number;
  /** v2.0 — Rendement saisonnier 0..1 si connu (η_g). */
  heatingEfficiency?: number;
  /** v2.0 — Couverture chauffage principal 0..1 (défaut 1). */
  heatingCoverageShare?: number;
  /** v2.0 — Système d'appoint (poêle, cheminée, split…). */
  heatingSecondaryKind?: HeatingSystemKind;
  heatingSecondaryCoverage?: number;
  /** v2.0 — Émetteurs principaux. */
  heatingEmitters?: HeatingEmitterKind;

  dhwKind: DhwSystemKind;
  /** v2.0 — Volume du ballon ECS (L) si applicable. */
  dhwVolumeL?: number;

  ventilationKind: VentilationKind;
  /** v2.0 — Rendement récup VMC double flux 0..1 (si VMC_DF). */
  ventilationHeatRecoveryEff?: number;

  // ─── Production solaire (v2.0) ────────────────────────────────────────────
  solarProduction?: SolarProductionKind;
  /** Puissance PV installée en kWc. */
  solarPvKWc?: number;

  // ─── Confort été (v2.0) ──────────────────────────────────────────────────
  solarShade?: SolarShade;
  /** v2.0 — Climatisation présente. */
  hasAirConditioning?: boolean;
  /** v2.0 — Surchauffe été ressentie par l'occupant. */
  summerOverheatingFelt?: boolean;
  /** v2.0 — Inertie thermique ressentie (saisi ; sinon déduit). */
  inertia?: "LEGERE" | "MOYENNE" | "FORTE";

  // ─── Travaux passés (v2.0) ───────────────────────────────────────────────
  travauxRealises?: TravauxRealise[];

  // ─── Hazards / contraintes patrimoniales (v2.0) ──────────────────────────
  hazards?: HazardFlag[];

  // ─── Documents disponibles (v2.0 — informatif, pas d'upload encore) ──────
  documentsAvailable?: {
    dpe?: boolean;
    audit?: boolean;
    facturesEnergie?: boolean;
    facturesTravaux?: boolean;
    plans?: boolean;
    permisConstruire?: boolean;
    taxeFonciere?: boolean;
    reglementCopro?: boolean;
  };

  // ─── Situation du bâtiment (v2.1 — environnement + orientation) ──────────
  /** Orientation de la façade principale (ouvertures majeures). */
  mainFacadeOrientation?: Orientation;
  /** Orientation de l'entrée principale. */
  entranceOrientation?: Orientation;
  /** Environnement végétal autour du bâti. */
  vegetation?: EnvironmentVegetation;
  /** Nombre approximatif de fenêtres (toutes pièces confondues). */
  nbWindows?: number;
  /** Présence d'un balcon / loggia (impact ponts thermiques). */
  hasBalcony?: boolean;
  nbBalconies?: number;
  /** Présence d'un garage. */
  hasGarage?: boolean;
  /** Garage attenant au volume chauffé (impact thermique). */
  garageAttached?: boolean;
  /** Présence d'une cave / sous-sol. */
  hasCellar?: boolean;
  /** Présence d'une véranda (espace tampon). */
  hasVeranda?: boolean;
  /** Présence d'une cheminée ouverte traversante (impact étanchéité). */
  hasOpenFireplace?: boolean;
  /** Pente du terrain. */
  terrainSlope?: TerrainSlope;
  /** Exposition au vent dominant. */
  windExposure?: WindExposure;
  /** Nombre approximatif de portes extérieures (entrées). */
  nbExteriorDoors?: number;

  // ─── Usage (existant) ────────────────────────────────────────────────────
  occupants: number;
  setpointWinterC?: number;
  setpointSummerC?: number;

  // ─── Foyer (existant) ────────────────────────────────────────────────────
  householdSize: number;
  householdRfrEur?: number;
  householdIdf: boolean;

  // ─── Autonomie & handicap (v2.2) ─────────────────────────────────────────
  /** Présence d'au moins un occupant en situation de handicap. */
  hasHandicappedOccupant?: boolean;
  /** Présence d'au moins un occupant senior (60+). */
  hasElderlyOccupant?: boolean;
  /** Âge du plus âgé des occupants (optionnel, pour éligibilité fine). */
  oldestOccupantAge?: number;
  /** Niveau GIR le plus marqué (1 = lourde, 6 = autonome). */
  occupantGir?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Taux de reconnaissance handicap (%) le plus marqué. */
  occupantHandicapRate?: number;

  // ─── Sous-type projet & champs conditionnels (v2.3) ──────────────────────
  /** Sous-type sélectionné (appartement / immeuble / bureau / commerce…). */
  projectSubType?:
    | "MAISON_INDIVIDUELLE"
    | "PAVILLON"
    | "MAISON_DE_VILLE"
    | "APPARTEMENT"
    | "IMMEUBLE_ENTIER"
    | "COPROPRIETE_PARTIES_COMMUNES"
    | "BUREAU"
    | "COMMERCE"
    | "ERP"
    | "BATIMENT_PUBLIC"
    | "LOCAL_ACTIVITE";

  // ─ Champs conditionnels appartement / immeuble / copro ─
  floorLevel?: number;          // 0 = RDC, 1 = 1er étage…
  isTopFloor?: boolean;         // Dernier étage (sous toiture)
  isGroundFloor?: boolean;      // RDC (plancher sur extérieur ou cave)
  lotsCount?: number;           // Nombre de lots (immeuble / copro)
  buildingsCount?: number;      // Nombre de bâtiments (copro)
  commonHeating?: boolean;      // Chauffage collectif ?
  commonDhw?: boolean;          // ECS collective ?
  commonVentilation?: boolean;  // Ventilation collective ?

  // ─ Champs conditionnels tertiaire ─
  tertiaryActivityKind?:
    | "BUREAUX_ADMIN"
    | "COMMERCE_ALIMENTAIRE"
    | "COMMERCE_NON_ALIMENTAIRE"
    | "RESTAURATION"
    | "HOTEL"
    | "ENSEIGNEMENT"
    | "SANTE"
    | "SPORT_LOISIR"
    | "ATELIER"
    | "ENTREPOT";
  operatingHoursPerWeek?: number;     // Heures d'occupation hebdo
  occupancyDensity?: number;          // Personnes / m²
  shopWindowSurfaceM2?: number;       // Surface vitrines (commerce)
  hasColdChain?: boolean;             // Chaîne du froid (commerce alim)
  itConsumptionKwhPerM2Year?: number; // Consommation IT bureau
  isDeetSubject?: boolean;            // ≥ 1000 m² tertiaire → DEET applicable

  // ─ Champs conditionnels copropriété ─
  hasAgPv3y?: boolean;          // PV AG des 3 dernières années collectés
  pptStatus?:
    | "NON_FAIT"
    | "EN_PREPARATION"
    | "VOTE"
    | "EN_EXECUTION"
    | "NON_APPLICABLE";

  // ─── Scénarios (existant) ────────────────────────────────────────────────
  scenariosEnabled: {
    isolationOnly: boolean;
    heatingOnly: boolean;
    global: boolean;
  };

  // ─── Notes utilisateur (v2.0) ────────────────────────────────────────────
  notes?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// MAPPINGS auxiliaires (carrier, lambda, conversion U/R)
// ════════════════════════════════════════════════════════════════════════════

const HEATING_CARRIER: Record<HeatingSystemKind, EnergyCarrier> = {
  CHAUDIERE_GAZ_STD: "GAZ_NAT",
  CHAUDIERE_GAZ_COND: "GAZ_NAT",
  CHAUDIERE_FIOUL: "FIOUL",
  CHAUDIERE_BOIS_BUCHE: "BOIS_BUCHE",
  CHAUDIERE_BOIS_GRANUL: "BOIS_GRANUL",
  PAC_AIR_AIR: "ELEC",
  PAC_AIR_EAU: "ELEC",
  PAC_GEO: "ELEC",
  RADIATEUR_ELEC: "ELEC",
  CONVECTEUR_ELEC_NG: "ELEC",
  POELE_BOIS_BUCHE: "BOIS_BUCHE",
  POELE_GRANUL: "BOIS_GRANUL",
  RES_CHALEUR_URBAIN: "RES_CH",
  INSERT_CHEMINEE: "BOIS_BUCHE",
};

const DHW_CARRIER: Record<DhwSystemKind, EnergyCarrier> = {
  BALLON_ELEC: "ELEC",
  BALLON_THERMODYN: "ELEC",
  CHAUDIERE_INTEGREE: "GAZ_NAT",
  SOLAIRE_THERM_APPOINT: "ELEC",
  GAZ_INSTANT: "GAZ_NAT",
};

/** Conductivité thermique λ (W/m.K) par isolant. */
const LAMBDA_BY_INSULATION: Record<InsulationMaterialKind, number> = {
  LAINE_VERRE:        0.035,
  LAINE_ROCHE:        0.036,
  OUATE_CELLULOSE:    0.040,
  FIBRE_BOIS:         0.038,
  POLYSTYRENE_PSE:    0.032,
  POLYURETHANE_PUR:   0.024,
  LIEGE:              0.040,
  CHANVRE:            0.042,
  PAILLE:             0.052,
  BETON_CELLULAIRE:   0.090,  // c'est un porteur, faiblement isolant
  AUTRE:              0.040,
  INCONNU:            0.040,
};

/** Conductivité λ approximative pour matériaux porteurs murs. */
const LAMBDA_BY_WALL_MATERIAL: Record<WallMaterialKind, number> = {
  PIERRE:           2.20,
  MOELLON:          1.70,
  BRIQUE_PLEINE:    0.84,
  BRIQUE_CREUSE:    0.45,
  PARPAING:         0.95,
  BETON_BANCHE:     1.75,
  BETON_CELLULAIRE: 0.16,
  OSSATURE_BOIS:    0.13,    // bois résineux + isolant intégré
  PISE_TERRE_CRUE:  0.50,
  COLOMBAGE:        0.20,
  MACHEFER:         0.90,
  MIXTE:            1.00,
  INCONNU:          1.00,
};

/** Épaisseur conventionnelle pour le matériau porteur (m) si non spécifié. */
const DEFAULT_WALL_THICKNESS_M: Record<WallMaterialKind, number> = {
  PIERRE:           0.60,
  MOELLON:          0.50,
  BRIQUE_PLEINE:    0.30,
  BRIQUE_CREUSE:    0.25,
  PARPAING:         0.20,
  BETON_BANCHE:     0.20,
  BETON_CELLULAIRE: 0.30,
  OSSATURE_BOIS:    0.20,
  PISE_TERRE_CRUE:  0.70,
  COLOMBAGE:        0.18,
  MACHEFER:         0.30,
  MIXTE:            0.30,
  INCONNU:          0.30,
};

/** Inertie déduite du matériau porteur (utile si pas saisi). */
const INERTIA_BY_WALL_MATERIAL: Record<
  WallMaterialKind,
  "LEGERE" | "MOYENNE" | "FORTE"
> = {
  PIERRE: "FORTE",
  MOELLON: "FORTE",
  BRIQUE_PLEINE: "FORTE",
  BRIQUE_CREUSE: "MOYENNE",
  PARPAING: "MOYENNE",
  BETON_BANCHE: "FORTE",
  BETON_CELLULAIRE: "MOYENNE",
  OSSATURE_BOIS: "LEGERE",
  PISE_TERRE_CRUE: "FORTE",
  COLOMBAGE: "LEGERE",
  MACHEFER: "MOYENNE",
  MIXTE: "MOYENNE",
  INCONNU: "MOYENNE",
};

/** Mapping WindowFrameKind du form (élargi) → WindowFrame moteur (strict). */
function frameKindToMotor(
  f: WindowFrameKind | undefined,
): "BOIS" | "PVC" | "ALU_RP" | "ALU_SANS_RP" | "METAL" {
  if (f === "BOIS") return "BOIS";
  if (f === "PVC") return "PVC";
  if (f === "ALU_RP") return "ALU_RP";
  if (f === "ALU_SANS_RP") return "ALU_SANS_RP";
  if (f === "METAL") return "METAL";
  // MIXTE et INCONNU → PVC (le plus courant en parc rénové FR)
  return "PVC";
}

/** RoofKind du form → subtype OpaqueWall.kind=ROOF du moteur. */
function roofKindToSubtype(
  k: RoofKind | undefined,
  buildingType: BuildingType,
): "TOITURE" | "COMBLES_PERDUS" | "COMBLES_AMENAGES" | "TERRASSE" {
  if (k === "COMBLES_PERDUS") return "COMBLES_PERDUS";
  if (k === "COMBLES_AMENAGES" || k === "RAMPANT") return "COMBLES_AMENAGES";
  if (k === "TERRASSE") return "TERRASSE";
  if (k === "INCLINEE") return "TOITURE";
  // Fallback selon type bâtiment
  return buildingType === "MAISON_INDIV" ? "COMBLES_AMENAGES" : "TOITURE";
}

/** FloorKind du form → subtype FloorType moteur. */
function floorKindToSubtype(
  k: FloorKind | undefined,
): "BAS_TERRE_PLEIN" | "BAS_VIDE_SANIT" | "BAS_SOUS_SOL" | "INTER" {
  if (k === "TERRE_PLEIN") return "BAS_TERRE_PLEIN";
  if (k === "VIDE_SANITAIRE") return "BAS_VIDE_SANIT";
  if (k === "SOUS_SOL_NC" || k === "GARAGE") return "BAS_SOUS_SOL";
  // EXTERIEUR → on traite comme plancher mitoyen extérieur (BAS_VIDE_SANIT)
  return "BAS_VIDE_SANIT";
}

/** Construit les MaterialLayer[] d'une paroi opaque selon les saisies. */
function buildWallLayers(d: BuildingFormData): MaterialLayer[] | undefined {
  if (!d.wallMaterial && !d.wallInsulationMaterial) return undefined;
  const layers: MaterialLayer[] = [];
  // Porteur
  if (d.wallMaterial) {
    layers.push({
      material_key: `WALL_${d.wallMaterial}`,
      thickness_m: DEFAULT_WALL_THICKNESS_M[d.wallMaterial],
      lambda_W_mK: LAMBDA_BY_WALL_MATERIAL[d.wallMaterial],
    });
  }
  // Isolant (si renseigné)
  if (
    d.wallInsulationStatus === "OUI" &&
    d.wallInsulationMaterial &&
    d.wallInsulationMaterial !== "INCONNU"
  ) {
    const thicknessCm = d.wallInsulationThicknessCm ?? 10;
    layers.push({
      material_key: `INS_${d.wallInsulationMaterial}`,
      thickness_m: Math.max(0.01, thicknessCm / 100),
      lambda_W_mK: LAMBDA_BY_INSULATION[d.wallInsulationMaterial],
    });
  }
  return layers.length > 0 ? layers : undefined;
}

function buildRoofLayers(d: BuildingFormData): MaterialLayer[] | undefined {
  if (
    d.roofInsulationStatus !== "OUI" ||
    !d.roofInsulationMaterial ||
    d.roofInsulationMaterial === "INCONNU"
  )
    return undefined;
  const thicknessCm = d.roofInsulationThicknessCm ?? 20;
  return [
    {
      material_key: `INS_${d.roofInsulationMaterial}`,
      thickness_m: Math.max(0.01, thicknessCm / 100),
      lambda_W_mK: LAMBDA_BY_INSULATION[d.roofInsulationMaterial],
    },
  ];
}

function buildFloorLayers(d: BuildingFormData): MaterialLayer[] | undefined {
  if (
    d.floorInsulationStatus !== "OUI" ||
    !d.floorInsulationMaterial ||
    d.floorInsulationMaterial === "INCONNU"
  )
    return undefined;
  const thicknessCm = d.floorInsulationThicknessCm ?? 8;
  return [
    {
      material_key: `INS_${d.floorInsulationMaterial}`,
      thickness_m: Math.max(0.01, thicknessCm / 100),
      lambda_W_mK: LAMBDA_BY_INSULATION[d.floorInsulationMaterial],
    },
  ];
}

/**
 * Calcule U à partir de R si fourni ; R = somme des résistances couches +
 * 0.17 (Rsi+Rse). Si l'utilisateur a saisi U directement, on le retourne.
 */
function deriveUFromR(rValue?: number, uValue?: number): number | undefined {
  if (uValue !== undefined && uValue > 0) return uValue;
  if (rValue !== undefined && rValue > 0) return 1 / (rValue + 0.17);
  return undefined;
}

/** Rendement saisonnier typique par kind chauffage (si non saisi). */
const DEFAULT_HEATING_EFFICIENCY: Record<HeatingSystemKind, number> = {
  CHAUDIERE_GAZ_STD: 0.85,
  CHAUDIERE_GAZ_COND: 1.05,
  CHAUDIERE_FIOUL: 0.78,
  CHAUDIERE_BOIS_BUCHE: 0.65,
  CHAUDIERE_BOIS_GRANUL: 0.85,
  PAC_AIR_AIR: 2.8,
  PAC_AIR_EAU: 3.0,
  PAC_GEO: 4.5,
  RADIATEUR_ELEC: 1.0,
  CONVECTEUR_ELEC_NG: 1.0,
  POELE_BOIS_BUCHE: 0.70,
  POELE_GRANUL: 0.85,
  RES_CHALEUR_URBAIN: 0.90,
  INSERT_CHEMINEE: 0.60,
};

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION (étendue pour les champs v2.0 critiques)
// ════════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  ok: boolean;
  errors: Array<{ field: keyof BuildingFormData | "scenariosEnabled"; message: string }>;
}

export function validateBuildingForm(d: BuildingFormData): ValidationResult {
  const errors: ValidationResult["errors"] = [];
  if (!d.projectName?.trim()) errors.push({ field: "projectName", message: "Nom du projet obligatoire" });
  if (d.surfaceHabitableM2 <= 0)  errors.push({ field: "surfaceHabitableM2", message: "Surface habitable > 0" });
  if (d.surfaceHabitableM2 > 10000) errors.push({ field: "surfaceHabitableM2", message: "Surface ≤ 10 000 m²" });
  if (d.hauteurSousPlafondM < 2 || d.hauteurSousPlafondM > 6) errors.push({ field: "hauteurSousPlafondM", message: "Hauteur 2-6 m" });
  if (d.niveauCount < 1 || d.niveauCount > 30) errors.push({ field: "niveauCount", message: "Niveaux 1-30" });
  if (d.wallSurfaceM2 < 0) errors.push({ field: "wallSurfaceM2", message: "≥ 0" });
  if (d.roofSurfaceM2 < 0) errors.push({ field: "roofSurfaceM2", message: "≥ 0" });
  if (d.floorSurfaceM2 < 0) errors.push({ field: "floorSurfaceM2", message: "≥ 0" });
  if (d.windowSurfaceM2 < 0) errors.push({ field: "windowSurfaceM2", message: "≥ 0" });
  if (d.altitudeM < 0 || d.altitudeM > 3000) errors.push({ field: "altitudeM", message: "Altitude 0-3000 m" });
  if (d.occupants < 1 || d.occupants > 30) errors.push({ field: "occupants", message: "Occupants 1-30" });
  if (d.householdSize < 1 || d.householdSize > 15) errors.push({ field: "householdSize", message: "Taille foyer 1-15" });
  if (d.householdRfrEur != null && d.householdRfrEur < 0) errors.push({ field: "householdRfrEur", message: "RFR ≥ 0" });
  // v2.0 — validations supplémentaires
  if (d.constructionYearExact != null && (d.constructionYearExact < 1700 || d.constructionYearExact > 2100)) {
    errors.push({ field: "constructionYearExact", message: "Année 1700-2100" });
  }
  if (d.wallInsulationThicknessCm != null && (d.wallInsulationThicknessCm < 0 || d.wallInsulationThicknessCm > 80)) {
    errors.push({ field: "wallInsulationThicknessCm", message: "Épaisseur 0-80 cm" });
  }
  if (d.roofInsulationThicknessCm != null && (d.roofInsulationThicknessCm < 0 || d.roofInsulationThicknessCm > 80)) {
    errors.push({ field: "roofInsulationThicknessCm", message: "Épaisseur 0-80 cm" });
  }
  if (d.solarPvKWc != null && (d.solarPvKWc < 0 || d.solarPvKWc > 100)) {
    errors.push({ field: "solarPvKWc", message: "Puissance PV 0-100 kWc" });
  }
  if (d.heatingCoverageShare != null && (d.heatingCoverageShare < 0 || d.heatingCoverageShare > 1)) {
    errors.push({ field: "heatingCoverageShare", message: "Couverture 0-1" });
  }
  if (!d.scenariosEnabled.isolationOnly && !d.scenariosEnabled.heatingOnly && !d.scenariosEnabled.global) {
    errors.push({ field: "scenariosEnabled", message: "Sélectionnez au moins un scénario" });
  }
  return { ok: errors.length === 0, errors };
}

// ════════════════════════════════════════════════════════════════════════════
// MAPPING form → BuildingInputs (v2.0 enrichi)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Construit un BuildingInputs complet à partir du BuildingFormData v2.0.
 * Les champs non saisis utilisent les valeurs conventionnelles RT par période
 * (cf. parameters/constants.ts).
 */
export function formToBuildingInputs(
  d: BuildingFormData,
  projectId: string,
): BuildingInputs {
  // ─── Walls / Roof / Floor enrichis ──────────────────────────────────────
  const walls: OpaqueWall[] = [];

  if (d.wallSurfaceM2 > 0) {
    const layers = buildWallLayers(d);
    walls.push({
      id: "wall-ext",
      kind: "WALL",
      subtype: "EXT",
      surface_m2: d.wallSurfaceM2,
      u_value_W_m2K: deriveUFromR(d.wallRValue, d.wallUValue),
      layers,
    });
  }

  if (d.roofSurfaceM2 > 0) {
    walls.push({
      id: "roof-main",
      kind: "ROOF",
      subtype: roofKindToSubtype(d.roofKind, d.buildingType),
      surface_m2: d.roofSurfaceM2,
      u_value_W_m2K: deriveUFromR(d.roofRValue, d.roofUValue),
      layers: buildRoofLayers(d),
    });
  }

  if (d.floorSurfaceM2 > 0) {
    walls.push({
      id: "floor-low",
      kind: "FLOOR",
      subtype: floorKindToSubtype(d.floorKind),
      surface_m2: d.floorSurfaceM2,
      u_value_W_m2K: deriveUFromR(d.floorRValue, d.floorUValue),
      layers: buildFloorLayers(d),
    });
  }

  // ─── Openings enrichis (frame + volets) ─────────────────────────────────
  const openings: Opening[] =
    d.windowSurfaceM2 > 0
      ? [
          {
            id: "win-all",
            kind: "WINDOW",
            surface_m2: d.windowSurfaceM2,
            glazing: d.windowGlazing,
            frame: frameKindToMotor(d.windowFrame),
          },
        ]
      : [];

  // ─── Heating multi-systèmes ──────────────────────────────────────────────
  const heating = [];
  const primaryCoverage = d.heatingCoverageShare ?? 1;
  heating.push({
    id: "h-primary",
    kind: d.heatingKind,
    carrier: HEATING_CARRIER[d.heatingKind],
    install_year: d.heatingInstallYear,
    efficiency:
      d.heatingEfficiency ?? DEFAULT_HEATING_EFFICIENCY[d.heatingKind],
    coverage_share: Math.max(0, Math.min(1, primaryCoverage)),
  });
  if (d.heatingSecondaryKind) {
    const secCoverage = d.heatingSecondaryCoverage ?? Math.max(0, 1 - primaryCoverage);
    heating.push({
      id: "h-secondary",
      kind: d.heatingSecondaryKind,
      carrier: HEATING_CARRIER[d.heatingSecondaryKind],
      efficiency: DEFAULT_HEATING_EFFICIENCY[d.heatingSecondaryKind],
      coverage_share: Math.max(0, Math.min(1, secCoverage)),
    });
  }

  // ─── Ventilation avec rendement DF ───────────────────────────────────────
  const ventilation = {
    id: "v1",
    kind: d.ventilationKind,
    heat_recovery_eff:
      d.ventilationKind === "VMC_DF"
        ? d.ventilationHeatRecoveryEff ?? 0.85
        : undefined,
  };

  // ─── Inertia : saisi ou déduit du matériau ───────────────────────────────
  const inertia: "LEGERE" | "MOYENNE" | "FORTE" =
    d.inertia ??
    (d.wallMaterial ? INERTIA_BY_WALL_MATERIAL[d.wallMaterial] : "MOYENNE");

  // ─── Hazards : copie directe ────────────────────────────────────────────
  const hazards: HazardFlag[] = d.hazards ?? [];

  return {
    id: projectId,
    type: d.buildingType,
    occupation: d.occupation ?? "PRIMARY",
    construction_period: d.constructionPeriod,
    construction_year: d.constructionYearExact,
    climate_zone: d.climateZone,
    altitude_m: d.altitudeM,
    surface_habitable_m2: d.surfaceHabitableM2,
    hauteur_sous_plafond_m: d.hauteurSousPlafondM,
    niveau_count: d.niveauCount,
    walls,
    openings,
    heating,
    dhw: [
      {
        id: "d1",
        kind: d.dhwKind,
        carrier: DHW_CARRIER[d.dhwKind],
      },
    ],
    ventilation,
    setpoint_winter_C: d.setpointWinterC ?? 19,
    setpoint_summer_C: d.setpointSummerC ?? 26,
    occupants: d.occupants,
    inertia,
    hazards,
    notes: d.notes,
  };
}

export function formToHousehold(d: BuildingFormData): Household {
  return {
    size: d.householdSize,
    rfr_eur: d.householdRfrEur,
    is_idf: d.householdIdf,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// SCÉNARIOS (inchangé v1.0)
// ════════════════════════════════════════════════════════════════════════════

export function buildScenarios(d: BuildingFormData): Scenario[] {
  const scenarios: Scenario[] = [];
  if (d.scenariosEnabled.isolationOnly) {
    scenarios.push({
      id: "sc-iso",
      name: "Isolation seule",
      description: "ITE murs + isolation combles/toiture + plancher bas",
      works: [
        { id: "w-ite", kind: "ISO_MURS_ITE" },
        { id: "w-roof", kind: d.buildingType === "MAISON_INDIV" ? "ISO_COMBLES_AMENAGES" : "ISO_TOITURE" },
        { id: "w-floor", kind: "ISO_PLANCHER_BAS" },
      ],
    });
  }
  if (d.scenariosEnabled.heatingOnly) {
    const targetHeating: WorkKind = d.heatingKind === "CHAUDIERE_GAZ_STD" || d.heatingKind === "CHAUDIERE_GAZ_COND"
      ? "REMPLACEMENT_CHAUDIERE_COND"
      : "PAC_AIR_EAU";
    scenarios.push({
      id: "sc-heat",
      name: "Chauffage seul",
      description: targetHeating === "PAC_AIR_EAU" ? "Remplacement par PAC air/eau + chauffe-eau thermodynamique" : "Chaudière condensation + chauffe-eau thermodynamique",
      works: [
        { id: "w-heat", kind: targetHeating },
        { id: "w-ceth", kind: "CHAUFFE_EAU_THERMODYN" },
      ],
    });
  }
  if (d.scenariosEnabled.global) {
    scenarios.push({
      id: "sc-glob",
      name: "Rénovation globale BBC",
      description: "Isolation enveloppe + menuiseries + PAC + VMC double flux",
      works: [
        { id: "w-ite", kind: "ISO_MURS_ITE" },
        { id: "w-roof", kind: d.buildingType === "MAISON_INDIV" ? "ISO_COMBLES_AMENAGES" : "ISO_TOITURE" },
        { id: "w-floor", kind: "ISO_PLANCHER_BAS" },
        { id: "w-mtv", kind: "MENUISERIES_TV" },
        { id: "w-pac", kind: "PAC_AIR_EAU" },
        { id: "w-vmcdf", kind: "VMC_DF" },
        { id: "w-ceth", kind: "CHAUFFE_EAU_THERMODYN" },
      ],
    });
  }
  return scenarios;
}

// ════════════════════════════════════════════════════════════════════════════
// LABELS FR (Lot A — pour UI selects)
// ════════════════════════════════════════════════════════════════════════════

export const WALL_MATERIAL_LABELS_FR: Record<WallMaterialKind, string> = {
  PIERRE: "Pierre",
  MOELLON: "Moellon",
  BRIQUE_PLEINE: "Brique pleine",
  BRIQUE_CREUSE: "Brique creuse",
  PARPAING: "Parpaing",
  BETON_BANCHE: "Béton banché",
  BETON_CELLULAIRE: "Béton cellulaire",
  OSSATURE_BOIS: "Ossature bois",
  PISE_TERRE_CRUE: "Pisé / terre crue",
  COLOMBAGE: "Colombage",
  MACHEFER: "Mâchefer",
  MIXTE: "Mixte",
  INCONNU: "Je ne sais pas",
};

export const ROOF_KIND_LABELS_FR: Record<RoofKind, string> = {
  INCLINEE: "Toiture inclinée",
  TERRASSE: "Toiture terrasse",
  COMBLES_PERDUS: "Combles perdus",
  COMBLES_AMENAGES: "Combles aménagés",
  RAMPANT: "Rampant (sous toiture)",
  INCONNU: "Je ne sais pas",
};

export const FLOOR_KIND_LABELS_FR: Record<FloorKind, string> = {
  TERRE_PLEIN: "Sur terre-plein",
  VIDE_SANITAIRE: "Sur vide sanitaire",
  SOUS_SOL_NC: "Sur sous-sol non chauffé",
  GARAGE: "Sur garage",
  EXTERIEUR: "Sur extérieur (passage couvert…)",
  INCONNU: "Je ne sais pas",
};

export const INSULATION_STATUS_LABELS_FR: Record<InsulationStatus, string> = {
  OUI: "Oui",
  NON: "Non",
  INCONNUE: "Je ne sais pas",
};

export const INSULATION_TYPE_LABELS_FR: Record<InsulationType, string> = {
  ITE: "ITE — par l'extérieur",
  ITI: "ITI — par l'intérieur",
  REPARTIE: "Répartie (matériau porteur isolant)",
  ENTRE_CHEVRONS: "Entre chevrons (toiture)",
  INCONNU: "Je ne sais pas",
  NA: "Sans objet",
};

export const INSULATION_MATERIAL_LABELS_FR: Record<
  InsulationMaterialKind,
  string
> = {
  LAINE_VERRE: "Laine de verre",
  LAINE_ROCHE: "Laine de roche",
  OUATE_CELLULOSE: "Ouate de cellulose",
  FIBRE_BOIS: "Fibre de bois",
  POLYSTYRENE_PSE: "Polystyrène (PSE)",
  POLYURETHANE_PUR: "Polyuréthane (PUR/PIR)",
  LIEGE: "Liège",
  CHANVRE: "Chanvre",
  PAILLE: "Paille",
  BETON_CELLULAIRE: "Béton cellulaire",
  AUTRE: "Autre matériau",
  INCONNU: "Je ne sais pas",
};

export const WINDOW_FRAME_LABELS_FR: Record<WindowFrameKind, string> = {
  BOIS: "Bois",
  PVC: "PVC",
  ALU_RP: "Aluminium à rupture de pont thermique",
  ALU_SANS_RP: "Aluminium sans rupture",
  METAL: "Métal (ancien)",
  MIXTE: "Mixte (bois/alu)",
  INCONNU: "Je ne sais pas",
};

export const MITOYENNETE_LABELS_FR: Record<Mitoyennete, string> = {
  AUCUNE: "Aucune (toutes façades extérieures)",
  UN_MUR: "Un mur mitoyen",
  DEUX_MURS: "Deux murs mitoyens",
  TROIS_MURS: "Trois murs mitoyens",
  INCONNU: "Je ne sais pas",
};

export const THERMAL_BRIDGES_LABELS_FR: Record<ThermalBridges, string> = {
  NON_TRAITES: "Non traités",
  PARTIEL: "Partiellement traités",
  TRAITES: "Traités",
  INCONNUS: "Je ne sais pas",
};

export const SOLAR_SHADE_LABELS_FR: Record<SolarShade, string> = {
  AUCUNE: "Aucune",
  VOLETS_BATTANTS: "Volets battants",
  VOLETS_ROULANTS: "Volets roulants",
  BRISE_SOLEIL: "Brise-soleil",
  STORES_EXT: "Stores extérieurs",
  AUVENT: "Auvent / casquette",
  VEGETATION: "Végétation (arbres, pergola)",
  INCONNU: "Je ne sais pas",
};

export const HEATING_EMITTER_LABELS_FR: Record<HeatingEmitterKind, string> = {
  RAD_FONTE: "Radiateurs en fonte",
  RAD_ACIER: "Radiateurs en acier",
  RAD_BT: "Radiateurs basse température",
  PLANCHER_CHAUFFANT: "Plancher chauffant",
  VENTILO_CONVECTEUR: "Ventilo-convecteurs",
  SPLITS_AIR_AIR: "Splits air/air",
  POELE_LOCALISE: "Poêle localisé (1 pièce)",
  AUTRE: "Autre",
  INCONNU: "Je ne sais pas",
};

export const TRAVAUX_PASSE_LABELS_FR: Record<TravauxPasseType, string> = {
  ISO_MURS: "Isolation des murs",
  ISO_TOITURE: "Isolation toiture / combles",
  ISO_PLANCHER: "Isolation plancher bas",
  MENUISERIES: "Remplacement des menuiseries",
  CHAUFFAGE: "Remplacement du chauffage",
  VENTILATION: "Installation / changement de ventilation",
  SOLAIRE_PV: "Panneaux solaires photovoltaïques",
  SOLAIRE_THERMIQUE: "Solaire thermique (ECS)",
  RENOV_GLOBALE: "Rénovation globale",
};

export const SOLAR_PRODUCTION_LABELS_FR: Record<SolarProductionKind, string> = {
  AUCUNE: "Aucune",
  PV: "Panneaux photovoltaïques",
  THERMIQUE: "Solaire thermique (ECS)",
  PV_THERM: "Photovoltaïque + thermique",
  INCONNU: "Je ne sais pas",
};

export const HAZARD_LABELS_FR: Record<HazardFlag, string> = {
  AMIANTE: "Amiante",
  PLOMB: "Plomb (peintures anciennes)",
  FACADE_PROTEGEE: "Façade protégée (ABF)",
  PLU_RESTRICTIF: "PLU restrictif (matériaux imposés)",
  BATIMENT_PATRIMONIAL: "Bâtiment patrimonial",
};

export const OCCUPATION_LABELS_FR: Record<OccupationProfile, string> = {
  PRIMARY: "Résidence principale",
  SECONDARY: "Résidence secondaire",
  RENTAL: "Mise en location",
  OFFICE_HOURS: "Tertiaire (heures bureau)",
};

export const ORIENTATION_LABELS_FR: Record<Orientation, string> = {
  N:  "Nord",
  NE: "Nord-Est",
  E:  "Est",
  SE: "Sud-Est",
  S:  "Sud",
  SO: "Sud-Ouest",
  O:  "Ouest",
  NO: "Nord-Ouest",
  INCONNU: "Je ne sais pas",
};

export const VEGETATION_LABELS_FR: Record<EnvironmentVegetation, string> = {
  AUCUN: "Aucune végétation autour",
  ARBRES_PROCHES: "Grands arbres à proximité (< 10 m)",
  ARBRES_MOYENS: "Végétation moyenne (haies, arbustes)",
  DENSE: "Jardin / forêt dense",
  INCONNU: "Je ne sais pas",
};

export const TERRAIN_SLOPE_LABELS_FR: Record<TerrainSlope, string> = {
  PLAT: "Terrain plat",
  PENTE_LEGERE: "Pente légère",
  PENTE_FORTE: "Pente forte",
  DEMI_NIVEAU: "Demi-niveau (semi-enterré)",
  INCONNU: "Je ne sais pas",
};

export const WIND_EXPOSURE_LABELS_FR: Record<WindExposure, string> = {
  ABRITE: "Abrité (entouré bâtiments/végétation)",
  MODEREE: "Exposition modérée",
  EXPOSEE: "Façade exposée au vent dominant",
  TRES_EXPOSEE: "Très exposé (crête, bord de mer)",
  INCONNU: "Je ne sais pas",
};

// ════════════════════════════════════════════════════════════════════════════
// VALEURS PAR DÉFAUT (UX — démarrage rapide)
// ════════════════════════════════════════════════════════════════════════════

export const DEFAULT_FORM_DATA: BuildingFormData = {
  projectName: "Mon projet de rénovation",
  buildingType: "MAISON_INDIV",
  constructionPeriod: "1975_1981",
  climateZone: "H1a",
  altitudeM: 150,
  surfaceHabitableM2: 110,
  hauteurSousPlafondM: 2.5,
  niveauCount: 2,
  wallSurfaceM2: 90,
  roofSurfaceM2: 60,
  floorSurfaceM2: 55,
  windowSurfaceM2: 12,
  windowGlazing: "DOUBLE_AIR",
  heatingKind: "CHAUDIERE_FIOUL",
  heatingInstallYear: 2005,
  dhwKind: "BALLON_ELEC",
  ventilationKind: "VMC_SF_AUTO",
  occupants: 4,
  setpointWinterC: 19,
  householdSize: 4,
  householdRfrEur: 38000,
  householdIdf: false,
  scenariosEnabled: { isolationOnly: true, heatingOnly: true, global: true },

  // v2.0 — préremplis raisonnables (modifiables par UI)
  occupation: "PRIMARY",
  mitoyennete: "AUCUNE",
  wallMaterial: "PARPAING",
  wallInsulationStatus: "INCONNUE",
  roofKind: "COMBLES_AMENAGES",
  roofInsulationStatus: "INCONNUE",
  floorKind: "VIDE_SANITAIRE",
  floorInsulationStatus: "INCONNUE",
  windowFrame: "PVC",
  windowShutters: "OUI",
  thermalBridges: "INCONNUS",
  solarProduction: "AUCUNE",
  solarShade: "VOLETS_BATTANTS",
  hasAirConditioning: false,
  travauxRealises: [],
  hazards: [],
  documentsAvailable: {},
};
