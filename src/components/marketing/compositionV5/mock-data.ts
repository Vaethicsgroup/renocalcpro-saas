// Données mock de la composition marketing V5.
// À remplacer par :
//   - données Prisma (`src/lib/db/queries/dashboard.ts`) pour KPIs + projets réels
//   - traductions next-intl (`messages/{fr,en}.json`) pour tous les libellés
//   - photos finales dans `/public/marketing/*` (voir ASSETS.md)
// Ce fichier reste utile pour la landing publique / supports commerciaux où
// aucune donnée utilisateur n'est disponible.

import type {
  BrandContent, BuildingTypeOption, DashboardMockupData, MarketingCompositionProps,
  MobileDashboardData, ScenarioData, ReportData, StepperStep, ParamNavItem,
} from "./types";

export const DEFAULT_BRAND: BrandContent = {
  headlineHtml: `Concevoir, <em>simuler</em>,<br/>comparer <span class="text-forest-700 italic">et piloter</span><br/>vos rénovations.`,
  lede:
    "Un environnement professionnel complet pour auditer un bâtiment, " +
    "bâtir des scénarios chiffrés et produire des rapports prêts pour vos clients " +
    "et pour l'ADEME.",
  features: [
    { icon: "energy",     title: "Performance énergétique", sub: "Moteur DPE conforme ADEME · 42 000 scénarios" },
    { icon: "scenarios",  title: "Scénarios de travaux",    sub: "Chiffrage, retour sur investissement, CO₂ évité" },
    { icon: "analytics",  title: "Analyse et comparatif",   sub: "3 bouquets comparés · aides pré-calculées" },
    { icon: "report",     title: "Rapports professionnels", sub: "PDF de synthèse · export en un clic" },
  ],
  trustBadges: ["RGE compatible", "ADEME · DPE", "RGPD"],
  versionStamp: "v3.0 · PREVIEW",
  domain: "renocalcpro.vercel.app",
};

export const DEFAULT_DASHBOARD: DashboardMockupData = {
  userName: "Alex Grady",
  userRole: "Fondateur · Vaethicsgroup",
  userInitials: "AG",
  pageTitle: "Vue d'ensemble",
  pageSub: "Pilotage de vos projets de rénovation énergétique · Semaine 47",
  kpis: [
    { id: "projects", icon: "home", label: "Projets en cours", value: "12",
      trend: { value: "+3", direction: "up" }, footer: "dont 4 en phase audit" },
    { id: "conso", icon: "leaf", label: "Consommation moyenne", value: "−62 %",
      trend: { value: "+4 pts", direction: "up" }, footer: "après rénovation recommandée", variant: "success" },
    { id: "co2", icon: "co2", label: "Émissions CO₂ évitées", value: "−58 %",
      footer: "2,4 t éq. CO₂ / projet moyen", variant: "success" },
    { id: "cost", icon: "euro", label: "Travaux estimés", value: "184 000 €",
      footer: "ensemble des projets actifs", variant: "gold" },
  ],
  projects: [
    { id: "p1", reference: "RNC-2026-142", name: "Villa des Monts d'Or",
      location: "Lyon 69", meta: "142 m² · Rénovation globale",
      status: "en-cours", statusLabel: "En cours",
      bottomStatLabel: "DPE", bottomStatValue: "E → B",
      imageSrc: "/images/renocalcpro/maison-individuelle.webp",
      imageAlt: "Maison individuelle contemporaine avec façade blanche, pierre et grandes baies vitrées, entourée d'un jardin paysager",
      imageHint: "maison individuelle contemporaine Lyon",
      imageTheme: "maison" },
    { id: "p2", reference: "RNC-2026-098", name: "Résidence du Parc",
      location: "Paris 19e", meta: "12 lots · 740 m² total",
      status: "etude", statusLabel: "Étude",
      bottomStatLabel: "Aides", bottomStatValue: "MPR + CEE",
      imageSrc: "/images/renocalcpro/logement-collectif.webp",
      imageAlt: "Résidence collective moderne de 4 étages avec balcons végétalisés, façade claire et arbres en premier plan",
      imageHint: "immeuble résidentiel moderne balcons végétalisés",
      imageTheme: "copro" },
    { id: "p3", reference: "RNC-2026-073", name: "Immeuble Vauban",
      location: "Lille 59", meta: "Bureaux · 1 250 m²",
      status: "scenarios", statusLabel: "Scénarios",
      bottomStatLabel: "ROI", bottomStatValue: "4,2 ans",
      imageSrc: "/images/renocalcpro/batiment-tertiaire.webp",
      imageAlt: "Bâtiment tertiaire moderne entièrement vitré avec végétation en pied, ciel bleu dégagé",
      imageHint: "immeuble de bureaux moderne vitré",
      imageTheme: "tertiaire" },
  ],
  deperditions: {
    items: [
      { label: "Murs",          value: 35, color: "#1E3D2A" },
      { label: "Toiture",       value: 22, color: "#4D7A5C" },
      { label: "Menuiseries",   value: 18, color: "#9CB8A4" },
      { label: "Plancher bas",  value: 12, color: "#B5CBA3" },
      { label: "Ventilation",   value: 8,  color: "#D1DDB8" },
      { label: "Ponts therm.",  value: 5,  color: "#E4E8CB" },
    ],
    centerValue: "194",
    centerUnit: "kWh/m²/an",
  },
  consumption: {
    beforeLabel: "Avant", beforeValue: 194,
    afterLabel: "Après",  afterValue: 76,
    unit: "kWh/m²/an", reductionPct: "−61 %", source: "Simulation ADEME",
  },
  dpe: { before: "E", after: "B" },
};

