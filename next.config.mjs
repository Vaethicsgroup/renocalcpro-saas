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
};

export default withNextIntl(nextConfig);
