// src/lib/calc/catalog/project-subtypes.ts
// ════════════════════════════════════════════════════════════════════════════
// SOUS-TYPES DE PROJET & ADAPTATION DES FORMULAIRES
//
// Pour chaque sous-type (Appartement, Immeuble entier, Bureau, Commerce, etc.),
// définit :
//   - quel `BuildingType` du moteur appliquer
//   - quelles sections du wizard afficher / masquer
//   - quels champs spécifiques activer (étage, nb logements, occupation, etc.)
//   - quels travaux sont pertinents
//   - quelles aides spécifiques sont éligibles
// ════════════════════════════════════════════════════════════════════════════

import type { BuildingType } from "../types";

export type ProjectMainKind = "INDIVIDUAL" | "COLLECTIVE" | "TERTIARY";

export type ProjectSubType =
  // Habitation individuelle
  | "MAISON_INDIVIDUELLE"
  | "PAVILLON"
  | "MAISON_DE_VILLE"
  // Logement collectif
  | "APPARTEMENT"
  | "IMMEUBLE_ENTIER"
  | "COPROPRIETE_PARTIES_COMMUNES"
  // Tertiaire
  | "BUREAU"
  | "COMMERCE"
  | "ERP"
  | "BATIMENT_PUBLIC"
  | "LOCAL_ACTIVITE";

export const SUBTYPE_LABELS_FR: Record<ProjectSubType, string> = {
  MAISON_INDIVIDUELLE: "Maison individuelle",
  PAVILLON: "Pavillon",
  MAISON_DE_VILLE: "Maison de ville",
  APPARTEMENT: "Appartement",
  IMMEUBLE_ENTIER: "Immeuble entier",
  COPROPRIETE_PARTIES_COMMUNES: "Copropriété (parties communes)",
  BUREAU: "Bureau",
  COMMERCE: "Commerce",
  ERP: "ERP (recevant du public)",
  BATIMENT_PUBLIC: "Bâtiment public",
  LOCAL_ACTIVITE: "Local d'activité",
};

export const SUBTYPE_DESCRIPTIONS_FR: Record<ProjectSubType, string> = {
  MAISON_INDIVIDUELLE: "Maison isolée sur sa parcelle, sans mitoyenneté.",
  PAVILLON: "Maison en lotissement, mitoyenneté partielle possible.",
  MAISON_DE_VILLE:
    "Mitoyenne sur 1 ou 2 côtés, souvent en centre urbain.",
  APPARTEMENT:
    "Logement unique dans un immeuble. Vous êtes propriétaire d'un lot.",
  IMMEUBLE_ENTIER:
    "Vous êtes propriétaire de tout l'immeuble (≥ 2 logements ou usage mixte).",
  COPROPRIETE_PARTIES_COMMUNES:
    "Vous êtes syndic. Travaux sur parties communes uniquement.",
  BUREAU:
    "Locaux administratifs, sociétés de services, professions libérales.",
  COMMERCE:
    "Magasin, boutique, restaurant, commerce de proximité.",
  ERP:
    "Établissement Recevant du Public (école, salle, etc.) — normes spécifiques.",
  BATIMENT_PUBLIC:
    "Mairie, école publique, bâtiment de collectivité territoriale.",
  LOCAL_ACTIVITE:
    "Atelier, entrepôt, local mixte tertiaire/artisanal.",
};

// ════════════════════════════════════════════════════════════════════════════
// MAPPING SOUS-TYPE → CONFIGURATION FORMULAIRE
// ════════════════════════════════════════════════════════════════════════════

/** Sections du wizard qui peuvent être affichées ou masquées. */
export type FormSection =
  | "context"          // SHAB, période construction, occupation
  | "environment"      // Orientation, terrain, vent, mitoyenneté
  | "envelope_walls"   // Murs (matériau, isolation)
  | "envelope_roof"    // Toiture
  | "envelope_floor"   // Plancher bas
  | "envelope_windows" // Menuiseries
  | "envelope_thermal_bridges" // Ponts thermiques
  | "systems_heating"  // Chauffage
  | "systems_dhw"      // ECS
  | "systems_ventilation" // VMC
  | "systems_solar"    // Solaire / photovoltaïque
  | "systems_cooling"  // Climatisation (tertiaire)
  | "systems_lighting" // Éclairage (tertiaire)
  | "systems_specific" // Équipements spécifiques (IT bureau, réfrigération commerce)
  | "occupation_schedule" // Plages d'occupation (tertiaire)
  | "hazards"          // Amiante, plomb, protection patrimoine
  | "past_works"       // Travaux déjà réalisés
  | "scenarios"        // Sélection scénarios à comparer
  | "household";       // Profil foyer (revenu, taille, autonomie)