export const DEFAULT_BUILDING_TYPES: BuildingTypeOption[] = [
  { key: "maison",    label: "Maison individuelle", sub: "Résidentiel · propriétaire occupant",
    detail: "Typique : 90–180 m² · DPE D–F", selected: true,
    imageSrc: "/images/renocalcpro/maison-individuelle.webp" },
  { key: "copro",     label: "Logement collectif",  sub: "Copropriété · syndic",
    detail: "8–40 lots · parties privatives + communes",
    imageSrc: "/images/renocalcpro/logement-collectif.webp" },
  { key: "tertiaire", label: "Bâtiment tertiaire",  sub: "Bureaux · commerces · ERP",
    detail: "Décret tertiaire · obligations 2030",
    imageSrc: "/images/renocalcpro/batiment-tertiaire.webp" },
];

export const DEFAULT_STEPPER: StepperStep[] = [
  { index: 1, label: "Général",  state: "done" },
  { index: 2, label: "Enveloppe", state: "active" },
  { index: 3, label: "Systèmes",  state: "pending" },
  { index: 4, label: "Travaux",   state: "pending" },
  { index: 5, label: "Synthèse",  state: "pending" },
];

export const DEFAULT_PARAM_NAV: ParamNavItem[] = [
  { key: "wall",    label: "Murs",          icon: "wall",    active: true },
  { key: "roof",    label: "Toiture",       icon: "roof" },
  { key: "window",  label: "Fenêtres",      icon: "window" },
  { key: "floor",   label: "Plancher bas",  icon: "floor" },
  { key: "thermal", label: "Ponts therm.",  icon: "thermal" },
];

export const DEFAULT_MOBILE: MobileDashboardData = {
  greeting: "Bonjour Alex,",
  greetingLine1: "Bonjour Alex,",
  greetingLine2: "3 projets actifs · 1 nouveau rapport disponible",
  pageTitle: "Vos projets",
  userInitials: "AG",
  kpis: [
    { icon: "co2",   value: "−58 %",    label: "CO₂ évité" },
    { icon: "euro",  value: "78 000 €", label: "Investissement", variant: "gold" },
  ],
  lastProject: {
    name: "Villa des Monts d'Or",
    location: "Lyon 69",
    meta: "Lyon 69 · DPE E → B",
    status: "En cours",
    badge: "⌂ Maison",
    perfLabel: "DPE",
    perfValue: "E → B",
    progress: 68,
    imageSrc: "/images/renocalcpro/maison-individuelle.webp",
    imageTheme: "maison",
  },
};

