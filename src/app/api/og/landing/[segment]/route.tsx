// app/api/og/landing/[segment]/route.tsx
// OG image dynamique par segment de landing — édge runtime via next/og.
// Cache CDN 24h, 1200×630 (standard Open Graph).

import { ImageResponse } from "next/og";

export const runtime = "edge";

interface SegmentTheme {
  bgFrom: string;
  bgTo: string;
  label: string;
  title: string;
  subtitle: string;
}

const THEMES: Record<string, SegmentTheme> = {
  auditeurs: {
    bgFrom: "#0f766e", bgTo: "#134e4a",
    label: "Pour auditeurs énergétiques OPQIBI",
    title: "4 minutes au lieu de 4 heures",
    subtitle: "Audit conforme arrêté 4 mai 2022 · Hébergé en France",
  },
  diagnostiqueurs: {
    bgFrom: "#1d4ed8", bgTo: "#1e3a8a",
    label: "Pour diagnostiqueurs DPE certifiés AFNOR",
    title: "DPE collectif AFNOR en moins de temps",
    subtitle: "Méthode 3CL-DPE 2021 · Opposable juridiquement",
  },
  copropriete: {
    bgFrom: "#047857", bgTo: "#064e3b",
    label: "Pour syndics et conseils syndicaux",
    title: "Vote en AG en 1 semaine",
    subtitle: "Audit L 731-1 CCH · MaPrimeRénov' Copro intégré",
  },
  particuliers: {
    bgFrom: "#d97706", bgTo: "#92400e",
    label: "Pour propriétaires particuliers",
    title: "Combien vous coûteraient vos travaux ?",
    subtitle: "Calculez aides MaPrimeRénov' en 4 minutes · Gratuit",
  },
};

export async function GET(req: Request, ctx: { params: Promise<{ segment: string }> }) {
  const { segment } = await ctx.params;
  const theme = THEMES[segment] ?? THEMES.particuliers;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: `linear-gradient(135deg, ${theme.bgFrom} 0%, ${theme.bgTo} 100%)`,
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "20px", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.85 }}>
            {theme.label}
          </div>
          <h1 style={{ fontSize: "72px", fontWeight: 700, lineHeight: 1.1, margin: 0, fontFamily: "Source Serif Pro, Georgia, serif" }}>
            {theme.title}
          </h1>
          <p style={{ fontSize: "32px", lineHeight: 1.4, opacity: 0.9, margin: 0 }}>
            {theme.subtitle}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "28px", fontWeight: 700 }}>Réno·Calc Pro</div>
            <div style={{ fontSize: "18px", opacity: 0.8 }}>renocalcpro.fr</div>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255,255,255,0.15)",
            padding: "16px 24px",
            borderRadius: "12px",
            fontSize: "20px",
            fontWeight: 600,
          }}>
            🇫🇷 Hébergé en France · RGPD
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    },
  );
}
