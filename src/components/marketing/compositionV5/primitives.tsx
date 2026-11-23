// Primitives visuelles V5 — device frames + mockup image placeholders + icônes.
// Toutes sont des composants React purs, sans dépendance hors @/lib/utils
// et next/image. Les ombres et espacements utilisent les tokens Tailwind
// existants (forest-*, night-*, cream-*, stone-*, shadow-floating, etc.).

"use client";

import * as React from "react";
import NextImage from "next/image";
import { cn } from "@/lib/utils";

/* ─────────────────────────────── Device frames ─────────────────────────────── */

export function LaptopFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* Bezel écran */}
      <div className="rounded-t-[18px] rounded-b-[6px] bg-[#141816] p-[14px_14px_20px] shadow-floating">
        {/* Camera */}
        <div
          aria-hidden
          className="absolute top-[6px] left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[#2A2E2A] ring-1 ring-black"
        />
        {/* Écran */}
        <div className="h-[650px] overflow-hidden rounded-[6px] bg-cream-50 flex">
          {children}
        </div>
      </div>
      {/* Charnière + socle */}
      <div className="mx-10 -mt-[5px] h-[10px] rounded-b-[8px] bg-gradient-to-b from-[#1E2420] to-[#0E1210]" />
      <div className="relative -mx-5 h-6 rounded-b-[24px] bg-gradient-to-b from-[#D7D4CF] via-[#B8B4AC] to-[#9A9690]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[10px] w-40 rounded-b-xl bg-[#86847E]" />
      </div>
    </div>
  );
}

export function TabletFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl bg-[#141816] p-[18px] shadow-floating", className)}>
      <div className="rounded-xl bg-cream-50 p-6 relative overflow-hidden">{children}</div>
    </div>
  );
}

export function PhoneFrame({
  children, className, rotate,
}: { children: React.ReactNode; className?: string; rotate?: number }) {
  return (
    <div
      className={cn("rounded-[36px] bg-[#141816] p-2.5 shadow-floating", className)}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    >
      <div className="relative rounded-[28px] bg-cream-50 px-4 pt-[30px] pb-5">
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-6 w-[90px] rounded-[14px] bg-[#141816]" />
        {children}
      </div>
    </div>
  );
}

/* ────────────────────────────── Asset placeholder ────────────────────────────── */
/*
 * Permet de remplacer sans friction par des photos finales.
 * src=null : affiche un dégradé plausible (ex: maison verte, copro beige,
 *            tertiaire bleu-gris) avec le hint data-asset visible en overlay.
 * src=string : rend via next/image avec les mêmes dimensions.
 */

const THEME_GRADIENTS: Record<string, string> = {
  maison:    "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(30,50,25,.55) 100%), linear-gradient(135deg, #B5CBA3 0%, #7D9E6A 45%, #5B7B4E 100%)",
  copro:     "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(40,35,25,.55) 100%), linear-gradient(135deg, #D1C5A8 0%, #A8997E 50%, #827459 100%)",
  tertiaire: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(20,30,45,.55) 100%), linear-gradient(135deg, #BFC8D1 0%, #8792A1 50%, #5B6775 100%)",
  material:  "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(60,25,15,.55) 100%), linear-gradient(135deg, #B35A3A 0%, #8A3A20 50%, #6A2A14 100%)",
  nature:    "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(40,70,40,.55) 100%), linear-gradient(135deg, #CFDDBB 0%, #7FAE64 50%, #4A6B3A 100%)",
};

export function AssetImage({
  src, alt, hint, theme = "maison", className, children, priority,
}: {
  src?: string | null;
  alt?: string;
  hint: string;                                 // data-asset (ex: "PHOTO · maison Lyon")
  theme?: keyof typeof THEME_GRADIENTS;
  className?: string;
  children?: React.ReactNode;                   // ex: overlay badge ("⌂ Maison")
  priority?: boolean;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <NextImage
          src={src}
          alt={alt ?? hint}
          fill
          sizes="(min-width: 1280px) 480px, 100vw"
          className="object-cover"
          priority={priority}
        />
        {children ? <div className="relative z-10 flex items-end h-full p-3">{children}</div> : null}
      </div>
    );
  }
  return (
    <div
      className={cn("relative overflow-hidden flex items-end p-3", className)}
      data-asset={hint}
      role="img"
      aria-label={alt ?? hint}
      style={{ background: THEME_GRADIENTS[theme] }}
    >
      <span className="absolute top-2 right-2 z-10 rounded bg-black/30 px-1.5 py-0.5 font-mono text-[9px] tracking-[1px] text-white/70">
        {hint}
      </span>
      {children}
    </div>
  );
}

/* ─────────────────────────────── Icônes SVG inline ─────────────────────────────── */
/* Jeu réduit pour la composition V5. Les icônes produit utilisent lucide-react
   dans le reste de l'app ; ici on reste autonome. */

