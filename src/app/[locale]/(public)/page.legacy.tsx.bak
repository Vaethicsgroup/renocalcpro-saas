// app/[locale]/(public)/page.tsx — Page d'accueil publique Premium v2.0
// Hero éditorial premium + sections existantes harmonisées au nouveau DS.

import { setRequestLocale } from "next-intl/server";
import { HeroPremium } from "@/components/marketing/HeroPremium"; // v2.0
import { SegmentSelector } from "@/components/landing/SegmentSelector";
import { SegmentSplit } from "@/components/marketing/SegmentSplit";
import { TrustBar } from "@/components/marketing/TrustBar";
import { FeatureCarousel } from "@/components/marketing/FeatureCarousel";
import { PdfShowcase } from "@/components/marketing/PdfShowcase";
import { BenefitGrid } from "@/components/marketing/BenefitGrid";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { PricingTable } from "@/components/marketing/PricingTable";
import { FAQ } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroPremium locale={locale} />
      <SegmentSelector locale={locale} />
      <SegmentSplit />
      <TrustBar />
      <FeatureCarousel />
      <PdfShowcase />
      <BenefitGrid />
      <ComparisonTable />
      <HowItWorks />
      <PricingTable />
      <FAQ />
      <CTASection />
    </>
  );
}
