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
    <>
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <WebSiteJsonLd />
      <HeaderPremium locale={locale} />
      <main>{children}</main>
      <FooterPremium locale={locale} />
      <SegmentSuggestion locale={locale} />
      <CookieConsent />
    </>
  );
}
