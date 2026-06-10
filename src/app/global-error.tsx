"use client";
// app/global-error.tsx — Error boundary global (catch les erreurs hors layout).
// Doit déclarer son propre <html>/<body>.

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    import("../lib/observability/sentry")
      .then(m => m.captureError(error, { tags: { boundary: "global" } }))
      .catch(() => {/* noop */});
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#fafaf9", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 480, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontFamily: "Source Serif 4, Georgia, serif", fontSize: 28, fontWeight: 700, color: "#7c2d12", margin: 0 }}>
            🔥 Erreur critique
          </h1>
          <p style={{ marginTop: 16, color: "#57534e", lineHeight: 1.6 }}>
            Une erreur grave s'est produite et nous n'avons pas pu charger la page. Nos équipes ont été notifiées.
          </p>
          {error.digest && <p style={{ marginTop: 8, fontFamily: "monospace", fontSize: 12, color: "#a8a29e" }}>{error.digest}</p>}
          <button
            onClick={reset}
            style={{ marginTop: 24, padding: "12px 24px", borderRadius: 8, border: "none", background: "#0f766e", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Réessayer
          </button>
          <a href="/" style={{ marginLeft: 12, color: "#0f766e", textDecoration: "underline", fontSize: 14 }}>Accueil</a>
        </div>
      </body>
    </html>
  );
}
