// Types partagés pour la composition marketing V5.
// Toutes les surfaces sont data-driven : chaque mockup accepte des props
// branchables au back / au moteur de calcul / à Prisma / aux PDF Vercel.
// Les valeurs par défaut (mock-data.ts) existent uniquement pour le rendu
// marketing hors contexte utilisateur.

export type ProjectStatus = "en-cours" | "etude" | "scenarios" | "termine";

export interface ProjectCardData {
  id: string;
  reference?: string;                        // ex: "RNC-2026-142"
  name: string;                              // ex: "Villa des Monts d'Or"
  location: string;                          // ex: "Lyon 69"
  meta: string;                              // ex: "142 m² · Rénovation globale"
  status: ProjectStatus;
  statusLabel: string;                       // ex: "En cours"
  bottomStatLabel: string;                   // ex: "DPE"
  bottomStatValue: string;                   // ex: "E → B"
  imageSrc?: string | null;                  // next/image src — placeholder si null
  imageAlt?: string;
  imageHint: string;                         // ex: "maison individuelle contemporaine"
  imageTheme: "maison" | "copro" | "tertiaire"; // dégradé placeholder
}

export interface KpiData {
  id: string;
  label: string;
  value: string;                             // ex: "−62 %" (déjà formaté)
  footer?: string;                           // ex: "après rénovation recommandée"
  trend?: { value: string; direction: "up" | "down" | "flat" };
  icon: "home" | "leaf" | "co2" | "euro";
  variant?: "default" | "success" | "gold";
}

export interface DeperditionItem { label: string; value: number; color: string; }
export interface DonutData {
  items: DeperditionItem[];
  centerValue: string;                       // ex: "194"
  centerUnit: string;                        // ex: "kWh/m²/an"
}

export interface BarCompareData {
  beforeLabel: string;
  beforeValue: number;
  afterLabel: string;
  afterValue: number;
  unit: string;                              // ex: "kWh/m²/an"
  reductionPct: string;                      // ex: "−61 %"
  source?: string;                           // ex: "Simulation ADEME"
}

export interface DpeScaleData {
  before: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  after:  "A" | "B" | "C" | "D" | "E" | "F" | "G";
}

export type BuildingType = "maison" | "copro" | "tertiaire";
export interface BuildingTypeOption {
  key: BuildingType;
  label: string;                             // "Maison individuelle"
  sub: string;                               // "Résidentiel · propriétaire occupant"
  detail: string;                            // "Typique : 90–180 m² · DPE D–F"
  selected?: boolean;
  imageSrc?: string | null;
}

export interface StepperStep {
  index: number;
  label: string;
  state: "done" | "active" | "pending";
}

export interface ParamNavItem {
  key: string;
  label: string;
  icon: "wall" | "roof" | "window" | "floor" | "thermal";
  active?: boolean;
}

export interface ScenarioData {
  id: string;
  key: string;                               // "essentiel" | "performant" | "global"
  indexLabel: string;                        // "Scénario 1"
  tagline: string;                           // "Optimisation ciblée"
  name: string;                              // "Essentiel"
  bullets: string[];
  dpeAfter: string;                          // "C"
  investment: string;                        // "42 000 €"
  consumption: string;                       // "−38 %"
  cost: string;                              // "42 000 €"
  deltas: { label: string; value: string; tone?: "positive" | "neutral" }[];
  recommended?: boolean;
}

export interface ReportData {
  title: string;                             // "Rapport énergétique"
  projectName: string;                       // "Villa des Monts d'Or · Lyon"
  reference: string;                         // "RNC-2026-142"
  pageCount: number;                         // 22
  format: "PDF A4" | "PDF A3";
  sections: string[];                        // ["État initial du bâtiment", ...]
  before: DpeScaleData["before"];
  after: DpeScaleData["after"];
  consumption: BarCompareData;
  // Extensions utilisées par ReportCardMockup :
  subtitle: string;                          // "Villa des Monts d'Or · Lyon 69"
  pages: number;                             // alias de pageCount
  dpeBefore: DpeScaleData["before"];
  dpeAfter: DpeScaleData["after"];
  footerStamp: string;                       // "RENOCALCPRO · v3.0"
  deltaPct: string;                          // "−61 %"
  miniBars: number[];                        // hauteurs en %
  miniYears: string[];                       // ["2024","2025","2026","proj."]
  heroImageSrc?: string | null;              // photo rendu brochure / mise en scène
  heroImageAlt?: string;
}

export interface BrandContent {
  headlineHtml: string;                      // peut contenir <em>, <span class="gold">
  lede: string;
  features: { icon: "energy" | "scenarios" | "analytics" | "report"; title: string; sub: string }[];
  trustBadges: string[];                     // ex: ["RGE compatible", "ADEME · DPE", "RGPD"]
  versionStamp?: string;                     // ex: "v3.0 · PREVIEW"
  domain?: string;                           // ex: "renocalcpro.vercel.app"
}

export interface DashboardMockupData {
  userName: string;
  userRole: string;
  userInitials: string;
  pageTitle: string;
  pageSub: string;
  kpis: KpiData[];
  projects: ProjectCardData[];
  deperditions: DonutData;
  consumption: BarCompareData;
  dpe: DpeScaleData;
}

export interface MobileDashboardData {
  greeting: string;
  greetingLine1: string;                       // ex: "Bonjour Alex,"
  greetingLine2: string;                       // ex: "3 projets actifs · 1 nouveau rapport"
  pageTitle: string;
  userInitials: string;                        // ex: "AG"
  kpis: {
    icon: "leaf" | "euro" | "chart" | "co2";
    value: string;
    label: string;
    variant?: "default" | "gold";
  }[];
  lastProject: {
    name: string;
    location: string;                          // ex: "Lyon 69"
    meta: string;
    status: string;
    badge: string;                             // ex: "⌂ Maison"
    perfLabel: string;                         // ex: "DPE projeté"
    perfValue: string;                         // ex: "E → B"
    progress?: number;
    imageSrc?: string | null;
    imageTheme: BuildingType;
  };
}

export interface MarketingCompositionProps {
  brand: BrandContent;
  dashboard: DashboardMockupData;
  buildingTypes: BuildingTypeOption[];
  parameters: {
    projectReference: string;
    stepper: StepperStep[];
    paramNav: ParamNavItem[];
    formValues: {
      wallType: string;
      insulation: string;
      thickness?: string;
      conductivity?: string;
    };
    materialImageSrc?: string | null;
  };
  mobile: MobileDashboardData;
  scenarios: ScenarioData[];
  report: ReportData;
  locale?: string;
}
