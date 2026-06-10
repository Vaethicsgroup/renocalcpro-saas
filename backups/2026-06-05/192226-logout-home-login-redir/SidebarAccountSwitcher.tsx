// src/components/layout/SidebarAccountSwitcher.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bloc compte / switcher d'espaces (Particulier · Pro · Admin) + actions
// d'authentification (Se connecter / Se déconnecter).
//
// S'intègre en bas des sidebars existantes. Le statut de session et les
// rôles disponibles sont passés par le parent — ce composant est 100 %
// présentationnel.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  User,
  ChevronUp,
  ChevronDown,
  LogIn,
  LogOut,
  UserCircle2,
  Briefcase,
  Shield,
  Check,
} from "lucide-react";

export type ProfileKind = "PARTICULIER" | "PRO" | "ADMIN";

interface AvailableProfile {
  kind: ProfileKind;
  /** Label affiché. */
  labelFr: string;
  /** Description courte. */
  descriptionFr: string;
  /** Route racine de cet espace (/p/dashboard, /o/projects, /admin). */
  href: string;
}

const PROFILE_META: Record<
  ProfileKind,
  { Icon: typeof User; color: string; bg: string }
> = {
  PARTICULIER: {
    Icon: UserCircle2,
    color: "text-forest-400",
    bg: "bg-forest-500/15",
  },
  PRO: { Icon: Briefcase, color: "text-info-400", bg: "bg-info-500/15" },
  ADMIN: { Icon: Shield, color: "text-amber-400", bg: "bg-amber-500/15" },
};

interface Props {
  locale: string;
  /** Persona actuellement actif. Si non fourni → bouton "Se connecter". */
  currentProfile?: ProfileKind;
  /** Email / nom utilisateur affiché. */
  userIdentifier?: string;
  /** Liste des espaces auxquels l'utilisateur a accès. */
  availableProfiles?: ReadonlyArray<ProfileKind>;
  /** Action déconnexion (callback ou href). Par défaut → page logout brandée. */
  signOutHref?: string;
}

