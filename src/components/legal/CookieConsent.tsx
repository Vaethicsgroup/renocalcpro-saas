"use client";
// components/legal/CookieConsent.tsx
// Banner cookies RGPD/CNIL-compliant.
//
// IMPORTANT — Réno·Calc Pro utilise actuellement :
//   - Plausible (analytics RGPD-safe sans cookies, pas besoin de consent)
//   - Cookies fonctionnels (auth NextAuth, langue, A/B variants) — consent NON requis (CNIL exemption)
//   - Pas de cookies marketing tiers (pas de Google Ads, Meta Pixel, etc.)
//
// Ce banner est donc un "soft consent" éducatif + toggle pour préférences avancées.
// Pré-coché sur "essentials only", l'utilisateur peut activer Plausible analytics anonyme.

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "renocal.cookie_consent";
const CONSENT_VERSION = "v1.2026-05";

interface ConsentChoice {
  version: string;
  essentials: true;       // toujours true (auth, lang) — non bloquables
  analytics: boolean;     // Plausible aggregated stats
  acceptedAt: string;
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setShow(true);
      return;
    }
    try {
      const choice = JSON.parse(stored) as ConsentChoice;
      if (choice.version !== CONSENT_VERSION) {
        setShow(true);  // re-demander si version changée
      }
    } catch {
      setShow(true);
    }
  }, []);

  function persist(choice: Omit<ConsentChoice, "version" | "acceptedAt">) {
    const full: ConsentChoice = {
      ...choice,
      essentials: true,
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));

    // Émettre un évènement custom pour les autres scripts (Plausible loader, etc.)
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: full }));

    setShow(false);
  }

  function acceptAll() {
    persist({ essentials: true, analytics: true });
  }

  function rejectAnalytics() {
    persist({ essentials: true, analytics: false });
  }

  function customize() {
    persist({ essentials: true, analytics });
  }

  if (!show) return null;

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-teal-700 bg-white p-4 shadow-2xl"
    >
      <div className="mx-auto max-w-5xl">
        {!showCustomize ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <h2 id="cookie-consent-title" className="text-base font-semibold text-stone-900">
                🍪 Vos préférences cookies
              </h2>
              <p className="mt-1 text-sm text-stone-700">
                Nous utilisons uniquement des cookies <strong>essentiels</strong> (auth, langue, A/B testing) et optionnellement des stats <strong>anonymes Plausible</strong> hébergées en France.
                Pas de Google Analytics, pas de Meta Pixel, pas de cookies marketing tiers.
              </p>
              <p className="mt-1 text-xs text-stone-600">
                Détails : <Link href="/fr/legal/cookies" className="font-semibold text-teal-700 hover:underline">Politique cookies</Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={rejectAnalytics}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Essentiels uniquement
              </button>
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Personnaliser
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Accepter tout
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-base font-semibold text-stone-900">Personnaliser mes préférences</h2>
            <p className="mt-1 text-sm text-stone-600">
              Notre approche : minimum cookies, max transparence. Aucun cookie tiers, aucun tracking publicitaire.
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">Essentiels (obligatoires)</h3>
                    <p className="mt-1 text-xs text-stone-600">
                      Authentification (NextAuth), langue préférée, A/B testing variant. Pas blocables (sinon le service ne fonctionne pas).
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-stone-200 px-2 py-1 text-xs font-semibold text-stone-700">
                    Toujours actifs
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={e => setAnalytics(e.target.checked)}
                    className="mt-1 accent-teal-700"
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">Analytics anonymes (Plausible)</h3>
                    <p className="mt-1 text-xs text-stone-600">
                      Agrégation anonyme des visites pour comprendre quelles pages sont utilisées. Hébergé en France, sans cookies tiers, conforme RGPD sans consent obligatoire.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={customize}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Sauvegarder mes préférences
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
