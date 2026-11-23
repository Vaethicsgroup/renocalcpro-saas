"use client";

/**
 * MarketingCompositionV5 — composition marketing "hero" validée.
 *
 * Layout :
 *   [ Brand column (sticky left) ] [ Scène device (grille à droite) ]
 *     - Laptop central (Dashboard)
 *     - Tablet 1 (Create project)     — superposée top-right
 *     - Tablet 2 (Parameters)         — superposée bottom-left
 *     - Phone (Mobile dashboard)      — superposée bottom-right
 *     - Scenarios card                — ligne du bas (large)
 *     - Report card                   — ligne du bas (droite)
 *
 * Data-driven : tout arrive en props (voir MarketingCompositionProps).
 * Un wrapper serveur peut choisir DEFAULT_COMPOSITION pour la landing publique
 * ou brancher les données réelles (Prisma + i18n + user session) pour l'aperçu
 * authentifié.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import type { MarketingCompositionProps } from "./types";
import { BrandColumn } from "./BrandColumn";
import { DashboardMockup } from "./DashboardMockup";
import { CreateProjectMockup, ParametersMockup } from "./TabletMockups";
import { MobileDashboardMockup } from "./MobileDashboardMockup";
import { ScenariosCardMockup } from "./ScenariosCardMockup";
import { ReportCardMockup } from "./ReportCardMockup";
import { LaptopFrame, TabletFrame, PhoneFrame } from "./primitives";

export function MarketingCompositionV5({
  brand, dashboard, buildingTypes, parameters, mobile, scenarios, report,
  className,
}: MarketingCompositionProps & { className?: string }) {
  return (
    <section
      className={cn(
        "relative mx-auto grid max-w-[1480px] grid-cols-[440px_1fr] gap-16 px-10 py-16",
        // Fond doux cream pour laisser le design respirer
        "bg-gradient-to-br from-cream-50 via-cream-50 to-cream-100",
        className,
      )}
    >
      {/* Colonne branding sticky */}
      <div className="sticky top-16 self-start">
        <BrandColumn brand={brand} />
      </div>

      {/* Scène device */}
      <div className="relative min-h-[1000px]">
        {/* Laptop central (dashboard) */}
        <LaptopFrame className="relative z-10 mx-auto w-[900px]">
          <DashboardMockup data={dashboard} />
        </LaptopFrame>

        {/* Tablet 1 — Create project, top-right overlap */}
        <TabletFrame
          className="absolute right-[-40px] top-[-20px] z-20 w-[340px] rotate-[3deg]"
        >
          <CreateProjectMockup buildingTypes={buildingTypes} />
        </TabletFrame>

        {/* Tablet 2 — Parameters, bottom-left overlap */}
        <TabletFrame
          className="absolute left-[-30px] top-[480px] z-20 w-[380px] -rotate-[2deg]"
        >
          <ParametersMockup
            stepper={parameters.stepper}
            paramNav={parameters.paramNav}
            formValues={parameters.formValues}
            projectReference={parameters.projectReference}
            materialImageSrc={parameters.materialImageSrc}
          />
        </TabletFrame>

        {/* Phone — bottom-right overlap */}
        <PhoneFrame className="absolute right-[40px] top-[420px] z-30 w-[220px]" rotate={-4}>
          <div style={{ height: "440px" }}>
            <MobileDashboardMockup data={mobile} />
          </div>
        </PhoneFrame>

        {/* Ligne du bas — cartes synthèses */}
        <div className="relative z-10 mt-14 grid grid-cols-[1.4fr_1fr] gap-6">
          <ScenariosCardMockup scenarios={scenarios} />
          <ReportCardMockup report={report} />
        </div>
      </div>
    </section>
  );
}