export function SidebarAccountSwitcher({
  locale,
  currentProfile,
  userIdentifier = "Utilisateur",
  availableProfiles = ["PARTICULIER"],
  signOutHref,
}: Props) {
  // Path de déconnexion brandé par défaut (carte de confirmation custom)
  const resolvedSignOutHref = signOutHref ?? `/${locale}/logout`;
  const [expanded, setExpanded] = useState(false);

  // Cas non connecté — liens vers les vraies pages auth modernes (v2.7).
  if (!currentProfile) {
    return (
      <div className="mt-6 border-t border-night-700/60 pt-4">
        <Link
          href={`/${locale}/auth/signin`}
          className="flex items-center gap-2 rounded-lg bg-forest-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-700"
        >
          <LogIn className="h-4 w-4" strokeWidth={2} />
          Se connecter
        </Link>
        <p className="mt-2 px-3 text-[11px] text-cream-100/60">
          <Link
            href={`/${locale}/auth/signup`}
            className="font-semibold text-forest-400 hover:underline"
          >
            Créer un compte gratuit
          </Link>
          {" "}pour démarrer un dossier.
        </p>
      </div>
    );
  }

  const meta = PROFILE_META[currentProfile];
  const Icon = meta.Icon;

  // Liste des profils dispos hors profil actif
  const switchableProfiles = availableProfiles.filter(
    (p) => p !== currentProfile,
  );

  const ALL_PROFILES: ReadonlyArray<AvailableProfile> = [
    {
      kind: "PARTICULIER",
      labelFr: "Espace Particulier",
      descriptionFr: "Vos projets et aides personnelles",
      href: `/${locale}/p/dashboard`,
    },
    {
      kind: "PRO",
      labelFr: "Dashboard Pro",
      descriptionFr: "Dossiers clients, audits, rapports",
      href: `/${locale}/o/projects`,
    },
    {
      kind: "ADMIN",
      labelFr: "Administration",
      descriptionFr: "Plateforme, organisations, billing",
      href: `/${locale}/admin`,
    },
  ];

  return (
    <div className="mt-6 border-t border-night-700/60 pt-4">
      {/* Carte profil compact cliquable pour déplier */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2.5 rounded-lg border border-night-700 bg-night-900/40 px-3 py-2.5 text-left transition-colors hover:bg-night-700/60"
      >
        <span
          aria-hidden
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.bg}`}
        >
          <Icon className={`h-[18px] w-[18px] ${meta.color}`} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-white">
            {userIdentifier}
          </span>
          <span className="block text-[10px] uppercase tracking-wider text-cream-100/60">
            {currentProfile === "PARTICULIER"
              ? "Espace Particulier"
              : currentProfile === "PRO"
                ? "Dashboard Pro"
                : "Administration"}
          </span>
        </span>
        {expanded ? (
          <ChevronUp
            className="h-4 w-4 shrink-0 text-cream-100/60"
            strokeWidth={1.75}
          />
        ) : (
          <ChevronDown
            className="h-4 w-4 shrink-0 text-cream-100/60"
            strokeWidth={1.75}
          />
        )}
      </button>

      {/* Panel déplié */}
      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Switcher d'espaces */}
          {switchableProfiles.length > 0 && (
            <>
              <p className="px-3 pt-1 text-[10px] font-semibold uppercase tracking-wider text-cream-100/50">
                Changer d&apos;espace
              </p>
              <ul className="space-y-0.5">
                {ALL_PROFILES.filter((p) =>
                  switchableProfiles.includes(p.kind),
                ).map((p) => {
                  const pmeta = PROFILE_META[p.kind];
                  const PIcon = pmeta.Icon;
                  return (
                    <li key={p.kind}>
                      <Link
                        href={p.href}
                        className="flex items-start gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-night-700/60"
                      >
                        <span
                          aria-hidden
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${pmeta.bg}`}
                        >
                          <PIcon
                            className={`h-3.5 w-3.5 ${pmeta.color}`}
                            strokeWidth={2}
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-white">
                            {p.labelFr}
                          </span>
                          <span className="block text-[10px] text-cream-100/60">
                            {p.descriptionFr}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* Actions */}
          <div className="border-t border-night-700/60 pt-2">
            <Link
              href={`/${locale}/${
                currentProfile === "PARTICULIER"
                  ? "p/account"
                  : currentProfile === "PRO"
                    ? "o/settings"
                    : "admin"
              }`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-cream-100/80 transition-colors hover:bg-night-700/60 hover:text-white"
            >
              <User className="h-3.5 w-3.5" strokeWidth={2} />
              Mon profil
            </Link>
            <Link
              href={resolvedSignOutHref}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
              Se déconnecter
            </Link>
          </div>
        </div>
      )}

      {/* Indicateur statut connecté en footer */}
      <div className="mt-3 flex items-center gap-1.5 px-3">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-forest-500"
        />
        <span className="text-[10px] uppercase tracking-wider text-cream-100/50">
          Connecté
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Composant version inline minimal pour pages publiques (header marketing)
// ────────────────────────────────────────────────────────────────────────────

export function HeaderAccountActions({
  locale,
  currentProfile,
  userIdentifier,
}: {
  locale: string;
  currentProfile?: ProfileKind;
  userIdentifier?: string;
}) {
  if (!currentProfile) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/auth/signin`}
          className="rounded-md border border-cream-300 px-3 py-1.5 text-sm font-semibold text-forest-900 hover:bg-cream-50"
        >
          Se connecter
        </Link>
        <Link
          href={`/${locale}/auth/signup`}
          className="rounded-md bg-forest-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-forest-800"
        >
          S&apos;inscrire
        </Link>
      </div>
    );
  }

  const meta = PROFILE_META[currentProfile];
  const Icon = meta.Icon;

  return (
    <Link
      href={
        currentProfile === "PARTICULIER"
          ? `/${locale}/p/dashboard`
          : currentProfile === "PRO"
            ? `/${locale}/o/projects`
            : `/${locale}/admin`
      }
      className="flex items-center gap-2 rounded-full border border-cream-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-forest-900 hover:border-forest-300 hover:bg-cream-50"
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full ${meta.bg}`}
      >
        <Icon
          className={`h-3 w-3 ${meta.color.replace("400", "700")}`}
          strokeWidth={2}
        />
      </span>
      <span>{userIdentifier ?? "Mon compte"}</span>
      <Check className="h-3 w-3 text-forest-600" strokeWidth={2.5} />
    </Link>
  );
}
