// server/actions/signup.ts — Server action pour le signup magic-link.
// v2.6 : robuste dev/prod. En dev sans provider email → succès simulé + redirect onboarding.
//        En prod → délègue à NextAuth signIn("email", ...) qui gère CSRF.
"use server";

import { redirect } from "next/navigation";

export interface SignupResult {
  ok: boolean;
  /** Lien de redirection si on continue côté client (dev mode). */
  redirectTo?: string;
  /** Message d'erreur user-facing si ok=false. */
  error?: string;
  /** Si vrai → on a juste affiché "lien envoyé" sans réel envoi (dev). */
  mockedSent?: boolean;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Signup magic-link. Retourne un résultat structuré au lieu de throw.
 *
 * - DEV sans email provider configuré → succès simulé (mockedSent=true). Le composant
 *   client affichera "Lien envoyé" puis l'utilisateur peut continuer manuellement vers
 *   /onboarding/{type} (le bouton "Continuer en mode démo" sera visible dans l'UI).
 * - PROD avec provider email → délègue à NextAuth via dynamic import (évite de charger
 *   tout NextAuth dans le bundle dev si pas nécessaire).
 */
export async function requestSignupMagicLink(input: {
  email: string;
  accountType: "individual" | "pro";
  locale: string;
}): Promise<SignupResult> {
  const { email, accountType, locale } = input;

  if (!isValidEmail(email)) {
    return { ok: false, error: "invalid_email" };
  }

  const hasEmailProvider =
    Boolean(process.env.RESEND_API_KEY) ||
    process.env.EMAIL_MOCK === "true" ||
    Boolean(process.env.SMTP_HOST);

  // ── DEV / pas de provider email → mock instantané ─────────────────────
  if (!hasEmailProvider) {
    return {
      ok: true,
      mockedSent: true,
      redirectTo: `/${locale}/onboarding/${accountType}`,
    };
  }

  // ── PROD / provider email présent → vraie NextAuth signIn ─────────────
  try {
    // Dynamic import : évite de tirer NextAuth dans bundles dev si pas câblé.
    const { signIn } = await import("@/lib/auth/config");
    await signIn("email", {
      email,
      callbackUrl: `/${locale}/onboarding/${accountType}`,
      redirect: false,
    });
    return {
      ok: true,
      mockedSent: false,
      redirectTo: `/${locale}/onboarding/${accountType}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    return { ok: false, error: message };
  }
}

/**
 * Continuation onboarding en mode démo : redirige sans authentification.
 * Utilisable depuis le bouton "Continuer en mode démo" du SignupForm.
 */
export async function continueOnboardingDemo(input: {
  accountType: "individual" | "pro";
  locale: string;
}): Promise<never> {
  redirect(`/${input.locale}/onboarding/${input.accountType}`);
}
