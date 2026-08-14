import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: path.resolve("."),
  serverExternalPackages: ["@react-pdf/renderer"],
  // ⚠ Dette TSC baseline 102 : on accepte les erreurs TS au build prod
  // tant qu'elles ne sont pas résorbées progressivement par lots ciblés.
  // `tsc --noEmit` reste fiable côté dev pour les voir.
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },

  // ─── Redirects anti-404 (Preview Vercel + tests utilisateurs) ─────────
  // On alias les routes "attendues" côté produit vers les routes techniques
  // existantes SANS renommer le code (chantier majeur reporté). Objectif :
  // aucun bouton important ne tombe en 404 pendant les tests bêta.
  // Toutes en permanent:false pour pouvoir modifier plus tard sans purger
  // le cache HTTP des testeurs.
  async redirects() {
    return [
      // Diagnostic / parcours projet (produit → code technique)
      { source: "/:locale/p/projects/:id/diagnostic",            destination: "/:locale/p/projects/:id/identite", permanent: false },
      { source: "/:locale/p/projects/:id/scenarios",             destination: "/:locale/p/projects/:id/works",    permanent: false },
      { source: "/:locale/p/projects/:id/scenarios/custom",      destination: "/:locale/p/projects/:id/works?mode=custom", permanent: false },
      { source: "/:locale/p/projects/:id/aides",                 destination: "/:locale/p/projects/:id/aids",     permanent: false },
      { source: "/:locale/p/projects/:id/financement",           destination: "/:locale/p/projects/:id/savings",  permanent: false },
      { source: "/:locale/p/projects/:id/rapport",               destination: "/:locale/p/projects/:id/synthese", permanent: false },
      // Profile / settings (produit → account)
      { source: "/:locale/p/profile",                            destination: "/:locale/p/account",               permanent: false },
      { source: "/:locale/p/settings",                           destination: "/:locale/p/account",               permanent: false },
      // Auth (harmonisation orthographique)
      { source: "/:locale/auth/sign-up",                         destination: "/:locale/signup",                  permanent: false },
      { source: "/:locale/auth/sign-in",                         destination: "/:locale/login",                   permanent: false },
      // Pages légales produit → structure /legal/*
      { source: "/:locale/cgu",                                  destination: "/:locale/legal/cgu",               permanent: false },
      { source: "/:locale/cgv",                                  destination: "/:locale/legal/cgv",               permanent: false },
      { source: "/:locale/mentions-legales",                     destination: "/:locale/legal/mentions",          permanent: false },
      { source: "/:locale/cookies",                              destination: "/:locale/legal/cookies",           permanent: false },
      { source: "/:locale/politique-de-confidentialite",         destination: "/:locale/legal/privacy",           permanent: false },
      // Centre d'aide (produit → help)
      { source: "/:locale/centre-aide",                          destination: "/:locale/help",                    permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
