// app/[locale]/auth/signup/page.tsx — Création de compte v2.8
// ════════════════════════════════════════════════════════════════════════════
// v2.8 — Détecte une session déjà active. Si l'utilisateur a un compte
// actif, il n'a pas besoin de s'en créer un nouveau — on lui montre la
// même carte que sur signin avec « Continuer » + « Se déconnecter ».
// ════════════════════════════════════════════════════════════════════════════

import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupFormPremium } from "@/components/auth/SignupFormPremium";
import { AlreadySignedInCard } from "@/components/auth/AlreadySignedInCard";

interface SafeUser {
  id?: string;
  email?: string | null;
  name?: string | null;
}

async function getCurrentSessionSafe(): Promise<SafeUser | null> {
  try {
    const { auth } = await import("@/lib/auth/config");
    const session = await auth();
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
    };
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SignupPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "authPages.signup" });

  const user = await getCurrentSessionSafe();
  if (user) {
    return (
      <AuthLayout
        locale={locale}
        title={t("title")}
        subtitle={t("subtitle")}
      >
        <AlreadySignedInCard
          locale={locale}
          user={user}
          continueLabel={t("continueToWorkspace")}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      altLink={{
        label: `${t("altQuestion")}|${t("altAction")}`,
        href: `/${locale}/auth/signin`,
      }}
    >
      <SignupFormPremium locale={locale} />
    </AuthLayout>
  );
}
