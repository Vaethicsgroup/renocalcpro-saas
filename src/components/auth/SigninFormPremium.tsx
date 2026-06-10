// components/auth/SigninFormPremium.tsx — Formulaire CONNEXION dédié (vs signup)
// ════════════════════════════════════════════════════════════════════════════
// Le formulaire signin est désormais distinct du formulaire signup pour
// éviter la confusion visuelle remontée par l'utilisateur :
//
//   AVANT (bug)
//   - /auth/signin réutilisait <SignupFormPremium />
//   - Bouton affichait « Créer mon compte »
//   - Mention légale « En créant un compte… »
//   - Toggle Particulier / Professionnel visible (non pertinent à la connexion)
//
//   APRÈS (fix)
//   - /auth/signin utilise <SigninFormPremium />
//   - Bouton « Me connecter avec mon email »
//   - Mention « En vous connectant, vous acceptez… »
//   - Pas de toggle Particulier / Pro : le profil du compte est déjà connu côté DB
//   - Email + même backend magic-link (requestSignupMagicLink fonctionne pour les
//     deux flux puisqu'il ne fait qu'envoyer un lien à l'email donné). Si le
//     compte existe → reconnexion. Sinon → onboarding.
//
// Rappel architecture : l'authentification reste en magic-link only (pas de
// mot de passe). C'est par design — la sécurité du lien à usage unique est
// supérieure à la sécurité d'un mot de passe utilisateur. Si vous voulez
// ajouter une connexion email + mot de passe, dites-le explicitement : c'est
// un chantier auth dédié (CredentialsProvider + Prisma User.passwordHash +
// migration + reset password).
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, ArrowRight, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Input";
import { requestSignupMagicLink } from "@/server/actions/signup";

interface Props {
  locale: string;
  /** Lien de redirection après réception du lien magic-link. */
  callbackUrl?: string;
}

export function SigninFormPremium({ locale, callbackUrl }: Props) {
  const router = useRouter();
  const t = useTranslations("signinForm");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [mocked, setMocked] = useState(false);
  const [continueHref, setContinueHref] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // On réutilise l'action existante avec accountType="individual" par
      // défaut. Côté serveur, peu importe : le magic-link est envoyé à
      // l'email et NextAuth identifiera le compte existant lors du clic.
      const result = await requestSignupMagicLink({
        email,
        accountType: "individual",
        locale,
      });
      if (!result.ok) {
        setError(
          result.error === "invalid_email"
            ? t("errorInvalidEmail")
            : t("errorGeneric"),
        );
        return;
      }
      setSent(true);
      setMocked(Boolean(result.mockedSent));
      // Si callbackUrl fourni, on l'utilise comme destination de continuation
      // en mode dev. Sinon, on tombe sur la redirection par défaut.
      setContinueHref(callbackUrl ?? result.redirectTo ?? `/${locale}/p/dashboard`);
    });
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-forest-200 bg-forest-50 p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-forest-100 text-forest-700 ring-1 ring-forest-200">
            <Mail className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </div>
          <h3 className="mt-3 font-serif text-xl font-bold text-forest-900">
            {t("sentTitle")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-forest-900/85">
            {mocked ? (
              <>
                {t("sentBodyMock")}
                <br />
                <span className="text-xs text-forest-900/65">({email})</span>
              </>
            ) : (
              <>{t("sentBody", { email })}</>
            )}
          </p>

          {mocked && continueHref && (
            <button
              type="button"
              onClick={() => router.push(continueHref)}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-forest-800"
            >
              {t("continueDemo")}
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          )}

          <p className="mt-4 text-xs text-forest-900/65">
            {t("notReceived")}{" "}
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setMocked(false);
                setError(null);
              }}
              className="inline-flex items-center gap-1 font-semibold text-forest-700 underline hover:text-forest-800"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={2} aria-hidden />
              {t("retry")}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Note pédagogique magic-link, plus discrète que sur signup */}
      <div className="flex items-start gap-2 rounded-lg border border-cream-300 bg-cream-50/60 p-3 text-xs leading-relaxed text-stone-700">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-700" strokeWidth={2} aria-hidden />
        <p>
          <span className="font-semibold text-forest-800">
            {t("introStrong")}
          </span>{" "}
          {t("intro")}
        </p>
      </div>

      <FormField
        label={t("emailLabel")}
        htmlFor="signin-email"
        helper={t("emailHelper")}
        required
      >
        <Input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vous@exemple.fr"
          value={email}
          onChange={e => setEmail(e.target.value)}
          invalid={Boolean(error)}
        />
      </FormField>

      {error && (
        <p
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <Button type="submit" loading={pending} fullWidth size="lg">
        {pending ? t("submitting") : t("submit")}
      </Button>

      <p className="text-center text-xs leading-relaxed text-forest-900/55">
        {t.rich("termsAccept", {
          terms: (chunks) => (
            <Link
              href={`/${locale}/legal/cgu`}
              className="font-semibold text-forest-700 hover:underline"
            >
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link
              href={`/${locale}/legal/privacy`}
              className="font-semibold text-forest-700 hover:underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>

      {/* Lien aide / forgot-password */}
      <p className="text-center text-xs">
        <Link
          href={`/${locale}/auth/forgot-password`}
          className="font-semibold text-stone-600 hover:text-forest-700 hover:underline"
        >
          {t("troubleLogin")}
        </Link>
      </p>
    </form>
  );
}
