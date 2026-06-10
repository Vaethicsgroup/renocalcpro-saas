// lib/auth/admin.ts — Garde super-admin via env ADMIN_USER_IDS.
// v2.5 — BYPASS en dev local pour permettre la démo sans NextAuth ni DB provisionnés.
// v2.6 — Refus admin redirige vers /auth/access-denied (UX claire vs. redirect
//        silencieux vers /p/dashboard qui laissait l'utilisateur dans le flou).
// v2.7 — Mode démo admin par cookie (cf. lib/auth/demo-admin.ts) : permet à un
//        démonstrateur d'accéder à /admin sans figurer dans ADMIN_USER_IDS.
//        Strictement opt-in via /auth/admin-demo, watermark visible en
//        permanence, désactivable en prod via env.
import { redirect } from "next/navigation";
import { isDemoAdminActive } from "./demo-admin";

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export const ADMIN_ENABLED = ADMIN_IDS.length > 0;

/**
 * Bypass auth en dev local : NODE_ENV !== "production" OU NEXT_PUBLIC_BYPASS_AUTH=true.
 * Évite le crash quand NextAuth/Prisma ne sont pas configurés.
 */
function isDevBypass(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
}

/**
 * À appeler en haut d'une page admin server component.
 * - En dev : retourne un userId mock, jamais de redirect.
 * - En prod : si pas de session → /auth/signin ; si pas admin → /p/dashboard.
 */
export async function requireAdmin(locale: string): Promise<{ userId: string }> {
  // BYPASS dev — retourne un mock admin sans toucher à NextAuth
  if (isDevBypass()) {
    return { userId: "dev-admin-mock" };
  }

  // v2.7 — Mode démo admin par cookie (uniquement si l'env l'autorise).
  // Cf. lib/auth/demo-admin.ts pour les garde-fous. Le bandeau DemoAdminBanner
  // sera affiché par le layout pour signaler clairement le mode démo.
  if (await isDemoAdminActive()) {
    return { userId: "demo-admin-cookie" };
  }

  // Lazy-load auth() pour ne pas l'importer en dev (évite tout side-effect NextAuth)
  const { auth } = await import("@/lib/auth/config");
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/dashboard`);
  }
  if (!ADMIN_IDS.includes(session.user.id)) {
    // v2.6 — Redirection explicite vers /auth/access-denied (page publique,
    // pas de boucle de redirection) au lieu d'un retour silencieux vers le
    // dashboard particulier qui laissait l'utilisateur sans explication.
    redirect(`/${locale}/auth/access-denied?from=admin`);
  }
  return { userId: session.user.id };
}

export function isAdmin(userId: string | undefined): boolean {
  return !!userId && ADMIN_IDS.includes(userId);
}
