// src/components/auth/DemoAdminToggle.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bouton client qui active/désactive le mode démo admin par cookie.
//
// Aucun appel réseau, aucun server action, aucun stockage serveur. Le cookie
// est posé via `document.cookie` côté navigateur. Le serveur (admin.ts /
// admin layout) le détectera au prochain refresh / navigation.
//
// L'état initial est lu depuis le cookie au mount (pour éviter le mismatch
// hydration on commence en "loading", puis on bascule en "active"/"inactive"
// dans un useEffect).
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Power, Check, X, RotateCcw, AlertTriangle } from "lucide-react";

interface Props {
  /** Lien direct vers /admin une fois activé. */
  locale: string;
  /** Affiche un message si l'environnement n'autorise pas le mode démo. */
  disabledByEnv: boolean;
}

const COOKIE_NAME = "renocalc.demo_admin";
const COOKIE_VALUE = "1";
const COOKIE_MAX_AGE = 60 * 60; // 1 h

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const target = name + "=";
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return trimmed.slice(target.length);
  }
  return null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  // SameSite=Lax pour cohérence avec navigations classiques. Pas de Secure
  // explicite : staging http doit fonctionner. Path=/ pour que toutes les
  // routes admin le voient.
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

type Status = "loading" | "active" | "inactive";

export function DemoAdminToggle({ locale, disabledByEnv }: Props) {
  const router = useRouter();
  const t = useTranslations("demoAdmin");
  const [status, setStatus] = useState<Status>("loading");
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    const value = readCookie(COOKIE_NAME);
    setStatus(value === COOKIE_VALUE ? "active" : "inactive");
  }, []);

  const handleActivate = () => {
    if (disabledByEnv) return;
    setActionPending(true);
    setCookie(COOKIE_NAME, COOKIE_VALUE, COOKIE_MAX_AGE);
    setStatus("active");
    // Refresh server components pour que requireAdmin re-lit le cookie
    router.refresh();
    setActionPending(false);
  };

  const handleDeactivate = () => {
    setActionPending(true);
    deleteCookie(COOKIE_NAME);
    setStatus("inactive");
    router.refresh();
    setActionPending(false);
  };

  if (disabledByEnv) {
    return (
      <div className="rounded-xl border border-stone-300 bg-stone-50 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-200 text-stone-600">
            <AlertTriangle className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-stone-800">
              {t("toggleDisabledTitle")}
            </p>
            <p className="mt-1 text-xs text-stone-600">
              {t.rich("toggleDisabledDesc", {
                code: (chunks) => (
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-forest-700 ring-1 ring-stone-200">
                    {chunks}
                  </code>
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-xl border border-cream-300 bg-white p-4">
        <p className="text-sm text-stone-500">{t("toggleLoading")}</p>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
              <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-900">
                {t("toggleActiveTitle")}
              </p>
              <p className="mt-1 text-xs text-emerald-900/85">
                {t("toggleActiveDesc")}
              </p>
            </div>
          </div>
        </div>

        <a
          href={`/${locale}/admin`}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-forest-800"
        >
          <Power className="h-4 w-4" strokeWidth={2} aria-hidden />
          {t("openAdmin")}
        </a>

        <button
          type="button"
          onClick={handleDeactivate}
          disabled={actionPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 disabled:opacity-60"
        >
          <X className="h-4 w-4" strokeWidth={2} aria-hidden />
          {t("toggleDeactivate")}
        </button>
      </div>
    );
  }

  // status === "inactive"
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleActivate}
        disabled={actionPending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-60"
      >
        <Power className="h-4 w-4" strokeWidth={2} aria-hidden />
        {t("toggleActivate")}
      </button>
      <p className="text-[11px] leading-relaxed text-stone-500">
        {t.rich("toggleHint", {
          code: (chunks) => (
            <code className="rounded bg-cream-50 px-1 py-0.5 font-mono text-[10px] ring-1 ring-cream-300">
              {chunks}
            </code>
          ),
        })}
      </p>
    </div>
  );
}

/**
 * Petit bouton « Renouveler » à utiliser à côté du bandeau watermark dans
 * /admin pour réinitialiser le compteur d'expiration sans repasser par la
 * page admin-demo.
 */
export function DemoAdminRefreshButton() {
  const router = useRouter();
  const t = useTranslations("demoAdmin");
  const handleRenew = () => {
    setCookie(COOKIE_NAME, COOKIE_VALUE, COOKIE_MAX_AGE);
    router.refresh();
  };
  return (
    <button
      type="button"
      onClick={handleRenew}
      title={t("bannerRenewTitle")}
      className="inline-flex h-7 items-center gap-1 rounded-md bg-white/15 px-2 text-[11px] font-semibold text-amber-100 ring-1 ring-amber-200/30 transition hover:bg-white/25"
    >
      <RotateCcw className="h-3 w-3" strokeWidth={2} aria-hidden />
      {t("bannerRenew")}
    </button>
  );
}

export function DemoAdminExitButton() {
  const router = useRouter();
  const t = useTranslations("demoAdmin");
  const handleExit = () => {
    deleteCookie(COOKIE_NAME);
    router.refresh();
  };
  return (
    <button
      type="button"
      onClick={handleExit}
      className="inline-flex h-7 items-center gap-1 rounded-md bg-white/15 px-2 text-[11px] font-semibold text-amber-100 ring-1 ring-amber-200/30 transition hover:bg-white/25"
    >
      <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      {t("bannerExit")}
    </button>
  );
}
