import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Bundle analyzer optionnel : ANALYZE=true npm run build
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = (() => {
  try {
    const fn = require("@next/bundle-analyzer")({ enabled: process.env.ANALYZE === "true" });
    return fn as <T>(c: T) => T;
  } catch {
    return <T>(c: T) => c;
  }
})();

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// CSP unique par requête : un nonce signé est généré dans middleware.ts et
// injecté ici. On évite les `unsafe-inline` et `unsafe-eval` en production.
const securityHeaders = (isProd: boolean) => [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "camera=()",
      "geolocation=(self)",
      "gyroscope=()",
      "interest-cohort=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
  // CSP : on déclare la liste de base ; le middleware ajoute le nonce dynamique
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'strict-dynamic' 'nonce-__NEXT_CSP_NONCE__'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.s3.amazonaws.com https://*.io.cloud.ovh.net",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api-adresse.data.gouv.fr https://nominatim.openstreetmap.org https://api.anthropic.com",
      "media-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      isProd ? "upgrade-insecure-requests" : "",
    ].filter(Boolean).join("; "),
  },
];

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: { bodySizeLimit: "12mb" }, // pour upload photos
    typedRoutes: true,
    // Tree-shaking optimisation barrel imports (next-intl, lucide-react, etc.)
    optimizePackageImports: [
      "next-intl",
      "lucide-react",
      "@react-pdf/renderer",
      "date-fns",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.s3.amazonaws.com" },
      { protocol: "https", hostname: "**.io.cloud.ovh.net" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 an pour assets immuables
  },
  // Compile et minifie modern syntax pour les browsers récents (-15 à -25 % JS)
  swcMinify: true,
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        source: "/:path*",
        headers: securityHeaders(isProd),
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(config));