export const DEFAULT_SCENARIOS: ScenarioData[] = [
  { id: "s1", key: "essentiel", indexLabel: "Scénario 1", tagline: "Optimisation ciblée",
    name: "Essentiel", bullets: ["Isolation des combles", "Remplacement fenêtres", "VMC hygroréglable"],
    dpeAfter: "C", investment: "42 000 €", consumption: "−38 %", cost: "42 000 €",
    deltas: [
      { label: "Consommation", value: "−38 %", tone: "positive" },
      { label: "CO₂ évité",    value: "−35 %", tone: "positive" },
      { label: "Retour",       value: "6,4 ans" },
    ] },
  { id: "s2", key: "performant", indexLabel: "Scénario 2", tagline: "Équilibre recommandé",
    name: "Performant", recommended: true,
    bullets: ["Isolation murs + combles", "Menuiseries performantes", "VMC + PAC air-eau"],
    dpeAfter: "B", investment: "78 000 €", consumption: "−61 %", cost: "78 000 €",
    deltas: [
      { label: "Consommation", value: "−61 %", tone: "positive" },
      { label: "CO₂ évité",    value: "−58 %", tone: "positive" },
      { label: "Retour",       value: "4,2 ans" },
    ] },
  { id: "s3", key: "global", indexLabel: "Scénario 3", tagline: "Performance maximale",
    name: "Global", bullets: ["Rénovation complète", "Chauffage bas carbone", "Optimisation globale"],
    dpeAfter: "A", investment: "115 000 €", consumption: "−72 %", cost: "115 000 €",
    deltas: [
      { label: "Consommation", value: "−72 %", tone: "positive" },
      { label: "CO₂ évité",    value: "−78 %", tone: "positive" },
      { label: "Retour",       value: "5,8 ans" },
    ] },
];

export const DEFAULT_REPORT: ReportData = {
  title: "Rapport énergétique",
  subtitle: "Villa des Monts d'Or · Lyon 69",
  projectName: "Villa des Monts d'Or · Lyon",
  reference: "RNC-2026-142",
  pageCount: 22,
  pages: 22,
  format: "PDF A4",
  sections: [
    "État initial du bâtiment",
    "Résultats énergétiques (DPE, GES)",
    "Scénarios de rénovation chiffrés",
    "Analyse technico-économique",
    "Aides mobilisables (MPR, CEE)",
  ],
  before: "D",
  after:  "B",
  dpeBefore: "D",
  dpeAfter: "B",
  footerStamp: "RENOCALCPRO · v3.0",
  deltaPct: "−61 %",
  miniBars: [85, 78, 70, 32],
  miniYears: ["2024", "2025", "2026", "Proj."],
  heroImageSrc: "/images/renocalcpro/rapport-energetique.webp",
  heroImageAlt: "Rapport énergétique RENOCALCPRO imprimé posé sur un bureau en bois avec plante verte, carnet et plans d'architecte",
  consumption: DEFAULT_DASHBOARD.consumption,
};

export const DEFAULT_COMPOSITION: MarketingCompositionProps = {
  brand: DEFAULT_BRAND,
  dashboard: DEFAULT_DASHBOARD,
  buildingTypes: DEFAULT_BUILDING_TYPES,
  parameters: {
    projectReference: "RNC-2026-142",
    stepper: DEFAULT_STEPPER,
    paramNav: DEFAULT_PARAM_NAV,
    formValues: {
      wallType: "Mur en maçonnerie · parpaing",
      insulation: "Aucune isolation",
    },
    materialImageSrc: null,
  },
  mobile: DEFAULT_MOBILE,
  scenarios: DEFAULT_SCENARIOS,
  report: DEFAULT_REPORT,
  locale: "fr",
};
