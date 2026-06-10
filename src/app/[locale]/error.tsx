"use client";
// app/[locale]/error.tsx — 500 brandée multilingue + capture Sentry.

import { useEffect } from "react";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    // Capture Sentry — wrapper auto-detect mode MOCK
    import("../../lib/observability/sentry")
      .then(m => m.captureError(error, { tags: { boundary: "route" } }))
      .catch(() => {/* fail silently */});
  }, [error]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md text-center">
        <svg viewBox="0 0 200 140" className="mx-auto h-40 w-56" aria-hidden role="img">
          <circle cx="100" cy="70" r="58" fill="#fef3c7" />
          <text x="100" y="88" textAnchor="middle" fontSize="40" fontWeight="700" fill="#a16207" fontFamily="Source Serif 4, Georgia, serif">⚠</text>
        </svg>

        <h1 className="mt-6 font-serif text-3xl font-bold text-amber-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Oups, une erreur s'est produite
        </h1>
        <p className="mt-3 text-stone-600">
          Nous avons été notifiés et nous travaillons à la corriger. Vous pouvez réessayer ou retourner à l'accueil.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-stone-400">Code erreur : {error.digest}</p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="rounded-lg bg-teal-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="rounded-lg border-2 border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            ← Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