export interface ProjectSubTypeConfig {
  key: ProjectSubType;
  mainKind: ProjectMainKind;
  /** BuildingType du moteur. */
  buildingType: BuildingType;
  /** Sections à afficher dans le wizard. */
  sectionsToShow: ReadonlyArray<FormSection>;
  /**
   * Champs spécifiques additionnels à afficher (étage, nb lots, etc.).
   * Pas de mapping moteur — pure logique UI.
   */
  specificFields: ReadonlyArray<SpecificFieldKind>;
  /** Travaux postes pertinents pour ce sous-type. */
  relevantPostes: ReadonlyArray<PosteKind>;
  /** Champs obligatoires spécifiques. */
  requiredFields: ReadonlyArray<string>;
  /** Adaptations défaut form. */
  formDefaultOverrides?: Partial<{
    occupants: number;
    setpointWinterC: number;
    windowSurfaceM2_perShabRatio: number; // ex : 0.20 pour commerce vitrine
  }>;
  /** Notes pédagogiques affichées en tête du formulaire pour ce sous-type. */
  notesFr: ReadonlyArray<string>;
  /** Niveau de complexité (1 = simple, 5 = très complexe). */
  complexity: 1 | 2 | 3 | 4 | 5;
}

export type SpecificFieldKind =
  | "floor_level"            // Étage de l'appartement
  | "top_floor"              // Dernier étage (sous toiture)
  | "ground_floor"           // RDC (plancher en contact extérieur)
  | "lots_count"             // Nombre de lots (immeuble entier / copro)
  | "buildings_count"        // Nombre de bâtiments (copro multi-bâtiments)
  | "common_heating"         // Chauffage collectif ?
  | "common_dhw"             // ECS collective ?
  | "common_ventilation"     // VMC collective ?
  | "tertiary_activity"      // Bureau / commerce / restauration
  | "operating_hours_perweek" // Heures d'occupation hebdomadaire
  | "occupancy_density"      // Personnes / m² (densité)
  | "shop_window_surface"    // Surface vitrine commerce
  | "it_consumption"         // Consommation IT (serveurs, postes)
  | "cold_chain"             // Présence chaîne du froid (commerce)
  | "deet_threshold"         // ≥ 1000 m² tertiaire → DEET applicable
  | "ag_pv_3y"               // PV AG copro 3 dernières années
  | "ppt_status"             // État du Plan Pluriannuel de Travaux (copro)
  | "lot_distribution";      // Répartition lots habitation/commerce

export type PosteKind =
  | "ISO_MURS"
  | "ISO_TOITURE"
  | "ISO_PLANCHER_BAS"
  | "MENUISERIES"
  | "PONTS_THERMIQUES"
  | "CHAUFFAGE"
  | "ECS"
  | "VENTILATION"
  | "CLIM"
  | "ECLAIRAGE"
  | "PHOTOVOLTAIQUE"
  | "GTB"           // Gestion technique du bâtiment (tertiaire)
  | "ACCESSIBILITE";

export const PROJECT_SUBTYPE_CONFIGS: Record<
  ProjectSubType,
  ProjectSubTypeConfig
