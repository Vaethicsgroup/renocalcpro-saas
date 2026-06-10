// app/[locale]/auth/signin/page.tsx — Connexion v2.9 (formulaire signin dédié)
// ════════════════════════════════════════════════════════════════════════════
// v2.9 — Le formulaire de connexion est désormais distinct du signup.
//        Plus de bouton « Créer mon compte » sur la page de login, plus de
//        toggle Particulier / Pro non pertinent.
//        Le backend reste magic-link (cf. SigninFormPremium pour la note).
//
// v2.8 — Détecte une session déjà active et propose explicitement « Continuer »
// ou « Se déconnecter / changer de compte » au lieu de resservir un formulaire
// magic-link confus.
//
// Architecture rappel :
//   - Auth = magic-link only (NextAuth EmailProvider). Pas de mot de passe.
//   - Dev bypass : NODE_ENV !== "production" → auth() peut être indisponible.
//     getCurrentSessionSafe() try/catch pour ne jamais crasher la page.
// ════════════════════════════════════════════════════════════════════════════

import { setRequestLocale, getTranslations } from "next-intl/server";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SigninFormPremium } from "@/components/auth/SigninFormPremium";
import { AlreadySignedInCard } from "@/components/auth/AlreadySignedInCard";

interface SafeUser {
  id?: string;
  email?: string | null;
  name?: string | null;
}

/**
 * Récupère la session active de façon défensive.
 * - Lazy import de `auth()` pour éviter tout side-effect NextAuth en dev
 * - try/catch pour ne jamais crasher si NextAuth/Prisma indisponibles
 * - Retourne null si pas de session, ou en cas d'erreur
 */
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
  searchParams?: Promise<{ callbackUrl?: string }>;
}

export default async function SigninPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "authPages.signin" });

  // v2.8 — Détection session active
  const user = await getCurrentSessionSafe();
  const sp: { callbackUrl?: string } = searchParams
    ? await searchParams
    : {};
  const callbackUrl =
    typeof sp.callbackUrl === "string" ? sp.callbackUrl : undefined;

  // Si l'utilisateur a une session, on affiche la carte « déjà connecté »
  // et on cache le lien « Pas de compte ? Créer un compte » (incohérent).
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
          continueHref={callbackUrl}
        />
      </AuthLayout>
    );
  }

  // Cas par défaut — pas de session, on affiche le formulaire de connexion
  // dédié (et non plus le formulaire signup qui affichait « Créer mon compte »).
  return (
    <AuthLayout
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      altLink={{
        label: `${t("altQuestion")}|${t("altAction")}`,
        href: `/${locale}/auth/signup`,
      }}
    >
      <SigninFormPremium locale={locale} callbackUrl={callbackUrl} />
    </AuthLayout>
  );
}
