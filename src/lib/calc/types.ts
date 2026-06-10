// src/lib/calc/types.ts — Modèle métier RENOCALCPRO v1.0
// Types typés, discriminés. Aucune logique : c'est le DOMAINE.
// ⚠️ Périmètre honnête : ce modèle est conçu pour des calculs simplifiés (pré-audit /
// dimensionnement client), pas pour produire un DPE 3CL réglementaire.
// La structure est compatible avec une future implémentation 3CL conforme.

// ───────────────────────── ENERGIES & CLIMAT ─────────────────────────

export type EnergyCarrier =
  | "ELEC"        // Électricité (réseau)
  | "GAZ_NAT"     // Gaz naturel
  | "FIOUL"       // Fioul domestique
  | "BOIS_BUCHE"  // Bois bûche
  | "BOIS_GRANUL" // Bois granulés / pellets
  | "PROPANE"     // GPL / propane
  | "RES_CH"      // Réseau de chaleur urbain
  | "SOLAIRE";    // Solaire thermique (appoint)

/** Zones climatiques France (simplifiées DPE). */
export type ClimateZone = "H1a" | "H1b" | "H1c" | "H2a" | "H2b" | "H2c" | "H2d" | "H3";

/** Année de construction — bande règlementaire RT. */
export type ConstructionPeriod =
  | "AVANT_1948"
  | "1948_1974"
  | "1975_1981"     // 1ère RT
  | "1982_1988"
  | "1989_2000"
  | "2001_2005"
  | "2006_2012"     // RT2005
  | "2013_2020"     // RT2012
  | "2021_PLUS";    // RE2020

export type BuildingType =
  | "MAISON_INDIV"
  | "APPARTEMENT"
  | "COPRO_PARTIES_COMMUNES"
  | "TERTIAIRE_BUREAU"
  | "TERTIAIRE_COMMERCE";

export type OccupationProfile =
  | "PRIMARY"        // Résidence principale
  | "SECONDARY"      // Résidence secondaire
  | "RENTAL"         // Location
  | "OFFICE_HOURS";  // Tertiaire heures bureau

// ───────────────────────── ENVELOPPE (PAROIS) ─────────────────────────

export type WallType   = "EXT" | "MITOYEN" | "ENTERRE";
export type RoofType   = "TOITURE" | "COMBLES_PERDUS" | "COMBLES_AMENAGES" | "TERRASSE";
export type FloorType  = "BAS_TERRE_PLEIN" | "BAS_VIDE_SANIT" | "BAS_SOUS_SOL" | "INTER";
export type GlazingType = "SIMPLE" | "DOUBLE_AIR" | "DOUBLE_ARGON" | "TRIPLE" | "SURVITRAGE";
export type WindowFrame = "BOIS" | "PVC" | "ALU_RP" | "ALU_SANS_RP" | "METAL";

/** Une paroi opaque (mur, toit, plancher). */
export interface OpaqueWall {
  id: string;
  kind: "WALL" | "ROOF" | "FLOOR";
  surface_m2: number;                     // surface déperditive
  /** Coefficient U (W/m².K). Si absent → estimé via materialLayer ou table conventionnelle. */
  u_value_W_m2K?: number;
  /** Type spécifique selon kind. */
  subtype: WallType | RoofType | FloorType;
  orientation?: "N" | "NE" | "E" | "SE" | "S" | "SO" | "O" | "NO" | null;
  /** Composition (couches matériaux). Optionnel — sinon table conventionnelle. */
  layers?: MaterialLayer[];
  /** Présence amiante / plomb / contraintes. */
  hazards?: HazardFlag[];
}

export interface MaterialLayer {
  material_key: string;       // ex. "LAINE_VERRE", "BETON", "PIERRE_CALC"
  thickness_m: number;
  lambda_W_mK?: number;       // Si absent → lookup library
}

export type HazardFlag = "AMIANTE" | "PLOMB" | "FACADE_PROTEGEE" | "PLU_RESTRICTIF" | "BATIMENT_PATRIMONIAL";

/** Une ouverture (fenêtre, porte vitrée, porte pleine). */
export interface Opening {
  id: string;
  kind: "WINDOW" | "DOOR_GLASS" | "DOOR_SOLID";
  surface_m2: number;
  u_value_W_m2K?: number;            // Si absent → lookup table glazing+frame
  glazing?: GlazingType;
  frame?: WindowFrame;
  orientation?: "N" | "NE" | "E" | "SE" | "S" | "SO" | "O" | "NO";
}