> = {
  // ────────────────────────────────────────────────────────────────────────
  // HABITATION INDIVIDUELLE
  // ────────────────────────────────────────────────────────────────────────
  MAISON_INDIVIDUELLE: {
    key: "MAISON_INDIVIDUELLE",
    mainKind: "INDIVIDUAL",
    buildingType: "MAISON_INDIV",
    sectionsToShow: [
      "context",
      "environment",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_dhw",
      "systems_ventilation",
      "systems_solar",
      "hazards",
      "past_works",
      "scenarios",
      "household",
    ],
    specificFields: [],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "MENUISERIES",
      "PONTS_THERMIQUES",
      "CHAUFFAGE",
      "ECS",
      "VENTILATION",
      "PHOTOVOLTAIQUE",
    ],
    requiredFields: ["surfaceHabitableM2", "buildingType", "climateZone"],
    formDefaultOverrides: { occupants: 4 },
    notesFr: [
      "Profil complet : tous postes de rénovation accessibles.",
      "Aides MaPrimeRénov' + CEE + Éco-PTZ + TVA 5,5 % cumulables.",
    ],
    complexity: 2,
  },
  PAVILLON: {
    key: "PAVILLON",
    mainKind: "INDIVIDUAL",
    buildingType: "MAISON_INDIV",
    sectionsToShow: [
      "context",
      "environment",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_dhw",
      "systems_ventilation",
      "systems_solar",
      "hazards",
      "past_works",
      "scenarios",
      "household",
    ],
    specificFields: [],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "MENUISERIES",
      "PONTS_THERMIQUES",
      "CHAUFFAGE",
      "ECS",
      "VENTILATION",
      "PHOTOVOLTAIQUE",
    ],
    requiredFields: ["surfaceHabitableM2"],
    formDefaultOverrides: { occupants: 4 },
    notesFr: [
      "Mitoyenneté potentielle : pensez à indiquer les murs partagés.",
    ],
    complexity: 2,
  },
  MAISON_DE_VILLE: {
    key: "MAISON_DE_VILLE",
    mainKind: "INDIVIDUAL",
    buildingType: "MAISON_INDIV",
    sectionsToShow: [
      "context",
      "environment",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_dhw",
      "systems_ventilation",
      "hazards",
      "past_works",
      "scenarios",
      "household",
    ],
    specificFields: [],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "MENUISERIES",
      "PONTS_THERMIQUES",
      "CHAUFFAGE",
      "ECS",
      "VENTILATION",
    ],
    requiredFields: ["surfaceHabitableM2"],
    formDefaultOverrides: { occupants: 3 },
    notesFr: [
      "Façade souvent en zone protégée : vérifier la possibilité d'ITE.",
      "Murs mitoyens 1 ou 2 côtés — déperditions réduites.",
    ],
    complexity: 3,
  },

  // ────────────────────────────────────────────────────────────────────────
  // LOGEMENT COLLECTIF
  // ────────────────────────────────────────────────────────────────────────
  APPARTEMENT: {
    key: "APPARTEMENT",
    mainKind: "COLLECTIVE",
    buildingType: "APPARTEMENT",
    sectionsToShow: [
      "context",
      "envelope_walls",
      // envelope_roof : seulement si dernier étage (conditionnel via specific_field "top_floor")
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_dhw",
      "systems_ventilation",
      "hazards",
      "past_works",
      "scenarios",
      "household",
    ],
    specificFields: [
      "floor_level",
      "top_floor",
      "ground_floor",
      "common_heating",
      "common_dhw",
      "common_ventilation",
    ],
    relevantPostes: [
      "ISO_MURS",
      "MENUISERIES",
      "PONTS_THERMIQUES",
      "CHAUFFAGE",
      "ECS",
      "VENTILATION",
    ],
    requiredFields: ["surfaceHabitableM2", "floor_level"],
    formDefaultOverrides: { occupants: 2 },
    notesFr: [
      "Toiture pertinente uniquement si vous êtes au dernier étage.",
      "Plancher bas pertinent uniquement si RDC ou sur local non chauffé.",
      "Si chauffage collectif : travaux à coordonner avec le syndic.",
      "Aides individuelles MaPrimeRénov' accessibles sur parties privatives.",
    ],
    complexity: 3,
  },
  IMMEUBLE_ENTIER: {
    key: "IMMEUBLE_ENTIER",
    mainKind: "COLLECTIVE",
    buildingType: "COPRO_PARTIES_COMMUNES",
    sectionsToShow: [
      "context",
      "environment",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_dhw",
      "systems_ventilation",
      "systems_solar",
      "hazards",
      "past_works",
      "scenarios",
    ],
    specificFields: [
      "lots_count",
      "lot_distribution",
      "common_heating",
      "common_dhw",
      "common_ventilation",
    ],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "MENUISERIES",
      "PONTS_THERMIQUES",
      "CHAUFFAGE",
      "ECS",
      "VENTILATION",
      "PHOTOVOLTAIQUE",
    ],
    requiredFields: ["surfaceHabitableM2", "lots_count"],
    notesFr: [
      "Propriétaire de l'ensemble : décisions unilatérales possibles.",
      "Si lots mis en location : régime fiscal foncier à prévoir.",
      "Audit obligatoire si vente en bloc ou demande d'aide BBC.",
    ],
    complexity: 4,
  },
  COPROPRIETE_PARTIES_COMMUNES: {
    key: "COPROPRIETE_PARTIES_COMMUNES",
    mainKind: "COLLECTIVE",
    buildingType: "COPRO_PARTIES_COMMUNES",
    sectionsToShow: [
      "context",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      // PAS menuiseries (privatives), PAS ECS individuel
      "envelope_thermal_bridges",
      "systems_heating", // si chauffage collectif
      "systems_ventilation", // si ventilation collective
      "systems_solar",
      "hazards",
      "past_works",
      "scenarios",
    ],
    specificFields: [
      "lots_count",
      "buildings_count",
      "ag_pv_3y",
      "ppt_status",
      "common_heating",
      "common_ventilation",
    ],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "PONTS_THERMIQUES",
      "CHAUFFAGE",
      "VENTILATION",
      "PHOTOVOLTAIQUE",
      "ACCESSIBILITE",
    ],
    requiredFields: ["surfaceHabitableM2", "lots_count"],
    notesFr: [
      "Travaux sur parties communes uniquement.",
      "MPR Copropriété : 45 % des dépenses éligibles plafonné à 25 000 €.",
      "PPT obligatoire pour copropriétés > 15 ans (loi Climat 2021).",
      "DPE collectif si > 50 lots.",
      "Vote en AG copropriété requis avant lancement.",
    ],
    complexity: 5,
  },

  // ────────────────────────────────────────────────────────────────────────
  // TERTIAIRE
  // ────────────────────────────────────────────────────────────────────────
  BUREAU: {
    key: "BUREAU",
    mainKind: "TERTIARY",
    buildingType: "TERTIAIRE_BUREAU",
    sectionsToShow: [
      "context",
      "environment",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_ventilation",
      "systems_cooling",
      "systems_lighting",
      "systems_specific",
      "occupation_schedule",
      "hazards",
      "past_works",
      "scenarios",
    ],
    specificFields: [
      "tertiary_activity",
      "operating_hours_perweek",
      "occupancy_density",
      "it_consumption",
      "deet_threshold",
    ],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "MENUISERIES",
      "PONTS_THERMIQUES",
      "CHAUFFAGE",
      "VENTILATION",
      "CLIM",
      "ECLAIRAGE",
      "GTB",
      "PHOTOVOLTAIQUE",
    ],
    requiredFields: ["surfaceHabitableM2", "operating_hours_perweek"],
    formDefaultOverrides: {
      occupants: 20,
      setpointWinterC: 19,
      windowSurfaceM2_perShabRatio: 0.12,
    },
    notesFr: [
      "Décret tertiaire : applicable dès 1 000 m² de surface tertiaire cumulée.",
      "Objectifs : −40 % en 2030, −50 % en 2040, −60 % en 2050 (vs 2010).",
      "Déclaration annuelle obligatoire sur la plateforme OPERAT.",
      "Postes prioritaires : éclairage LED + GTB + climatisation efficace.",
    ],
    complexity: 4,
  },
  COMMERCE: {
    key: "COMMERCE",
    mainKind: "TERTIARY",
    buildingType: "TERTIAIRE_COMMERCE",
    sectionsToShow: [
      "context",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_ventilation",
      "systems_cooling",
      "systems_lighting",
      "systems_specific",
      "occupation_schedule",
      "hazards",
      "past_works",
      "scenarios",
    ],
    specificFields: [
      "tertiary_activity",
      "operating_hours_perweek",
      "shop_window_surface",
      "cold_chain",
      "deet_threshold",
    ],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "MENUISERIES",
      "CHAUFFAGE",
      "VENTILATION",
      "CLIM",
      "ECLAIRAGE",
      "GTB",
    ],
    requiredFields: ["surfaceHabitableM2", "operating_hours_perweek"],
    formDefaultOverrides: {
      occupants: 8,
      setpointWinterC: 19,
      windowSurfaceM2_perShabRatio: 0.25, // Vitrines
    },
    notesFr: [
      "Vitrines : surface vitrée souvent élevée — fort impact déperditions.",
      "Réfrigération / chaîne du froid : poste énergie majeur si applicable.",
      "Coup de pouce CEE éclairage LED particulièrement avantageux.",
      "Décret tertiaire : applicable dès 1 000 m².",
    ],
    complexity: 4,
  },
  ERP: {
    key: "ERP",
    mainKind: "TERTIARY",
    buildingType: "TERTIAIRE_BUREAU",
    sectionsToShow: [
      "context",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_ventilation",
      "systems_cooling",
      "systems_lighting",
      "systems_specific",
      "occupation_schedule",
      "hazards",
      "past_works",
      "scenarios",
    ],
    specificFields: [
      "tertiary_activity",
      "operating_hours_perweek",
      "occupancy_density",
      "deet_threshold",
    ],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "MENUISERIES",
      "CHAUFFAGE",
      "VENTILATION",
      "CLIM",
      "ECLAIRAGE",
      "GTB",
      "ACCESSIBILITE",
    ],
    requiredFields: ["surfaceHabitableM2", "operating_hours_perweek"],
    formDefaultOverrides: {
      occupants: 50,
      setpointWinterC: 19,
    },
    notesFr: [
      "Normes ERP : accessibilité PMR + sécurité incendie obligatoires.",
      "Toute modification doit respecter le Code de la Construction et de l'Habitation.",
      "Audit sécurité commission communale avant grands travaux.",
      "Subventions spécifiques selon type d'ERP (scolaire, culturel, sportif).",
    ],
    complexity: 5,
  },
  BATIMENT_PUBLIC: {
    key: "BATIMENT_PUBLIC",
    mainKind: "TERTIARY",
    buildingType: "TERTIAIRE_BUREAU",
    sectionsToShow: [
      "context",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_ventilation",
      "systems_cooling",
      "systems_lighting",
      "systems_specific",
      "systems_solar",
      "occupation_schedule",
      "hazards",
      "past_works",
      "scenarios",
    ],
    specificFields: [
      "tertiary_activity",
      "operating_hours_perweek",
      "occupancy_density",
      "deet_threshold",
    ],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "ISO_PLANCHER_BAS",
      "MENUISERIES",
      "CHAUFFAGE",
      "VENTILATION",
      "CLIM",
      "ECLAIRAGE",
      "GTB",
      "PHOTOVOLTAIQUE",
      "ACCESSIBILITE",
    ],
    requiredFields: ["surfaceHabitableM2", "operating_hours_perweek"],
    formDefaultOverrides: {
      occupants: 40,
      setpointWinterC: 19,
    },
    notesFr: [
      "Bâtiments publics : exemplarité énergétique attendue.",
      "Décret tertiaire prioritaire — plan pluriannuel d'investissement à présenter.",
      "DPE collectif obligatoire.",
      "Aides : Fonds Vert, DSIL, DETR, CEE classique, Banque des Territoires.",
    ],
    complexity: 5,
  },
  LOCAL_ACTIVITE: {
    key: "LOCAL_ACTIVITE",
    mainKind: "TERTIARY",
    buildingType: "TERTIAIRE_COMMERCE",
    sectionsToShow: [
      "context",
      "envelope_walls",
      "envelope_roof",
      "envelope_floor",
      "envelope_windows",
      "envelope_thermal_bridges",
      "systems_heating",
      "systems_ventilation",
      "systems_lighting",
      "systems_specific",
      "occupation_schedule",
      "hazards",
      "past_works",
      "scenarios",
    ],
    specificFields: [
      "tertiary_activity",
      "operating_hours_perweek",
      "deet_threshold",
    ],
    relevantPostes: [
      "ISO_MURS",
      "ISO_TOITURE",
      "MENUISERIES",
      "CHAUFFAGE",
      "VENTILATION",
      "ECLAIRAGE",
      "PHOTOVOLTAIQUE",
    ],
    requiredFields: ["surfaceHabitableM2"],
    formDefaultOverrides: {
      occupants: 5,
      setpointWinterC: 18,
    },
    notesFr: [
      "Locaux mixtes : usage tertiaire + activité artisanale.",
      "Performance variable selon usage exact (atelier vs entrepôt vs mixte).",
      "Décret tertiaire applicable si surface tertiaire ≥ 1 000 m².",
    ],
    complexity: 3,
  },
};

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

export function subTypesForMainKind(
  kind: ProjectMainKind,
): ReadonlyArray<ProjectSubType> {
  return Object.values(PROJECT_SUBTYPE_CONFIGS)
    .filter((c) => c.mainKind === kind)
    .map((c) => c.key);
}

export function sectionShownForSubType(
  subType: ProjectSubType,
  section: FormSection,
): boolean {
  return PROJECT_SUBTYPE_CONFIGS[subType].sectionsToShow.includes(section);
}

export function specificFieldShown(
  subType: ProjectSubType,
  field: SpecificFieldKind,
): boolean {
  return PROJECT_SUBTYPE_CONFIGS[subType].specificFields.includes(field);
}
