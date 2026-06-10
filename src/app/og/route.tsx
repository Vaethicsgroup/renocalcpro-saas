// app/og/route.tsx — Open Graph dynamique via next/og (Edge runtime).
// Usage : <meta property="og:image" content="/og?title=Mon%20titre&subtitle=...&locale=fr" />

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Réno·Calc Pro";
  const subtitle = searchParams.get("subtitle") ?? "Audits & rapports premium pour particuliers et professionnels.";
  const locale = searchParams.get("locale") ?? "fr";

  const tagline: Record<string, string> = {
    fr: "Votre rénovation énergétique, chiffrée.",
    en: "Your energy renovation, actually quantified.",
    es: "Su renovación energética, cuantificada.",
    de: "Ihre energetische Sanierung, beziffert.",
    pt: "A sua renovação energética, quantificada.",
  };

  return new ImageResponse(
    (
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "100%", height: "100%",
        background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
        color: "#fafaf9", padding: 80, position: "relative",
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: -100, right: -100, width: 500, height: 500,
          background: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 60%)",
        }} />

        {/* Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14, background: "#fbbf24",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, fontWeight: 700, color: "#0f3a36",
          }}>R</div>
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.04em" }}>
            RÉNO·CALC PRO
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Titre principal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>
            {title}
          </span>
          <span style={{ fontSize: 32, color: "#fbbf24", fontWeight: 700, lineHeight: 1.2 }}>
            {tagline[locale] ?? tagline.fr}
          </span>
          <span style={{ fontSize: 24, color: "#d6f5f0", marginTop: 16 }}>
            {subtitle}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
