// app/[locale]/auth/forgot-password/page.tsx — Mot de passe oublié v2.0
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getTranslations } from "next-intl/server";

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "forgotPassword" });
  return (
    <AuthLayout
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      altLink={{ label: t("altLinkLabel"), href: `/${locale}/auth/signin` }}
    >
      <ForgotPasswordForm locale={locale} />
    </AuthLayout>
  );
}
