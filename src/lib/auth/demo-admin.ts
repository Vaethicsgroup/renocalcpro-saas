// src/lib/auth/demo-admin.ts
// ════════════════════════════════════════════════════════════════════════════
// Mode admin démo (opt-in, par cookie).
//
// Objectif : permettre à un opérateur (commercial, démonstrateur, journaliste)
// de visualiser l'espace `/admin` sur un environnement staging ou prod-like
// SANS posséder un véritable accès super-admin via `ADMIN_USER_IDS`.
//
// Garde-fous :
//   - En NODE_ENV=production, le mode démo n'est activable que si l'env
//     NEXT_PUBLIC_ENABLE_DEMO_ADMIN=true est défini (toggle ops). Sinon le
//     cookie est ignoré.
//   - En dev local, le mode démo est toujours autorisé.
//   - L'utilisateur doit poser un cookie explicite via la page
//     /auth/admin-demo. Aucune activation automatique.
//   - Un bandeau "Mode démo admin" est rendu en permanence sur /admin tant
//     que le cookie est actif, pour éviter toute confusion avec un vrai
//     compte admin.
//   - Aucune action destructive n'est cliquable dans /admin (le lot précédent
//     a déjà neutralisé tous les boutons critiques).
//   - Le cookie est court (1 h) : forçage de re-activation explicite.
// ════════════════════════════════════════════════════════════════════════════

import { cookies } from "next/headers";

/** Nom du cookie d'activation du mode démo admin. */
export const DEMO_ADMIN_COOKIE = "renocalc.demo_admin";

/** Valeur active du cookie. */
export const DEMO_ADMIN_COOKIE_VALUE = "1";

/** TTL par défaut : 1 heure. */
export const DEMO_ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60;

/**
 * True si l'environnement courant autorise l'usage du mode démo admin :
 *   - En NODE_ENV=production : nécessite NEXT_PUBLIC_ENABLE_DEMO_ADMIN=true
 *   - Autrement (dev, test, preview) : autorisé par défaut
 */
export function isDemoAdminEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_ADMIN === "true";
}

/**
 * Vérifie la présence du cookie d'activation côté serveur.
 * Ne throw jamais — retourne false si `cookies()` n'est pas disponible.
 */
export async function hasDemoAdminCookie(): Promise<boolean> {
  try {
    const store = await cookies();
    return store.get(DEMO_ADMIN_COOKIE)?.value === DEMO_ADMIN_COOKIE_VALUE;
  } catch {
    return false;
  }
}

/**
 * Le mode démo est-il réellement actif pour cette requête ?
 * Combine l'env (isDemoAdminEnabled) ET le cookie (hasDemoAdminCookie).
 */
export async function isDemoAdminActive(): Promise<boolean> {
  if (!isDemoAdminEnabled()) return false;
  return await hasDemoAdminCookie();
}

/**
 * Mode d'accès admin courant. Utile pour décider si on affiche le bandeau
 * watermark.
 *   - "dev-bypass" : NODE_ENV !== production OU NEXT_PUBLIC_BYPASS_AUTH=true
 *   - "demo-cookie" : env autorisé + cookie posé (hors dev bypass)
 *   - "real" : véritable session ADMIN_USER_IDS
 *   - "none" : aucun accès (devrait avoir été redirigé en amont)
 */
export type AdminAccessMode = "dev-bypass" | "demo-cookie" | "real" | "none";

/** Détection côté serveur du mode d'accès courant. */
export async function detectAdminAccessMode(): Promise<AdminAccessMode> {
  const isDev =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
  if (isDev) return "dev-bypass";
  if (await isDemoAdminActive()) return "demo-cookie";
  // Si on est arrivé ici, c'est que requireAdmin a laissé passer →
  // session admin réelle.
  return "real";
}
