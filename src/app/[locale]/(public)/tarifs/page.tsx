// app/[locale]/(public)/tarifs/page.tsx — Page abonnements premium v2.0
// Toggle mensuel/annuel + 4 plans + comparateur 30+ lignes + FAQ + garanties

import { setRequestLocale, getTranslations } from "next-intl/server";
import { PricingPremium } from "@/components/pricing/PricingPremium";

interface Props { params: Promise<{ locale: string }> }

export default async function TarifsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingPremium locale={locale} />;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricingPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
