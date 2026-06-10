// app/[locale]/auth/access-denied/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Page d'accès refusé propre. Au lieu de rediriger silencieusement un
// utilisateur non-admin vers son dashboard, on lui montre clairement
// pourquoi il a été refusé + comment continuer.
//
// Route publique (dans /auth/* → PUBLIC_PATHS du middleware), pas de
// requireAdmin → pas de boucle de redirection possible.
// ════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ShieldOff, ArrowRight, LogOut, Home, Mail } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ from?: string }>;
}

export default async function AccessDeniedPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "accessDenied" });
  const sp: { from?: string } = searchParams ? await searchParams : {};
  const isAdmin = sp.from === "admin";

  const title = isAdmin ? t("adminTitle") : t("defaultTitle");
  const description = isAdmin ? t("adminDesc") : t("defaultDesc");

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

        {/* Carte */}
        <div className="overflow-hidden rounded-2xl border-2 border-amber-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-amber-700 to-amber-600 px-6 py-5 text-center text-white">
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur">
              <ShieldOff className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h1
              className="font-serif text-2xl font-bold"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {title}
            </h1>
          </div>

          <div className="space-y-4 px-6 py-6">
            <p className="text-sm leading-relaxed text-stone-700">
              {description}
            </p>

            {isAdmin && (
              <div className="rounded-lg border border-cream-300 bg-cream-50 p-3 text-[11px] leading-relaxed text-stone-700">
                <p className="font-semibold text-forest-900">
                  {t("adminHelpTitle")}
                </p>
                <p className="mt-1">
                  {t.rich("adminHelpBody", {
                    var: (chunks) => (
                      <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-forest-700 ring-1 ring-cream-300">
                        {chunks}
                      </code>
                    ),
                    link: (chunks) => (
                      <Link
                        href={`/${locale}/auth/admin-demo`}
                        className="font-semibold text-forest-700 underline hover:text-forest-800"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Link
                href={`/${locale}/p/dashboard`}
                className="group flex w-full items-center justify-between gap-3 rounded-xl bg-forest-700 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-forest-800"
              >
                <span className="flex items-center gap-2">
                  <Home className="h-4 w-4" strokeWidth={2} aria-hidden />
                  {t("returnHome")}
                </span>
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>

              <Link
                href={`/${locale}/logout`}
                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-cream-300 bg-white px-5 py-3 text-sm font-semibold text-forest-900 transition hover:border-forest-300 hover:bg-cream-50"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-stone-500" strokeWidth={2} aria-hidden />
                  {t("switchAccount")}
                </span>
                <ArrowRight
                  className="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-forest-700"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>

              <Link
                href={`/${locale}/contact`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-cream-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 transition hover:border-forest-200 hover:text-forest-700"
              >
                <Mail className="h-3 w-3" strokeWidth={2} aria-hidden />
                {t("contactSupport")}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-[11px] text-stone-500">
          {t("footer")}
        </p>
      </div>
    </main>
  );
}
