// Logo.tsx — Logo officiel RENOCALCPRO (Sprint v2.4)
// Reproduit fidèlement le logo fourni : maison + histogramme + flèche montante.
// Couleurs DA v4.0 Energy Trust : bleu nuit #102A43 + vert énergie #00A86B.
// 3 variantes : `full` (icon + wordmark + tagline), `wordmark` (icon + wordmark), `icon`.

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "wordmark" | "icon";
type LogoTheme = "dark" | "light"; // dark = vert sur clair · light = blanc sur vert

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  className?: string;
  href?: string;
  withTagline?: boolean;
}

export function LogoIcon({
  className,
  theme = "dark",
}: { className?: string; theme?: LogoTheme }) {
  // DA Energy Trust : logo bleu nuit + vert énergie (spec).
  //   theme=dark  : silhouette bleu nuit #102A43, accents vert énergie #00A86B.
  //   theme=light : silhouette blanche, accents vert énergie clair #4FBC83
  //                 (utilisé sur fond sombre, ex: sidebars night).
  const darkColor = theme === "dark" ? "#102A43" : "#FFFFFF";
  const lightColor = theme === "dark" ? "#00A86B" : "#4FBC83";

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10", className)}
      aria-hidden="true"
    >
      {/* Silhouette maison (toit + base) — vert foncé */}
      <path
        d="M8 32 L32 12 L56 32 L56 54 L8 54 Z"
        fill="none"
        stroke={darkColor}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Histogramme intérieur — 3 barres croissantes */}
      <rect x="18" y="42" width="6" height="10" fill={darkColor} rx="1" />
      <rect x="28" y="36" width="6" height="16" fill={lightColor} rx="1" />
      <rect x="38" y="30" width="6" height="22" fill={lightColor} rx="1" />
      {/* Flèche montante diagonale */}
      <path
        d="M16 38 L46 18"
        stroke={lightColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M40 16 L46 18 L44 24"
        fill="none"
        stroke={lightColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  variant = "wordmark",
  theme = "dark",
  className,
  href = "/",
  withTagline = false,
}: LogoProps) {
  // DA Energy Trust : bleu nuit + vert énergie (spec).
  const darkColor = theme === "dark" ? "#102A43" : "#FFFFFF";
  const lightColor = theme === "dark" ? "#00A86B" : "#4FBC83";

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoIcon theme={theme} className="h-9 w-9 shrink-0" />
      {variant !== "icon" && (
        <span className="inline-flex flex-col leading-none">
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: darkColor }}
          >
            RENO
            <span style={{ color: lightColor }}>CALC</span>
            PRO
          </span>
          {(variant === "full" || withTagline) && (
            <span
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: darkColor, opacity: 0.85 }}
            >
              Calculate · Optimise · Renovate
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="RENOCALCPRO — accueil">
        {content}
      </Link>
    );
  }
  return content;
}

export default Logo;
