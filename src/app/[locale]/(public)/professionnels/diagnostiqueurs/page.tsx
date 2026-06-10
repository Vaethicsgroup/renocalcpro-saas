// app/[locale]/(public)/professionnels/diagnostiqueurs/page.tsx
// Landing dédiée diagnostiqueurs DPE certifiés AFNOR.

import { SegmentedLanding } from "@/components/landing/SegmentedLanding";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "segDiag" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function DiagnostiqueursLanding({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "segDiag" });
  return (
    <SegmentedLanding
      segment="diagnostiqueurs"
      segmentLabel={t("segmentLabel")}
      segmentColor="bg-gradient-to-br from-blue-700 to-blue-900"
      hero={{
        variantId: "A",
        title: t("heroTitle"),
        subtitle: t("heroSubtitle"),
        ctaPrimary: { label: t("ctaStart"), href: `/${locale}/onboarding?segment=DIAGNOSTIQUEUR` },
        ctaSecondary: { label: t("ctaExample"), href: `/${locale}/demo/dpe-collectif` },
      }}
      features={[
        { icon: "🏢", title: t("feat1Title"), description: t("feat1Desc") },
        { icon: "⚖️", title: t("feat2Title"), description: t("feat2Desc") },
        { icon: "🔒", title: t("feat3Title"), description: t("feat3Desc") },
        { icon: "📋", title: t("feat4Title"), description: t("feat4Desc") },
        { icon: "🚨", title: t("feat5Title"), description: t("feat5Desc") },
        { icon: "💼", title: t("feat6Title"), description: t("feat6Desc") },
      ]}
      testimonials={[
        { quote: t("test1Quote"), author: t("test1Author"), role: t("test1Role"), company: t("test1Company") },
      ]}
      pricingTeaser={{
        plan: t("pricingPlan"),
        price: t("pricingPrice"),
        perks: [t("perk1"), t("perk2"), t("perk3"), t("perk4"), t("perk5"), t("perk6")],
      }}
    />
  );
}
