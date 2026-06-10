// tailwind.config.ts — RENOCALCPRO Design System v4.0 « Energy Trust »
// ────────────────────────────────────────────────────────────────────────────
// Direction visuelle : "Energy Trust" — outil pro d'audit énergétique premium.
//   - fond chaud et clair (cream très pâle)
//   - texte principal bleu nuit (#102A43)
//   - sidebar / nav en bleu nuit profond (#06213D / #0A2E52)
//   - vert énergie #00A86B pour CTAs primaires et succès
//   - orange solaire #FF8A00 pour CTAs commerciaux forts (Pro / upgrade)
//   - bleu premium #2563EB pour confirmations / liens contextuels
//   - bordures douces #E7DDCC
//   - cards blanches contrastées
//   - DPE/GES préservés réglementaires (palette spec)
//
// STRATÉGIE DE PROPAGATION :
//   Tous les noms de scale existants (forest, teal, cream, sage, stone, copper,
//   terracotta, amber, info, slate, success, warning, error, dpe) sont
//   PRÉSERVÉS. On ne renomme RIEN. On REtinte chaque scale pour qu'elle pointe
//   vers la nouvelle palette « Energy Trust ». Les ~1000+ classes existantes
//   héritent automatiquement de la nouvelle DA sans qu'aucune page n'ait à
//   être modifiée.
//
// NOUVELLE SCALE : `night` (#06213D etc.) pour sidebar Pro/Admin.
// Les composants sidebar foncés migrent explicitement vers `night-*`.
//
// Compat 100% : aucun nom de classe supprimé.

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // ════════════════════════════════════════════════════════════════════
        // FOREST — vert énergie scale (CTA primaire, succès, accents brand)
        // Centre : 600 = #00A86B (Energy Green), 800 = #006B4F (forest moderne)
        // ════════════════════════════════════════════════════════════════════
        // NOTE : 50-700 = scale verte énergie (CTA + accents).
        //        800 = vert forêt moderne #006B4F (hover CTA + accents profonds).
        //        900 = bleu nuit #102A43 — sert au TEXTE PRINCIPAL et aux
        //              overlays sombres premium (text-forest-900 ~225 usages
        //              déjà en place dans le code = headings/body, propagés).
        //        950 = bleu nuit profond #06213D pour les contrastes extrêmes
        //              (sidebar deep, backdrop modal). C'est volontaire que
        //              900/950 « basculent » vers le bleu : le scale forest
        //              porte à la fois la couleur de marque (vert énergie) et
        //              le ton sombre éditorial (bleu nuit), sans renommer
        //              aucune classe existante.
        forest: {
          50:  "#f0fbf6",   // wash très pâle
          100: "#dcf3e5",   // hover doux
          200: "#bae5ca",   // border subtle
          300: "#8ad2a7",   // border marqué / focus light
          400: "#4fbc83",   // focus ring
          500: "#1fb57f",   // mid energy
          600: "#00a86b",   // ← PRIMARY (CTA, badges succès)
          700: "#009160",   // ← anciennement primary, vert profond CTA
          800: "#006b4f",   // ← Forest moderne (CTA hover, accents profonds)
          900: "#102a43",   // ← BLEU NUIT TEXTE (spec : titres bleu nuit)
          950: "#06213d",   // ← BLEU NUIT PROFOND (sidebar deep, backdrop)
        },

        // ════════════════════════════════════════════════════════════════════
        // NIGHT — bleu nuit scale (NOUVELLE) pour sidebar / nav / surfaces
        // sombres premium. Réservé aux composants sidebar/nav et accents
        // « expert ».
        // ════════════════════════════════════════════════════════════════════
        night: {
          50:  "#e8eef5",
          100: "#c6d4e3",
          200: "#93afcb",
          300: "#5784ae",
          400: "#2a5a89",
          500: "#173e68",
          600: "#0f315a",
          700: "#0a2e52",   // ← sidebar dark (spec)
          800: "#06213d",   // ← sidebar profond (spec)
          900: "#03152a",
          950: "#010a1a",
        },

        // ════════════════════════════════════════════════════════════════════
        // CREAM — fonds chauds et bordures douces
        // ════════════════════════════════════════════════════════════════════
        cream: {
          50:  "#fffdf7",   // ← BG MAIN (spec : fond principal)
          100: "#f6f0e4",   // ← BG SECONDAIRE (spec)
          200: "#ede3d0",   // hover doux
          300: "#e7ddcc",   // ← BORDER DOUCE (spec)
          400: "#d9cbab",   // border marqué
          500: "#b8a57b",   // border fort
          600: "#8a7b5a",
          700: "#5e5440",
          800: "#3f3a2e",
          900: "#2a2620",
        },

        // ════════════════════════════════════════════════════════════════════
        // STONE — neutres TEXTE/BORDER retintés vers bleu nuit (Energy Trust)
        // 900 = #102A43 (texte principal spec), 600 = #52616B (texte secondaire)
        // Compat 100% : toutes les classes text-stone-*, bg-stone-*, border-stone-*
        // héritent du nouveau ton.
        // ════════════════════════════════════════════════════════════════════
        stone: {
          50:  "#fffdf7",   // ≡ cream-50 (bg main)
          100: "#f6f0e4",   // ≡ cream-100 (bg secondaire)
          200: "#e7ddcc",   // ≡ border douce
          300: "#cdc4b3",   // border marqué
          400: "#9ca3af",   // icônes muted
          500: "#6b7785",   // texte muted
          600: "#52616b",   // ← TEXTE SECONDAIRE (spec)
          700: "#2d3e50",   // headings legacy
          800: "#1a2b40",
          900: "#102a43",   // ← TEXTE PRINCIPAL (spec)
          950: "#061528",
        },

        // ════════════════════════════════════════════════════════════════════
        // LEGACY REMAP — teal/sage/copper conservés pour compat
        // teal = alias de forest (CTA primaire), sage = alias de cream (bg
        // chaud), copper = alias de terracotta (orange solaire).
        // ════════════════════════════════════════════════════════════════════
        // Alias 1:1 de forest pour compat legacy (toutes les classes teal-*
        // héritent des mêmes tons que forest-*, y compris 900/950 en bleu nuit).
        teal: {
          50:  "#f0fbf6",
          100: "#dcf3e5",
          200: "#bae5ca",
          300: "#8ad2a7",
          400: "#4fbc83",
          500: "#1fb57f",
          600: "#00a86b",
          700: "#009160",   // ex-CTA primaire (vert profond)
          800: "#006b4f",   // ex-CTA hover (vert forêt moderne)
          900: "#102a43",   // bleu nuit (texte / dark surfaces)
          950: "#06213d",   // bleu nuit profond
        },
        sage: {
          50:  "#fffdf7",
          100: "#f6f0e4",
          200: "#ede3d0",
          300: "#e7ddcc",
          400: "#d9cbab",
          500: "#b8a57b",
          600: "#8a7b5a",
          700: "#5e5440",
          800: "#3f3a2e",
          900: "#2a2620",
        },
        copper: {
          50:  "#fff6ec",
          100: "#ffe5c8",
          200: "#ffcb97",
          300: "#ffae63",
          400: "#ff9636",
          500: "#ff8a00",
          600: "#e67600",
          700: "#b85c00",
          800: "#8c4500",
          900: "#5e2e00",
        },

        // ════════════════════════════════════════════════════════════════════
        // SLATE — neutres bleus retintés vers night scale (pages admin)
        // ════════════════════════════════════════════════════════════════════
        slate: {
          50:  "#f1f4f8",
          100: "#dbe2ec",
          200: "#b4c2d2",
          300: "#8aa0b8",
          400: "#5c7a98",
          500: "#3a5777",
          600: "#234060",
          700: "#173e68",
          800: "#0f315a",
          900: "#0a2e52",
          950: "#06213d",
        },

        // ════════════════════════════════════════════════════════════════════
        // TERRACOTTA — orange solaire (CTA commerciaux : upgrade, Pro, offre)
        // 500/600 = #FF8A00 / #E67600 (spec exact)
        // ════════════════════════════════════════════════════════════════════
        terracotta: {
          50:  "#fff6ec",
          100: "#ffe5c8",
          200: "#ffcb97",
          300: "#ffae63",
          400: "#ff9636",
          500: "#ff8a00",   // ← CTA upgrade (spec)
          600: "#e67600",   // ← CTA hover (spec)
          700: "#b85c00",
          800: "#8c4500",
          900: "#5e2e00",
          950: "#3e1e00",
        },

        // Solar = alias explicite de terracotta (sémantique CTA orange)
        solar: {
          50:  "#fff6ec",
          100: "#ffe5c8",
          500: "#ff8a00",
          600: "#e67600",
          700: "#b85c00",
        },

        // ════════════════════════════════════════════════════════════════════
        // AMBER — warning et accents tièdes (distinct de solar pour clarté)
        // 500 = #F59E0B (warning spec)
        // ════════════════════════════════════════════════════════════════════
        amber: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",   // ← warning spec
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },

        // ════════════════════════════════════════════════════════════════════
        // ÉTATS SÉMANTIQUES
        // ════════════════════════════════════════════════════════════════════
        success: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",   // ← spec
          700: "#15803d",
          800: "#166534",
        },
        warning: {
          50:  "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",   // ← spec
          600: "#d97706",
          700: "#b45309",
        },
        error: {
          50:  "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",   // ← spec (danger / passoire)
          600: "#dc2626",
          700: "#b91c1c",
        },
        info: {
          50:  "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",   // ← spec (bleu premium)
          700: "#1d4ed8",
        },

        // ════════════════════════════════════════════════════════════════════
        // DPE / GES — palette réglementaire PRÉSERVÉE (lecture experte)
        // ════════════════════════════════════════════════════════════════════
        dpe: {
          a: "#2d7a3e",
          b: "#5ba13f",
          c: "#a9c440",
          d: "#f4d03f",
          e: "#f5ab35",
          f: "#e8763f",
          g: "#c7402e",
        },

        // ════════════════════════════════════════════════════════════════════
        // SHADCN TOKENS — CSS vars (cf. globals.css)
        // ════════════════════════════════════════════════════════════════════
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Source Serif 4", "Georgia", "serif"],
        sans:  ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono:  ["var(--font-mono)", "JetBrains Mono", "Menlo", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        "3xs": ["0.5rem",   { lineHeight: "0.75rem" }],
      },
      borderRadius: {
        "lg":  "12px",
        "xl":  "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        // Ombres premium teintées bleu nuit (more "Energy Trust" feel)
        "soft":     "0 1px 2px rgba(16, 42, 67, .05), 0 1px 1px rgba(16, 42, 67, .03)",
        "elevated": "0 4px 14px rgba(16, 42, 67, .07), 0 2px 4px rgba(16, 42, 67, .04)",
        "floating": "0 18px 44px rgba(16, 42, 67, .12), 0 4px 10px rgba(16, 42, 67, .05)",
        "card":     "0 1px 3px rgba(16, 42, 67, .05), 0 1px 2px rgba(16, 42, 67, .03)",
        "ring":     "0 0 0 3px rgba(0, 168, 107, .22)",   // green energy ring
        "ring-solar": "0 0 0 3px rgba(255, 138, 0, .22)",
      },
      keyframes: {
        "fade-in":   { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up":  {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in":    "fade-in 200ms ease-out",
        "slide-up":   "slide-up 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "shimmer":    "shimmer 2s linear infinite",
      },
      backgroundImage: {
        "shimmer":         "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
        // Hero / sections : très clair, énergie discrète
        "hero-gradient":   "linear-gradient(180deg, #fffdf7 0%, #f6f0e4 100%)",
        "section-cream":   "linear-gradient(180deg, #fffdf7 0%, #f6f0e4 100%)",
        // Brand : vert énergie pour CTA "wow"
        "forest-gradient": "linear-gradient(135deg, #00a86b 0%, #006b4f 100%)",
        // Sidebar : bleu nuit pour surfaces sombres premium
        "night-gradient":  "linear-gradient(180deg, #0a2e52 0%, #06213d 100%)",
        // CTA upgrade orange solaire
        "solar-gradient":  "linear-gradient(135deg, #ff8a00 0%, #e67600 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
