// Barrel export — composition marketing V5.
// Import côté consommateur :
//   import { MarketingCompositionV5, DEFAULT_COMPOSITION } from "@/components/marketing/compositionV5";

export { MarketingCompositionV5 } from "./MarketingCompositionV5";
export { BrandColumn } from "./BrandColumn";
export { DashboardMockup } from "./DashboardMockup";
export { CreateProjectMockup, ParametersMockup } from "./TabletMockups";
export { MobileDashboardMockup } from "./MobileDashboardMockup";
export { ScenariosCardMockup } from "./ScenariosCardMockup";
export { ReportCardMockup } from "./ReportCardMockup";
export { LaptopFrame, TabletFrame, PhoneFrame, AssetImage } from "./primitives";
export { DonutChart, BarCompare, DpeScale } from "./charts";
export {
  DEFAULT_COMPOSITION, DEFAULT_BRAND, DEFAULT_DASHBOARD,
  DEFAULT_BUILDING_TYPES, DEFAULT_STEPPER, DEFAULT_PARAM_NAV,
  DEFAULT_MOBILE, DEFAULT_SCENARIOS, DEFAULT_REPORT,
} from "./mock-data";
export type * from "./types";
