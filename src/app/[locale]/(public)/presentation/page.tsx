import type { Metadata } from "next";
import {
  MarketingCompositionV5,
  DEFAULT_COMPOSITION,
} from "@/components/marketing/compositionV5";

export const metadata: Metadata = {
  title: "RENOCALCPRO · Présentation",
  description:
    "La plateforme professionnelle pour auditer, simuler et piloter la rénovation énergétique des bâtiments. DPE conforme ADEME, scénarios chiffrés, rapports prêts à livrer.",
};

/**
 * Page publique /presentation — composition marketing V5 validée.
 *
 * Source de données : `DEFAULT_COMPOSITION` (mock marketing). À remplacer par
 * un chargeur serveur (Prisma + i18n) lorsque la landing utilisera des données
 * réelles, ou pour une variante authentifiée "preview" (par ex.
 * /presentation/mon-studio).
 */
export default function PresentationPage() {
  return <MarketingCompositionV5 {...DEFAULT_COMPOSITION} />;
}