type IconProps = { className?: string };
const strokeDefaults = "stroke-current fill-none stroke-[1.6]";

export const IconEnergy = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-5 w-5", strokeDefaults, p.className)}><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
export const IconScenarios = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-5 w-5", strokeDefaults, p.className)}><path d="M3 7 L12 2 L21 7 L12 12 Z M3 12 L12 17 L21 12 M3 17 L12 22 L21 17"/></svg>
);
export const IconAnalytics = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-5 w-5", strokeDefaults, p.className)}><path d="M3 21 h18 M6 17 V9 M11 17 V5 M16 17 V11"/></svg>
);
export const IconReport = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-5 w-5", strokeDefaults, p.className)}><path d="M6 2 h9 l5 5 v15 H6 Z M14 2 v6 h6 M9 13 h6 M9 17 h6"/></svg>
);
export const IconHome = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><path d="M3 21 h18 M4 21 V9 l8-6 8 6 V21"/></svg>
);
export const IconLeaf = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><path d="M12 2 C7 7 4 10 4 14 a8 8 0 0 0 16 0 c0 -4 -3 -7 -8 -12 z"/></svg>
);
export const IconCO2 = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><circle cx="12" cy="12" r="9"/><path d="M8 13 h8 M12 9 c-2 0 -3 1 -3 3 s1 3 3 3 c1 0 2 0 2 -1"/></svg>
);
export const IconEuro = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><circle cx="12" cy="12" r="9"/><path d="M12 7 v10 M9 14 c0 1.5 1.3 2 3 2 s3 -0.5 3 -2 s-1.3 -1.5 -3 -2 s-3 -0.5 -3 -2 s1.3 -2 3 -2 s3 0.5 3 2"/></svg>
);
export const IconSearch = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", strokeDefaults, "stroke-[2]", p.className)}><circle cx="11" cy="11" r="7"/><path d="M20 20 l-4 -4"/></svg>
);
export const IconBell = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", strokeDefaults, p.className)}><path d="M18 8 A6 6 0 0 0 6 8 c0 7 -3 9 -3 9 h18 s-3 -2 -3 -9 M13.7 21 a2 2 0 0 1 -3.4 0"/></svg>
);
export const IconPlus = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-3 w-3", strokeDefaults, "stroke-[2.4]", p.className)}><path d="M12 5 v14 M5 12 h14"/></svg>
);
export const IconCheck = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-3 w-3", strokeDefaults, "stroke-[2.4]", p.className)}><polyline points="20 6 9 17 4 12"/></svg>
);
export const IconDownload = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", strokeDefaults, "stroke-[2]", p.className)}><path d="M12 3 v12 M6 10 l6 6 l6 -6 M4 20 h16"/></svg>
);

/* Mini icônes du nav sidebar laptop */
export const NavDashboard = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
);
export const NavProjects = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><path d="M3 7 h18 M3 12 h18 M3 17 h18"/></svg>
);
export const NavNewProject = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><path d="M12 5 v14 M5 12 h14"/></svg>
);
export const NavBuilding = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><path d="M3 21 h18 M4 21 V9 l8-6 8 6 V21 M10 21 V13 h4 v8"/></svg>
);
export const NavEnvelope = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9 h18 M9 3 v18"/></svg>
);
export const NavSystems = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><circle cx="12" cy="12" r="3"/><path d="M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4"/></svg>
);
export const NavWorks = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><path d="M14 2 l6 6 l-10 10 l-6 1 l1 -6 z"/></svg>
);
export const NavScenarios = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><path d="M3 12 h3 l2-5 l4 10 l2-5 h7"/></svg>
);
export const NavResults = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><rect x="3" y="13" width="4" height="8" rx="0.5"/><rect x="10" y="8" width="4" height="13" rx="0.5"/><rect x="17" y="3" width="4" height="18" rx="0.5"/></svg>
);
export const NavReports = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={cn("h-4 w-4", strokeDefaults, p.className)}><path d="M6 2 h9 l5 5 v15 H6 Z M14 2 v6 h6"/></svg>
);

/* Mini icônes form params */
export const IconWall   = (p: IconProps) => <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", strokeDefaults, p.className)}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>;
export const IconRoof   = (p: IconProps) => <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", strokeDefaults, p.className)}><path d="M3 10 L12 3 L21 10 V21 H3 Z"/></svg>;
export const IconWindow = (p: IconProps) => <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", strokeDefaults, p.className)}><rect x="3" y="3" width="18" height="18"/><path d="M12 3 v18 M3 12 h18"/></svg>;
export const IconFloor  = (p: IconProps) => <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", strokeDefaults, p.className)}><path d="M3 18 h18 M5 18 V8 h14 V18 M9 18 V12 M15 18 V12"/></svg>;
export const IconThermal= (p: IconProps) => <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", strokeDefaults, p.className)}><circle cx="12" cy="12" r="8"/><path d="M12 8 v8 M8 12 h8"/></svg>;
