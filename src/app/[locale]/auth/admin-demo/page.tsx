// app/[locale]/auth/admin-demo/page.tsx
// Page d'activation du mode démo admin — i18n complet via namespace demoAdmin.

import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  ShieldCheck,
  Power,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { DemoAdminToggle } from "@/components/auth/DemoAdminToggle";
import { isDemoAdminEnabled } from "@/lib/auth/demo-admin";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminDemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "demoAdmin" });

  const isProd = process.env.NODE_ENV === "production";
  const isDevBypass =
    !isProd || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";
  const envAllowsDemo = isDemoAdminEnabled();

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-forest-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex justify-center">
          <Logo
            href={`/${locale}`}
            variant="wordmark"
            theme="dark"
            className="text-base"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border-2 border-amber-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-night-800 to-forest-800 px-6 py-5 text-white">
            <div className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-cream-200/80">
              {t("pageEyebrow")}
            </p>
            <h1
              className="mt-1 font-serif text-2xl font-bold md:text-3xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t("pageTitle")}
            </h1>
            <p className="mt-1 text-sm text-cream-100/80">{t("pageSubtitle")}</p>
          </div>

          <div className="space-y-6 px-6 py-6">
            <section>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-forest-700">
                {t("diagnosticTitle")}
              </h2>
              <ul className="space-y-2 text-sm">
                <DiagnosticRow
                  label={t("diagnosticEnv")}
                  value={isProd ? t("envProd") : t("envDev")}
                  positive={!isProd}
                />
                <DiagnosticRow
                  label={t("diagnosticBypass")}
                  value={isDevBypass ? t("stateActive") : t("stateInactive")}
                  positive={isDevBypass}
                />
                <DiagnosticRow
                  label={t("diagnosticAllowed")}
                  value={envAllowsDemo ? t("stateYes") : t("stateNo")}
                  positive={envAllowsDemo}
                />
              </ul>
            </section>

            {isDevBypass && (
              <section className="rounded-xl border border-forest-300 bg-forest-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700 ring-1 ring-forest-200">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-forest-900">
                      {t("devBypassTitle")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-forest-900/80">
                      {t("devBypassDesc")}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/${locale}/admin`}
                  className="group mt-4 flex w-full items-center justify-between gap-3 rounded-lg bg-forest-700 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-forest-800"
                >
                  <span className="flex items-center gap-2">
                    <Power className="h-4 w-4" strokeWidth={2} aria-hidden />
                    {t("openAdmin")}
                  </span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2} aria-hidden />
                </Link>
              </section>
            )}

            {!isDevBypass && (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-forest-900">
                  {t("activateTitle")}
                </h2>
                <p className="mb-3 text-xs leading-relaxed text-stone-600">
                  {t.rich("activateDesc", {
                    code: (chunks) => (
                      <code className="rounded bg-cream-50 px-1.5 py-0.5 font-mono text-[10px] text-forest-700 ring-1 ring-cream-300">
                        {chunks}
                      </code>
                    ),
                  })}
                </p>
                <DemoAdminToggle
                  locale={locale}
                  disabledByEnv={!envAllowsDemo}
                />
              </section>
            )}

            <section className="border-t border-cream-200 pt-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-forest-900">
                <KeyRound className="h-4 w-4 text-forest-700" strokeWidth={2} aria-hidden />
                {t("manualHeader")}
              </h2>
              <ol className="space-y-2 text-xs leading-relaxed text-stone-700">
                <li className="flex gap-2">
                  <span className="font-bold text-forest-700">1.</span>
                  <span>
                    {t.rich("manual1", {
                      link: (chunks) => (
                        <Link
                          href={`/${locale}/auth/signup`}
                          className="font-semibold text-forest-700 underline hover:text-forest-800"
                        >
                          {chunks}
                        </Link>
                      ),
                      code: (chunks) => (
                        <code className="rounded bg-cream-50 px-1 py-0.5 font-mono text-[10px] text-forest-700 ring-1 ring-cream-300">
                          {chunks}
                        </code>
                      ),
                    })}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-forest-700">2.</span>
                  <span>
                    {t.rich("manual2", {
                      code: (chunks) => (
                        <code className="rounded bg-cream-50 px-1 py-0.5 font-mono text-[10px] text-forest-700 ring-1 ring-cream-300">
                          {chunks}
                        </code>
                      ),
                    })}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-forest-700">3.</span>
                  <span>
                    {t.rich("manual3", {
                      code: (chunks) => (
                        <code className="rounded bg-cream-50 px-1 py-0.5 font-mono text-[10px] text-forest-700 ring-1 ring-cream-300">
                          {chunks}
                        </code>
                      ),
                    })}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-forest-700">4.</span>
                  <span>
                    {t.rich("manual4", {
                      code: (chunks) => (
                        <code className="rounded bg-cream-50 px-1 py-0.5 font-mono text-[10px] text-forest-700 ring-1 ring-cream-300">
                          {chunks}
                        </code>
                      ),
                    })}
                  </span>
                </li>
              </ol>
            </section>

            <section className="border-t border-cream-200 pt-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  href={`/${locale}`}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-cream-300 bg-white px-3 text-xs font-semibold text-forest-900 transition hover:border-forest-300 hover:bg-cream-50"
                >
                  {t("returnHome")}
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-cream-300 bg-white px-3 text-xs font-semibold text-forest-900 transition hover:border-forest-300 hover:bg-cream-50"
                >
                  {t("contactSupport")}
                </Link>
              </div>
            </section>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-stone-500">
          {t("footer")}
        </p>
      </div>
    </main>
  );
}

function DiagnosticRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-cream-200 bg-cream-50/40 px-3 py-2">
      <span className="text-xs text-stone-700">{label}</span>
      <span
        className={[
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
          positive
            ? "bg-forest-100 text-forest-800 ring-forest-200"
            : "bg-stone-100 text-stone-700 ring-stone-200",
        ].join(" ")}
      >
        {positive ? (
          <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
        ) : (
          <AlertTriangle className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
        )}
        {value}
      </span>
    </li>
  );
}
