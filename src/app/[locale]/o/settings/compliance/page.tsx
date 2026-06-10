// src/app/[locale]/o/settings/compliance/page.tsx
// Page paramètres — formulaire déclaratif de conformité professionnelle.
// MVP : persistance localStorage côté client. Pas de migration Prisma.

import { setRequestLocale, getTranslations } from "next-intl/server";
import { ComplianceForm } from "@/components/compliance/ComplianceForm";

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "complianceForm" });
  return { title: t("pageTitle") };
}

export default async function CompliancePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "complianceForm" });
  // MVP : orgId mock — sera remplacé par session.user.organizationId quand
  // le bloc auth/Prisma sera autorisé à reprendre.
  const orgId = "demo-org";

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <header>
        <h1
          className="font-serif text-3xl font-bold tracking-tight text-stone-900"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-stone-600">{t("pageSubtitle")}</p>
      </header>

      <ComplianceForm orgId={orgId} locale={locale} />
    </div>
  );
}
