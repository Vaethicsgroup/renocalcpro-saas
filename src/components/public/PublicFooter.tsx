// components/public/PublicFooter.tsx
// @deprecated v2.0 — Utiliser <FooterPremium locale={…}> à la place.
// Re-export pour rétrocompat. Sera supprimé Sprint v2.4.

import { FooterPremium } from "@/components/marketing/FooterPremium";

/** @deprecated Utiliser FooterPremium */
export function PublicFooter({ locale = "fr" }: { locale?: string }) {
  return <FooterPremium locale={locale} />;
}