// ───────────────────────── SYSTÈMES TECHNIQUES ─────────────────────────

export type HeatingSystemKind =
  | "CHAUDIERE_GAZ_STD"
  | "CHAUDIERE_GAZ_COND"
  | "CHAUDIERE_FIOUL"
  | "CHAUDIERE_BOIS_BUCHE"
  | "CHAUDIERE_BOIS_GRANUL"
  | "PAC_AIR_AIR"
  | "PAC_AIR_EAU"
  | "PAC_GEO"
  | "RADIATEUR_ELEC"
  | "CONVECTEUR_ELEC_NG"  // Nouvelle génération (panneau rayonnant)
  | "POELE_BOIS_BUCHE"
  | "POELE_GRANUL"
  | "RES_CHALEUR_URBAIN"
  | "INSERT_CHEMINEE";

export type DhwSystemKind =
  | "BALLON_ELEC"
  | "BALLON_THERMODYN"
  | "CHAUDIERE_INTEGREE"
  | "SOLAIRE_THERM_APPOINT"
  | "GAZ_INSTANT";

export type VentilationKind =
  | "NATURELLE"
  | "VMC_SF_AUTO"
  | "VMC_SF_HYGRO_A"
  | "VMC_SF_HYGRO_B"
  | "VMC_DF"          // Double flux
  | "VMI"
  | "ABSENTE";

export interface HeatingSystem {
  id: string;
  kind: HeatingSystemKind;
  carrier: EnergyCarrier;
  /** Année d'installation — sert au calcul de rendement et au remplacement scénario. */
  install_year?: number;
  /** Rendement saisonnier (η_g). Si absent → table conventionnelle par kind+année. */
  efficiency?: number;
  /** Couverture base/appoint (0–1). 1 si système principal seul. */
  coverage_share?: number;
}

export interface DhwSystem {
  id: string;
  kind: DhwSystemKind;
  carrier: EnergyCarrier;
  install_year?: number;
  efficiency?: number;
}

export interface VentilationSystem {
  id: string;
  kind: VentilationKind;
  heat_recovery_eff?: number; // pour VMC DF
}

// ───────────────────────── BÂTI COMPLET ─────────────────────────

export interface BuildingInputs {
  /** Identification. */
  id: string;
  type: BuildingType;
  occupation: OccupationProfile;
  construction_period: ConstructionPeriod;
  construction_year?: number;
  /** Localisation. */
  climate_zone: ClimateZone;
  altitude_m: number;
  /** Surfaces réglementaires. */
  surface_habitable_m2: number;        // SHAB
  surface_thermique_m2?: number;       // SRT — si absent ≈ SHAB
  hauteur_sous_plafond_m: number;
  /** Niveaux. */
  niveau_count: number;
  /** Enveloppe. */
  walls: OpaqueWall[];
  openings: Opening[];
  /** Systèmes. */
  heating: HeatingSystem[];
  dhw: DhwSystem[];
  ventilation: VentilationSystem;
  /** Hypothèses d'usage. */
  setpoint_winter_C?: number;          // Default 19
  setpoint_summer_C?: number;          // Default 26
  /** Nombre d'occupants estimé (pour ECS). */
  occupants?: number;
  /** Inertie thermique perçue. */
  inertia?: "LEGERE" | "MOYENNE" | "FORTE";
  /** Contraintes/risques. */
  hazards?: HazardFlag[];
  /** Notes utilisateur. */
  notes?: string;
}

// ───────────────────────── TRAVAUX & SCÉNARIOS ─────────────────────────

export type WorkKind =
  | "ISO_MURS_ITE"
  | "ISO_MURS_ITI"
  | "ISO_COMBLES_PERDUS"
  | "ISO_COMBLES_AMENAGES"
  | "ISO_TOITURE"
  | "ISO_PLANCHER_BAS"
  | "MENUISERIES_DV"
  | "MENUISERIES_TV"
  | "VMC_HYGRO_B"
  | "VMC_DF"
  | "REMPLACEMENT_CHAUDIERE_COND"
  | "PAC_AIR_EAU"
  | "PAC_AIR_AIR"
  | "POELE_GRANUL"
  | "CHAUFFE_EAU_THERMODYN"
  | "SOLAIRE_THERMIQUE_ECS"
  | "PHOTOVOLTAIQUE";

