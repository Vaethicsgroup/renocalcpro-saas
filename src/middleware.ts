// src/middleware.ts
// Middleware Next.js — chaîne next-intl + sécurité (nonce CSP, rate-limit, auth gate).
// Tourne avant chaque request RSC ou route handler.

import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { rateLimitForPath } from "./lib/security/rateLimit";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Génère un nonce cryptographiquement fort pour la CSP (chaque requête).
function generateNonce(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf));
}

// Routes publiques (pas de check d'auth). Sans préfixe locale ; on strippe avant test.
// v2.5 — élargie pour matcher la structure réelle App Router et éviter les 404.
const PUBLIC_PATHS = [
  "/",
  // API
  "/api/health",
  "/api/auth",
  "/api/webhooks",
  "/api/v1",
  "/api/og",
  // Auth (nouvelle structure /auth/*)
  "/auth",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  // Aliases legacy
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  // Onboarding (gated soft : accessible sans auth pour démo)
  "/onboarding",
  // Pages publiques marketing
  "/fonctionnalites",
  "/solutions",
  "/tarifs",
  "/contact",
  "/faq",
  "/a-propos",
  "/changelog",
  "/status",
  "/beta",
  "/copropriete",
  "/particuliers",
  "/professionnels",
  "/presentation",
  "/api-docs",
  // Légal
  "/legal",
  "/pricing", // legacy alias (sera redirigé vers /tarifs si besoin)
  "/tarifs",
  "/press",
  "/partenaires",
  // Centre d'aide
  "/help",
  // Dev (mode local, sandbox)
  "/dev",
  // Assets / système
  "/_next",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/fonts",
  "/img",
  "/offline",
  "/maintenance",
  "/og",
];

const LOCALE_RE = /^\/([a-z]{2})(\/|$)/;

function stripLocale(pathname: string): string {
  const m = pathname.match(LOCALE_RE);
  if (!m) return pathname;
  const remainder = pathname.slice(m[0]!.length - (m[2] === "/" ? 1 : 0));
  return remainder || "/";
}

function isPublic(pathname: string) {
  const stripped = stripLocale(pathname);
  return PUBLIC_PATHS.some(p => stripped === p || stripped.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0. Bypass complet pour API & assets (pas de routing i18n).
  const isApi = pathname.startsWith("/api/");
  const isAsset = pathname.startsWith("/_next/") || /\.(png|jpe?g|gif|webp|svg|ico|woff2?|js|css|map)$/.test(pathname);

  // 1. Génération du nonce CSP — sera lu côté layout pour les <Script>
  const nonce = generateNonce();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  // 2. Rate limit sur les endpoints sensibles
  const rateLimitResult = await rateLimitForPath(pathname, req);
  if (rateLimitResult && !rateLimitResult.success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(rateLimitResult.retryAfterSec),
        "X-RateLimit-Limit": String(rateLimitResult.limit),
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
      },
    });
  }

  // 3. Auth gate — BYPASS en dev local pour permettre la démo sans NextAuth provisionné.
  //    En production, vérifie le cookie de session ; sinon redirige vers /auth/signin.
  const bypassAuth = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
  if (!bypassAuth && !isPublic(pathname) && !isApi && !isAsset) {
    const session = req.cookies.get("__Secure-authjs.session-token") || req.cookies.get("authjs.session-token");
    if (!session?.value) {
      const url = req.nextUrl.clone();
      const localeMatch = pathname.match(LOCALE_RE);
      const locale = localeMatch?.[1] ?? routing.defaultLocale;
      url.pathname = `/${locale}/auth/signin`;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 4. Délégation à next-intl pour la résolution de locale (sauf API/assets).
  let response: NextResponse;
  if (!isApi && !isAsset) {
    const intlResponse = intlMiddleware(req);
    response = intlResponse instanceof NextResponse
      ? intlResponse
      : NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 5. Réponse avec nonce injecté dans la CSP
  const csp = response.headers.get("Content-Security-Policy");
  if (csp) {
    response.headers.set(
      "Content-Security-Policy",
      csp.replace("__NEXT_CSP_NONCE__", nonce),
    );
  }
  response.headers.set("x-csp-nonce", nonce);
  return response;
}

export const config = {
  matcher: [
    // Toutes les routes sauf assets statiques
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)",
  ],
};
