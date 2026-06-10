// app/[locale]/(auth)/logout/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Page de déconnexion personnalisée, en remplacement de la page NextAuth par
// défaut (qui s'affiche en HTML brut "Signout — Are you sure ?").
//
// Branding aligné : header forêt + carte cream + bouton CTA forest + lien
// annuler discret. Compte à rebours optionnel de 3s avant retour auto.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut,
  X,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function LogoutPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fr";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Déconnexion via NextAuth `signOut` — supprime cookies, JWT, session
   * serveur, puis redirige côté navigateur vers l'accueil public du site.
   *
   * `redirect: true` permet à NextAuth de faire un hard reload sur callbackUrl
   * (plus fiable que router.push qui peut conserver un cache de session).
   */
  const handleSignOut = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signOut({
        callbackUrl: `/${locale}`,
        redirect: true,
      });
      // Pas de code après — NextAuth fait le redirect.
    } catch (err) {
      // Fallback : si signOut échoue (réseau, NextAuth indispo), on POST
      // direct sur le endpoint puis force la navigation vers l'accueil.
      try {
        const csrfRes = await fetch("/api/auth/csrf");
        const { csrfToken } = await csrfRes.json();
        const fd = new FormData();
        fd.append("csrfToken", csrfToken);
        fd.append("callbackUrl", `/${locale}`);
        await fetch("/api/auth/signout", { method: "POST", body: fd });
      } catch {
        /* ignore */
      }
      // Hard reload vers l'accueil — garantit qu'aucun état client n'est conservé
      window.location.href = `/${locale}`;
      // Si tout est cassé, on remonte le message d'erreur
      setError(
        err instanceof Error
          ? err.message
          : "Redirection vers l'accueil…",
      );
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-50 via-cream-100 to-forest-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Logo
            href={`/${locale}`}
            variant="wordmark"
            theme="dark"
            className="text-base"
          />
        </div>

        {/* Carte de confirmation */}
        <div className="overflow-hidden rounded-2xl border-2 border-forest-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-night-800 to-forest-800 px-6 py-5 text-center">
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur">
              <LogOut className="h-6 w-6 text-white" strokeWidth={1.75} />
            </div>
            <h1
              className="font-serif text-2xl font-bold text-white"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Déconnexion
            </h1>
            <p className="mt-1 text-sm text-cream-100/85">
              Voulez-vous vraiment quitter votre espace ?
            </p>
          </div>

          <div className="px-6 py-6">
            {/* Bénéfices à rester */}
            <div className="mb-4 rounded-lg border border-forest-200 bg-forest-50/50 p-3.5 text-sm">
              <p className="flex items-center gap-2 font-semibold text-forest-900">
                <Shield className="h-4 w-4 text-forest-700" />
                Avant de partir
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-stone-700">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-forest-600" />
                  Vos dossiers et calculs restent enregistrés en toute sécurité
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-forest-600" />
                  Vous pourrez revenir à tout moment avec vos identifiants
                </li>
                <li className="flex items-start gap-1.5">
                  <Clock className="mt-0.5 h-3 w-3 shrink-0 text-stone-500" />
                  Aucun téléchargement en cours ne sera interrompu
                </li>
              </ul>
            </div>

            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-700" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-night-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-night-900 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" strokeWidth={2} />
                {submitting ? "Déconnexion en cours…" : "Confirmer la déconnexion"}
              </button>

              <Link
                href={`/${locale}/p/dashboard`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-cream-300 bg-white px-4 py-3 text-sm font-semibold text-forest-900 transition-colors hover:border-forest-300 hover:bg-cream-50"
              >
                <X className="h-4 w-4" strokeWidth={2} />
                Annuler et retourner à mon espace
              </Link>
            </div>
          </div>

          <div className="border-t border-cream-200 bg-cream-50 px-6 py-3 text-center text-xs text-stone-500">
            Vous pouvez aussi{" "}
            <Link
              href={`/${locale}/contact`}
              className="font-semibold text-forest-700 hover:underline"
            >
              nous contacter
            </Link>{" "}
            si vous rencontrez un problème.
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-[11px] text-stone-500">
          Vos données sont protégées · RGPD conforme · Chiffrement TLS 1.3
        </p>
      </div>
    </main>
  );
}
