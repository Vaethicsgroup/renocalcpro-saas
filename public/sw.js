// public/sw.js — Service Worker minimal pour PWA Réno·Calc Pro.
// Cache-first pour assets statiques, network-first pour HTML/RSC.
// Pas de cache des routes /api (sécurité multi-tenant).

const VERSION = "renocalc-v1";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/offline",
];

// ── Install ──────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => null))
  );
  self.skipWaiting();
});

// ── Activate : nettoie les anciens caches ──────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("renocalc-") && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Pas de cache pour les API (sécurité multi-tenant + données dynamiques).
  if (url.pathname.startsWith("/api/")) return;

  // Pas de cache pour les routes auth (NextAuth + magic-link sensibles).
  if (url.pathname.includes("/api/auth/")) return;

  // Stratégie 1 : Cache-first pour assets statiques /_next/static, /icons, /screenshots.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/screenshots/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stratégie 2 : Network-first pour HTML/RSC, fallback cache, fallback /offline.
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithOfflineFallback(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    return caches.match("/offline") || new Response("Offline", { status: 503 });
  }
}
