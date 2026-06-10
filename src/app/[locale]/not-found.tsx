// app/[locale]/not-found.tsx — 404 brandée multilingue.
// Note : Next.js Server Components ne peuvent pas lire params dans not-found.tsx,
// on détecte la locale via cookie ou pathname côté layout — ici on affiche FR
// par défaut + traductions manuelles inline.

import Link from "next/link";

const MSG: Record<string, { title: string; subtitle: string; backHome: string }> = {
  fr: { title: "Page introuvable", subtitle: "Cette page n'existe pas ou a été déplacée.", backHome: "← Retour à l'accueil" },
  en: { title: "Page not found",   subtitle: "This page doesn't exist or has been moved.",  backHome: "← Back to home" },
  es: { title: "Página no encontrada", subtitle: "Esta página no existe o se ha movido.",   backHome: "← Volver al inicio" },
  de: { title: "Seite nicht gefunden", subtitle: "Diese Seite existiert nicht oder wurde verschoben.", backHome: "← Zur Startseite" },
  pt: { title: "Página não encontrada", subtitle: "Esta página não existe ou foi movida.",   backHome: "← Voltar ao início" },
};

export default function NotFound() {
  const m = MSG.fr; // fallback FR — la locale réelle sera détectée par le layout parent

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-stone-50 px-6">
      <div className="text-center">
        {/* Illustration 404 brandée */}
        <svg viewBox="0 0 200 140" className="mx-auto h-40 w-56" aria-hidden role="img">
          <circle cx="100" cy="70" r="58" fill="#e1f5ee" />
          <text x="100" y="92" textAnchor="middle" fontSize="64" fontWeight="700" fill="#0f6e56" fontFamily="Source Serif 4, Georgia, serif">404</text>
        </svg>

        <h1 className="mt-6 font-serif text-4xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {m.title}
        </h1>
        <p className="mt-3 text-stone-600">{m.subtitle}</p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-teal-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          {m.backHome}
        </Link>
      </div>
    </div>
  );
}
