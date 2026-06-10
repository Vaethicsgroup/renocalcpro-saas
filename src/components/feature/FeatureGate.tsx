// components/feature/FeatureGate.tsx
// Gate React Server Component : protège un sous-arbre selon une feature.
// Usage :
//   <FeatureGate feature="PDF_TEMPLATE_TERTIAIRE">
//     <ButtonGenerateTertiaryReport />
//   </FeatureGate>

import { canUse } from "@/lib/features/canUse";
import type { FeatureFlag } from "@prisma/client";
import type { ReactNode } from "react";
import { UpgradeCard } from "./UpgradeCard";

interface FeatureGateProps {
  feature: FeatureFlag;
  organizationId: string;
  unitsRequested?: number;
  children: ReactNode;
  fallback?: ReactNode;
  /** Affiche une UpgradeCard inline quand bloqué (défaut : true). */
  showUpgrade?: boolean;
}

export async function FeatureGate({
  feature,
  organizationId,
  unitsRequested = 1,
  children,
  fallback,
  showUpgrade = true,
}: FeatureGateProps) {
  const result = await canUse(organizationId, feature, unitsRequested);

  if (result.allowed) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  if (!showUpgrade) return null;

  return (
    <UpgradeCard
      feature={feature}
      reason={result.reason}
      suggestedPlan={result.suggestedPlan}
    />
  );
}
