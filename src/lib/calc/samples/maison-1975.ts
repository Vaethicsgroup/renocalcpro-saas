// src/lib/calc/samples/maison-1975.ts — Jeu de données de référence (tests + démo)
// Maison individuelle 110 m², 1975, zone H1a, chauffée fioul, mal isolée.

import type { BuildingInputs, Household, Scenario } from "../types";

export const SAMPLE_BUILDING: BuildingInputs = {
  id: "sample-maison-1975",
  type: "MAISON_INDIV",
  occupation: "PRIMARY",
  construction_period: "1975_1981",
  construction_year: 1978,
  climate_zone: "H1a",
  altitude_m: 150,
  surface_habitable_m2: 110,
  hauteur_sous_plafond_m: 2.5,
  niveau_count: 2,
  walls: [
    // Murs extérieurs : 4 façades — 90 m² total
    { id: "w-n", kind: "WALL", subtype: "EXT", surface_m2: 22, orientation: "N" },
    { id: "w-s", kind: "WALL", subtype: "EXT", surface_m2: 22, orientation: "S" },
    { id: "w-e", kind: "WALL", subtype: "EXT", surface_m2: 23, orientation: "E" },
    { id: "w-o", kind: "WALL", subtype: "EXT", surface_m2: 23, orientation: "O" },
    // Toiture combles aménagés
    { id: "r-1", kind: "ROOF", subtype: "COMBLES_AMENAGES", surface_m2: 60 },
    // Plancher bas sur vide sanitaire
    { id: "f-1", kind: "FLOOR", subtype: "BAS_VIDE_SANIT", surface_m2: 55 },
  ],
  openings: [
    { id: "win-s", kind: "WINDOW", surface_m2: 4.5, glazing: "DOUBLE_AIR", frame: "BOIS", orientation: "S" },
    { id: "win-n", kind: "WINDOW", surface_m2: 3.0, glazing: "DOUBLE_AIR", frame: "BOIS", orientation: "N" },
    { id: "win-e", kind: "WINDOW", surface_m2: 2.5, glazing: "SIMPLE",     frame: "BOIS", orientation: "E" },
    { id: "win-o", kind: "WINDOW", surface_m2: 2.5, glazing: "SIMPLE",     frame: "BOIS", orientation: "O" },
    { id: "door",  kind: "DOOR_SOLID", surface_m2: 2.0 },
  ],
  heating: [
    { id: "h1", kind: "CHAUDIERE_FIOUL", carrier: "FIOUL", install_year: 2005, coverage_share: 1 },
  ],
  dhw: [
    { id: "d1", kind: "BALLON_ELEC", carrier: "ELEC", install_year: 2010 },
  ],
  ventilation: { kind: "VMC_SF_AUTO" },
  setpoint_winter_C: 19,
  occupants: 4,
  inertia: "MOYENNE",
  hazards: [],
  notes: "Maison familiale type 1975, isolation d'origine.",
};

export const SAMPLE_HOUSEHOLD: Household = {
  size: 4,
  rfr_eur: 38000,           // → MPR_JAUNE (modeste) hors IDF
  is_idf: false,
};

export const SAMPLE_SCENARIOS: Scenario[] = [
  {
    id: "sc-iso",
    name: "Isolation seule",
    description: "ITE murs + isolation combles aménagés + plancher bas",
    works: [
      { id: "w-ite", kind: "ISO_MURS_ITE" },
      { id: "w-cmbl", kind: "ISO_COMBLES_AMENAGES" },
      { id: "w-pbas", kind: "ISO_PLANCHER_BAS" },
    ],
  },
  {
    id: "sc-chauf",
    name: "Chauffage seul",
    description: "Remplacement chaudière fioul par PAC air/eau",
    works: [
      { id: "w-pac", kind: "PAC_AIR_EAU" },
      { id: "w-ceth", kind: "CHAUFFE_EAU_THERMODYN" },
    ],
  },
  {
    id: "sc-glob",
    name: "Rénovation globale BBC",
    description: "Iso enveloppe + menuiseries + PAC + VMC DF",
    works: [
      { id: "w-ite", kind: "ISO_MURS_ITE" },
      { id: "w-cmbl", kind: "ISO_COMBLES_AMENAGES" },
      { id: "w-pbas", kind: "ISO_PLANCHER_BAS" },
      { id: "w-mtv", kind: "MENUISERIES_TV" },
      { id: "w-pac", kind: "PAC_AIR_EAU" },
      { id: "w-vmcdf", kind: "VMC_DF" },
      { id: "w-ceth", kind: "CHAUFFE_EAU_THERMODYN" },
    ],
  },
];
