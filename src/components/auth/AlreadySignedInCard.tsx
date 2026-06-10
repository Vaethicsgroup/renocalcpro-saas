// src/components/auth/AlreadySignedInCard.tsx
// ════════════════════════════════════════════════════════════════════════════
// Carte affichée sur /auth/signin quand l'utilisateur a déjà une session
// active. Au lieu de lui resservir un formulaire email/magic-link qu'il
// ne comprendra pas, on lui propose explicitement :
//   - Continuer (vers son dashboard selon profil)
//   - Se déconnecter pour changer de compte
//
// Rappel architecture : l'authentification RENOCALCPRO est en magic-link
// (pas de mot de passe). C'est par design — l'absence de champ password
// n'est pas un bug.
// ════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { CheckCircle2, LogOut, ArrowRight, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface User {
  id?: string;
  email?: string | null;
  name?: string | null;
}

interface Props {
  locale: string;
  user: User;
  /** URL vers laquelle pointer le bouton « Continuer ». */
  continueHref?: string;
  /** Libellé du bouton « Continuer ». Si absent, utilise la traduction par défaut. */
  continueLabel?: string;
}

/**
 * Bloc « Vous êtes déjà connecté ». Server component pur.
 * Affiche l'email courant + 2 actions claires. Traduit via next-intl.
 */
export async function AlreadySignedInCard({
  locale,
  user,
  continueHref,
  continueLabel,
}: Props) {
  const t = await getTranslations({ locale, namespace: "alreadySignedIn" });
  const displayName = user.name?.trim() || null;
  const displayEmail = user.email?.trim() || null;
  const targetHref = continueHref ?? `/${locale}/p/dashboard`;
  const label = continueLabel ?? t("continueDefault");

  return (
    <div className="space-y-5">
      {/* Bandeau session active */}
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-3 rounded-xl border border-forest-200 bg-forest-50 p-4"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700 ring-1 ring-forest-200">
          <CheckCircle2 className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-forest-900">{t("title")}</p>
          {(displayName || displayEmail) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-700">
              <Mail
                className="h-3 w-3 shrink-0 text-stone-500"
                strokeWidth={2}
                aria-hidden
              />
              <span className="truncate">
                {displayName ? (
                  <>
                    <span className="font-semibold text-forest-900">
                      {displayName}
                    </span>
                    {displayEmail ? ` · ${displayEmail}` : ""}
                  </>
                ) : (
                  displayEmail
                )}
              </span>
            </p>
          )}
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            {t("description")}
          </p>
        </div>
      </div>

      {/* CTA principal : continuer */}
      <Link
        href={targetHref}
        className="group flex w-full items-center justify-between gap-3 rounded-xl bg-forest-700 px-5 py-3.5 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-forest-800"
      >
        <span>{label}</span>
        <ArrowRight
          className="h-4 w-4 transition group-hover:translate-x-0.5"
          strokeWidth={2}
          aria-hidden
        />
      </Link>

      {/* CTA secondaire : changer de compte */}
      <Link
        href={`/${locale}/logout`}
        className="group flex w-full items-center justify-between gap-3 rounded-xl border border-cream-300 bg-white px-5 py-3.5 text-sm font-semibold text-forest-900 transition hover:border-forest-300 hover:bg-cream-50"
      >
        <span className="flex items-center gap-2">
          <LogOut className="h-4 w-4 text-stone-500" strokeWidth={2} aria-hidden />
          {t("switchAccount")}
        </span>
        <ArrowRight
          className="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-forest-700"
          strokeWidth={2}
          aria-hidden
        />
      </Link>

      {/* Note explicative magic-link */}
      <p className="rounded-lg border border-cream-200 bg-cream-50/60 p-3 text-[11px] leading-relaxed text-stone-600">
        <span className="font-semibold text-forest-800">{t("noteStrong")}</span>{" "}
        {t("note")}
      </p>
    </div>
  );
}
