// lib/ai/assistant/knowledge/section-help.ts
// Aide globale par SECTION du parcours diagnostic (introduction + objectifs + checklist).
// Affiché en haut du panneau assistant quand l'utilisateur ouvre une section.

export interface SectionHelp {
  /** Référence section : "project" | "envelope" | "systems" | … */
  ref: string;
  /** Libellé court (FR) */
  label: string;
  /** Pourquoi cette section existe ? */
  purpose: string;
  /** Ce que l'utilisateur doit fournir (vue d'ensemble) */
  whatYouNeed: string[];
  /** Temps estimé pour remplir la section (minutes) */
  estimatedMinutes: number;
  /** Conseils pour bien démarrer */
  startTips: string[];
  /** Erreurs fréquentes au niveau global */
  pitfalls?: string[];
  /** Champs critiques (ref) à ne pas négliger */
  criticalFields: string[];
  /** Slugs articles centre d'aide à proposer */
  relatedHelp?: string[];
}

export const SECTION_HELP: Record<string, SectionHelp> = {
  project: {
    ref: "project",
    label: "Identification du projet",
    purpose: "Localiser le bâtiment et fixer son contexte climatique. C'est la base de tous les calculs : zone climatique, période réglementaire, type de bâti.",
    whatYouNeed: [
      "Adresse précise (autocomplétion BAN)",
      "Année de construction",
      "Type de bâtiment (maison, appartement, immeuble, tertiaire)",
      "Surface habitable au sens loi Carrez",
    ],
    estimatedMinutes: 5,
    startTips: [
      "Ayez sous la main l'acte de propriété ou l'avis d'imposition (taxe foncière) pour la surface.",
      "Si vous hésitez sur l'année de construction, observez les matériaux dominants (pierre = avant 1948, parpaing/isolation = après 1975).",
    ],
    pitfalls: [
      "Saisir une adresse approximative — le calcul climatique sera dégradé",
      "Confondre surface habitable et surface utile / surface plancher",
    ],
    criticalFields: ["project.address", "project.surfaceM2", "project.constructionYear", "project.buildingType"],
    relatedHelp: ["zone-climatique", "loi-carrez"],
  },

  envelope: {
    ref: "envelope",
    label: "Enveloppe (murs, toit, sol, ouvertures)",
    purpose: "Décrire la « boîte » qui sépare le chauffé du froid : chaque paroi a un matériau, une épaisseur, et éventuellement une isolation. C'est ici qu'on calcule les déperditions thermiques.",
    whatYouNeed: [
      "Pour chaque mur extérieur : matériau, épaisseur, isolation existante",
      "Pour la toiture : type, épaisseur isolant, accessibilité combles",
      "Pour le plancher bas : structure (terre-plein, vide sanitaire, sous-sol…)",
      "Pour les fenêtres : type vitrage, matériau dormant, surface totale vitrée",
    ],
    estimatedMinutes: 25,
    startTips: [
      "Faites le tour du bâtiment avec un télémètre laser et un appareil photo.",
      "Pour identifier les matériaux : la fonction « Identifier par photo » accepte vos clichés et propose un top-3 (pierre, brique, parpaing…).",
      "Pour le vitrage, utilisez le test de la flamme : 2 reflets = simple, 4 = double.",
    ],
    pitfalls: [
      "Marquer « pas d'isolation » sans avoir vérifié — démontez une prise pour voir la coupe du mur.",
      "Oublier qu'un bardage extérieur cache souvent un autre matériau.",
      "Ne mesurer qu'un seul mur alors qu'il y a 4 façades différentes.",
    ],
    criticalFields: [
      "envelope.walls.materialKey",
      "envelope.walls.thicknessCm",
      "envelope.walls.insulationKind",
      "envelope.roof.insulationCm",
      "envelope.windows.glazingKind",
    ],
    relatedHelp: ["materiaux-bati-initial", "isolation-cachee", "reconnaitre-vitrage"],
  },

  systems: {
    ref: "systems",
    label: "Systèmes (chauffage, ECS, ventilation)",
    purpose: "Lister les équipements actifs qui consomment de l'énergie : générateur de chaleur, production d'eau chaude, ventilation. C'est 60 à 80 % de la facture énergétique.",
    whatYouNeed: [
      "Système de chauffage principal + énergie + année d'installation + puissance",
      "Système ECS (ballon électrique, thermodynamique, solaire, mixte chaudière…)",
      "Type de ventilation (naturelle, VMC simple flux, VMC double flux)",
      "Climatisation si présente (split, multisplit, gainable…)",
    ],
    estimatedMinutes: 15,
    startTips: [
      "Photographiez la plaque signalétique de chaque équipement : marque, modèle, puissance, année.",
      "Pour les radiateurs électriques, distinguez convecteurs / panneaux rayonnants / inertie sèche / fluide caloporteur.",
      "Si vous ne trouvez pas la VMC, c'est probablement « ventilation naturelle » (uniquement grilles haut/bas dans la cuisine et SDB).",
    ],
    pitfalls: [
      "Confondre chauffage principal et chauffage d'appoint (poêle d'agrément).",
      "Oublier de signaler une PAC réversible utilisée aussi en clim.",
    ],
    criticalFields: [
      "systems.heating.kind",
      "systems.heating.installYear",
      "systems.dhw.kind",
      "systems.ventilation.kind",
    ],
    relatedHelp: ["reconnaitre-chauffage", "pac-types", "ventilation-types"],
  },

  scenarios: {
    ref: "scenarios",
    label: "Scénarios de travaux",
    purpose: "Construire 1 à 3 scénarios de rénovation chiffrés. Chaque scénario combine un bouquet de travaux (isolation, changement chauffage, ventilation…) avec son coût, son gain énergétique et son impact sur le confort.",
    whatYouNeed: [
      "Objectif principal (confort, gain DPE, BBC, zéro carbone)",
      "Budget envisageable (avec/sans aides)",
      "Contraintes (occupé pendant travaux, monument historique, copropriété)",
    ],
    estimatedMinutes: 10,
    startTips: [
      "Démarrez avec le scénario « Geste rentable » (toiture seule) avant de viser une rénovation globale.",
      "L'IA peut comparer 2 scénarios côté par côté (ROI, gain DPE, confort été/hiver).",
    ],
    criticalFields: ["scenarios.target", "scenarios.budgetMaxEuros"],
    relatedHelp: ["scenarios-construire", "renovation-globale-vs-gestes"],
  },

  aids: {
    ref: "aids",
    label: "Aides financières",
    purpose: "Calculer les aides mobilisables (MaPrimeRénov', CEE, Eco-PTZ, aides locales) selon les revenus, la composition du ménage et les travaux choisis.",
    whatYouNeed: [
      "Revenu fiscal de référence (RFR) du ménage",
      "Composition du ménage (nb personnes)",
      "Statut (propriétaire occupant, propriétaire bailleur, copropriété)",
      "Localisation précise (certaines aides régionales / EPCI)",
    ],
    estimatedMinutes: 10,
    startTips: [
      "Munissez-vous de votre dernier avis d'imposition.",
      "L'IA peut expliquer pourquoi telle aide n'est pas proposée (condition non remplie).",
    ],
    pitfalls: [
      "Confondre RFR et salaire net.",
      "Oublier les aides locales (région, département, EPCI, métropole).",
    ],
    criticalFields: ["aids.householdIncome", "aids.householdSize", "aids.ownerStatus"],
    relatedHelp: ["mpr-categories", "cee-comprendre", "eco-ptz"],
  },

  results: {
    ref: "results",
    label: "Résultats du diagnostic",
    purpose: "Voir l'étiquette DPE estimée, les scénarios chiffrés, le ROI, le gain de confort, les émissions GES évitées. C'est ici qu'on prend les décisions.",
    whatYouNeed: ["Toutes les sections précédentes complétées (au moins 80 % des champs critiques)"],
    estimatedMinutes: 5,
    startTips: [
      "Cliquez sur n'importe quel chiffre pour avoir l'explication détaillée par l'IA.",
      "Les scénarios peuvent être édités à la volée (changer un poste de travaux et voir l'impact).",
    ],
    criticalFields: [],
  },
};

export function getSectionHelp(ref: string): SectionHelp | null {
  return SECTION_HELP[ref] ?? null;
}
