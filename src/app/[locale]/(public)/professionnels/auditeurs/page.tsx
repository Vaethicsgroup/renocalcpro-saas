// app/[locale]/(public)/professionnels/auditeurs/page.tsx
// Landing dédiée auditeurs énergétiques OPQIBI.
// A/B testing actif sur le hero (variants A et B).

import { SegmentedLanding } from "@/components/landing/SegmentedLanding";
import { getOrAssignHeroVariant, HERO_VARIANTS } from "@/lib/abtest/heroVariant";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "segAud" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("ogDescription"),
      images: [{ url: "/api/og/landing/auditeurs", width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", images: ["/api/og/landing/auditeurs"] },
  };
}

export default async function AuditeursLanding({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "segAud" });
  const variant = await getOrAssignHeroVariant("auditeurs");
  const heroVariantContent = HERO_VARIANTS.auditeurs[variant];

  return (
    <SegmentedLanding
      segment="auditeurs"
      segmentLabel={t("segmentLabel")}
      segmentColor="bg-gradient-to-br from-teal-700 to-teal-900"
      hero={{
        variantId: variant,
        title: heroVariantContent.title,
        subtitle: heroVariantContent.subtitle,
        ctaPrimary: { label: heroVariantContent.ctaPrimary, href: `/${locale}/onboarding?segment=AUDITEUR` },
        ctaSecondary: { label: t("ctaSecondary"), href: `/${locale}/demo/audit-particulier` },
      }}
      features={[
        { icon: "✅", title: t("feat1Title"), description: t("feat1Desc") },
        { icon: "📊", title: t("feat2Title"), description: t("feat2Desc") },
        { icon: "📑", title: t("feat3Title"), description: t("feat3Desc") },
        { icon: "🤖", title: t("feat4Title"), description: t("feat4Desc") },
        { icon: "FR", title: t("feat5Title"), description: t("feat5Desc") },
        { icon: "🌍", title: t("feat6Title"), description: t("feat6Desc") },
      ]}
      comparison={{
        competitor: t("compCompetitor"),
        rows: [
          { feature: t("compFeat1"), us: t("compUs1"), them: t("compThem1") },
          { feature: t("compFeat2"), us: t("compUs2"), them: t("compThem2") },
          { feature: t("compFeat3"), us: t("compUs3"), them: t("compThem3") },
          { feature: t("compFeat4"), us: t("compUs4"), them: t("compThem4") },
          { feature: t("compFeat5"), us: t("compUs5"), them: t("compThem5") },
          { feature: t("compFeat6"), us: t("compUs6"), them: t("compThem6") },
          { feature: t("compFeat7"), us: t("compUs7"), them: t("compThem7") },
        ],
      }}
      testimonials={[
        { quote: t("test1Quote"), author: t("test1Author"), role: t("test1Role"), company: t("test1Company") },
        { quote: t("test2Quote"), author: t("test2Author"), role: t("test2Role"), company: t("test2Company") },
      ]}
      pricingTeaser={{
        plan: t("pricingPlan"),
        price: t("pricingPrice"),
        perks: [t("perk1"), t("perk2"), t("perk3"), t("perk4"), t("perk5"), t("perk6")],
      }}
    />
  );
}
