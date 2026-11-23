// app/[locale]/(public)/layout.tsx — Wrapper pages publiques v2.0
// Header + Footer Premium + JSON-LD SEO + segment suggestion + cookie consent
import type { ReactNode } from "react";
import { HeaderPremium } from "@/components/marketing/HeaderPremium";
import { FooterPremium } from "@/components/marketing/FooterPremium";
import { OrganizationJsonLd, SoftwareApplicationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";
import { SegmentSuggestion } from "@/components/marketing/SegmentSuggestion";
import { CookieConsent } from "@/components/legal/CookieConsent";

interface Props { children: ReactNode; params: Promise<{ locale: string }> }

export default async function PublicLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    // `translate="no"` + `notranslate` au niveau le plus haut possible pour
    // couper Chrome auto-translate sur le header, le main et le footer. Le
    // contenu FR/EN est servi par next-intl, pas besoin d'une double traduction
    // navigateur qui casse la marque ("RENOCALCPRO" → "RENO CALC PRO") et les
    // libellés FR ("Vue d'ensemble" → "Overview").
    <div lang={locale === "en" ? "en" : "fr"} translate="no" className="notranslate">
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <WebSiteJsonLd />
      <HeaderPremium locale={locale} />
      <main>{children}</main>
      <FooterPremium locale={locale} />
      <SegmentSuggestion locale={locale} />
      <CookieConsent />
    </div>
  );
}