export interface WorkItem {
  id: string;
  kind: WorkKind;
  /** Surface concernée (m²) pour les travaux d'enveloppe. */
  surface_m2?: number;
  /** U cible (W/m².K) ou COP cible — si non précisé → valeur par défaut métier. */
  performance_target?: number;
  /** Coût unitaire estimé (€ HT/m² ou forfait). Si absent → table. */
  unit_cost_eur?: number;
  /** Coût total saisi par l'utilisateur (€ TTC). Override les défauts. */
  total_cost_eur_override?: number;
  /** Quantité (ex. nb fenêtres). */
  quantity?: number;
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  works: WorkItem[];
}

// ───────────────────────── MÉNAGE & AIDES ─────────────────────────

/** Catégorie de revenus MaPrimeRénov' (selon barème ANAH). */
export type IncomeBand = "MPR_BLEU" | "MPR_JAUNE" | "MPR_VIOLET" | "MPR_ROSE";

export interface Household {
  /** Nombre de personnes au foyer. */
  size: number;
  /** Revenu fiscal de référence annuel (€). */
  rfr_eur?: number;
  /** Bande MPR — calculée à partir de rfr + size + zone si absente. */
  income_band?: IncomeBand;
  /** Île-de-France (barèmes spécifiques). */
  is_idf: boolean;
}

// ───────────────────────── RÉSULTATS ─────────────────────────

export interface ThermalState {
  /** Coefficient de déperdition global UA (W/K). */
  UA_W_K: number;
  /** Besoin de chauffage annuel (kWh/an, énergie utile). */
  heating_needs_kWh_year: number;
  /** Besoin ECS annuel (kWh/an, énergie utile). */
  dhw_needs_kWh_year: number;
  /** Consommation énergie finale (kWh EF/an), par énergie. */
  consumption_final_kWh: Record<EnergyCarrier, number>;
  /** Consommation énergie primaire (kWh EP/an). */
  consumption_primary_kWh_year: number;
  /** Consommation primaire spécifique (kWh EP/m²·an) — base étiquette DPE. */
  cep_kWh_m2_year: number;
  /** Émissions GES (kgCO2eq/an). */
  emissions_kgCO2_year: number;
  /** Émissions GES spécifiques (kgCO2eq/m²·an). */
  ges_kgCO2_m2_year: number;
  /** Étiquette énergie DPE estimée (A–G). ⚠️ Indicative — pas une certification 3CL. */
  dpe_label: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  /** Étiquette climat (GES). */
  ges_label: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  /** Coût énergétique annuel (€). */
  annual_cost_eur: number;
}

export interface ScenarioResult {
  scenario_id: string;
  scenario_name: string;
  /** État thermique après travaux. */
  after: ThermalState;
  /** Économies par rapport à baseline. */
  savings: {
    energy_kWh_year: number;
    energy_eur_year: number;
    emissions_kgCO2_year: number;
    dpe_steps_gained: number; // ex. F→C = 3
  };
  /** Coût total travaux (€ TTC). */
  works_cost_eur: number;
  /** Aides estimées (€). */
  aids: AidsBreakdown;
  /** Reste à charge ménage (€). */
  out_of_pocket_eur: number;
  /** Temps de retour brut (années) — RAC / éco annuelle. */
  payback_years: number | null;
  /** Détail par poste de travaux. */
  works_detail: Array<{
    work_id: string;
    kind: WorkKind;
    cost_eur: number;
    aids_eur: number;
  }>;
}

export interface AidsBreakdown {
  /** MaPrimeRénov' (forfaits par geste + bonus). */
  mpr_eur: number;
  /** Certificats d'Économie d'Énergie (CEE). */
  cee_eur: number;
  /** Éco-PTZ (montant éligible, pas une subvention — affichage info). */
  eco_ptz_eligible_eur: number;
  /** Total subventions effectives (MPR + CEE). */
  total_subsidy_eur: number;
  /** Note : aides locales (collectivités) non incluses ici. */
  notes: string[];
}

export interface ProjectResult {
  /** Méta. */
  project_id: string;
  computed_at: string;     // ISO date
  engine_version: string;
  parameters_version: string;
  disclaimer: string;

  /** Inputs consolidés. */
  building: BuildingInputs;
  household?: Household;

  /** État initial. */
  baseline: ThermalState;

  /** Résultats scénarios. */
  scenarios: ScenarioResult[];

  /** Scénario recommandé (best-cost-per-kWh ou max DPE gain). */
  recommended_scenario_id: string | null;

  /** Points de vigilance détectés (compatibilité matériaux, hygro, hazards). */
  warnings: Array<{ severity: "INFO" | "WARN" | "ERROR"; code: string; message: string }>;
}
