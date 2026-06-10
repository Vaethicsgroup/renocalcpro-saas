// app/[locale]/p/dashboard/page.tsx — Dashboard particulier i18n complet

import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Snowflake, Sun, Coins, LifeBuoy } from "lucide-react";
import { DashboardHero } from "@/components/p/DashboardHero";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { DPELabel } from "@/components/results/DPELabel";
import { DashboardFreemiumCard } from "@/components/billing/DashboardFreemiumCard";
import { ProjectCoverImage } from "@/components/p/ProjectCoverImage";
import { getCurrentBillingPlan } from "@/server/auth/getCurrentBillingPlan";
import { getCurrentActiveProjectsCount } from "@/server/auth/getCurrentActiveProjectsCount";
import { getRemainingProjects } from "@/lib/billing/usage-policy";

interface DashboardProps {
  params: Promise<{ locale: string }>;
}

export default async function ParticulierDashboard({ params }: DashboardProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pDashboard" });

  const [billingPlan, activeProjectsCount] = await Promise.all([
    getCurrentBillingPlan(),
    getCurrentActiveProjectsCount(),
  ]);
  const remainingProjects = getRemainingProjects(billingPlan, {
    activeProjectsCount,
    pdfExportsThisMonth: 0,
    emailVerified: true,
  });

  // Locale-aware number formatting (les nombres restent dans les chaînes
  // formatées avec Intl, mais les libellés sont traduits).
  const fmtEur = new Intl.NumberFormat(locale);

  // MVP : valeurs mock — à brancher sur Prisma + session NextAuth
  const project = {
    id: "demo",
    name: "Maison des Tilleuls",
    location: "87000 Limoges",
    surfaceM2: 120,
    constructionYear: 1978,
    currentDPE: "E" as const,
    targetDPE: "B" as const,
    progress: 60,
    favScenarioBudget: 45_800,
    favScenarioAids: 18_650,
    monthlySavings: 142,
    annualSavings: 1_245,
    nextStep: {
      label: t("validateScenarioCta"),
      href: "/p/projects/demo/works",
      description: t("validateScenarioDesc"),
    },
    upcomingTasks: [t("task1"), t("task2"), t("task3"), t("task4")],
  };

  const advanceSteps = [
    t("advanceStep1"),
    t("advanceStep2"),
    t("advanceStep3"),
    t("advanceStep4"),
    t("advanceStep5"),
  ];

  return (
    <div className="space-y-8">
      <DashboardHero locale={locale} firstName="Claire" nextStep={project.nextStep} />

      <DashboardFreemiumCard
        plan={billingPlan}
        remainingProjects={remainingProjects}
        locale={locale}
      />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-start gap-4">
            <div className="hidden h-24 w-32 shrink-0 sm:block">
              <ProjectCoverImage
                projectId={project.id}
                variant="thumb"
                aspectRatio="4/3"
                label={t("projectPhotoLabel")}
                placeholderText=""
                className="h-full w-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-semibold uppercase tracking-wider text-teal-700">{t("projectEyebrow")}</p>
              <h2
                className="mt-1 font-serif text-2xl font-bold text-stone-900"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {project.name}
              </h2>
              <p className="mt-1 text-sm text-stone-600">{project.location}</p>

              <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-stone-100 pt-4 text-xs">
                <div>
                  <dt className="text-stone-500">{t("projectSurface")}</dt>
                  <dd className="mt-0.5 text-base font-bold text-stone-900 tabular-nums">{project.surfaceM2} m²</dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t("projectYear")}</dt>
                  <dd className="mt-0.5 text-base font-bold text-stone-900 tabular-nums">{project.constructionYear}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">{t("projectCurrentLabel")}</dt>
                  <dd className="mt-0.5 inline-block">
                    <DPELabel classification={project.currentDPE} size="sm" />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("advanceTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {advanceSteps.map((step, i) => {
                const done = i < 3;
                const active = i === 2;
                return (
                  <div key={step} className="flex flex-col items-center gap-1.5">
                    <span
                      aria-current={active ? "step" : undefined}
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition",
                        done ? "bg-success-600 text-white" : active ? "bg-teal-700 text-white ring-4 ring-teal-100" : "bg-stone-200 text-stone-500",
                      ].join(" ")}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={["text-2xs leading-tight text-center", active ? "font-semibold text-teal-800" : "text-stone-500"].join(" ")}>
                      {step.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full bg-gradient-to-r from-teal-600 to-amber-500" style={{ width: `${project.progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-stone-500">{t("advancePercent", { percent: project.progress })}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label={t("kpisAria")}>
        <KpiCard
          icon={<Snowflake className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
          iconBg="bg-info-100"
          iconColor="text-info-700"
          label={t("kpiWinterLabel")}
          value="+ 2,3 °C"
          trend={{ direction: "up", value: t("kpiWinterTrend"), period: t("kpiWinterTrendPeriod") }}
          helpText={t("kpiWinterHelp")}
        />
        <KpiCard
          icon={<Sun className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          label={t("kpiSummerLabel")}
          value="− 3,6 °C"
          trend={{ direction: "down", value: t("kpiSummerTrend"), period: t("kpiSummerTrendPeriod") }}
          helpText={t("kpiSummerHelp")}
        />
        <KpiCard
          icon={<Coins className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
          iconBg="bg-success-100"
          iconColor="text-success-700"
          label={t("kpiSavingsLabel")}
          value={`${fmtEur.format(project.annualSavings)} €`}
          trend={{ direction: "up", value: t("kpiSavingsTrend"), period: t("kpiSavingsTrendPeriod") }}
          helpText={t("kpiSavingsHelp", { monthly: project.monthlySavings })}
        />
      </section>

      <section>
        <Card variant="featured">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-2xs font-bold text-amber-900">{t("favBadge")}</span>
                <p className="text-2xs font-semibold uppercase tracking-wider text-teal-700">{t("favEyebrow")}</p>
              </div>
              <h2
                className="mt-2 font-serif text-2xl font-bold text-stone-900"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {t("favScenarioName")}
              </h2>

              <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("favBudget")}</dt>
                  <dd className="mt-1 font-serif text-lg font-bold text-stone-900 tabular-nums">{t("favBudgetValue", { value: fmtEur.format(project.favScenarioBudget) })}</dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("favSavings")}</dt>
                  <dd className="mt-1 font-serif text-lg font-bold text-success-700 tabular-nums">{t("favSavingsValue", { value: fmtEur.format(project.annualSavings) })}</dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("favAfter")}</dt>
                  <dd className="mt-1"><DPELabel classification={project.targetDPE} size="md" /></dd>
                </div>
                <div>
                  <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("favAids")}</dt>
                  <dd className="mt-1 font-serif text-lg font-bold text-teal-700 tabular-nums">{t("favAidsValue", { value: fmtEur.format(project.favScenarioAids) })}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/${locale}/p/projects/${project.id}/works`}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  {t("favCtaDetail")}
                </Link>
                <Link
                  href={`/${locale}/p/projects/${project.id}/aids`}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  {t("favCtaAids")}
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("nextTitle")}</CardTitle>
            <CardDescription>{t("nextSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {project.upcomingTasks.map((task, i) => (
                <li key={task} className="flex items-start gap-3">
                  <span aria-hidden className={[
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    i === 0 ? "bg-forest-600 text-white" : "bg-cream-200 text-stone-500",
                  ].join(" ")}>
                    {i + 1}
                  </span>
                  <span className={["text-sm", i === 0 ? "font-semibold text-night-800" : "text-stone-600"].join(" ")}>{task}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card variant="default" className="bg-white border-cream-300">
          <div className="text-center">
            <div
              aria-hidden
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-forest-100 text-forest-700"
            >
              <LifeBuoy className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3 font-serif text-lg font-bold text-night-800" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              {t("supportTitle")}
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              {t("supportBody")}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/${locale}/contact`}
                className="flex h-10 w-full items-center justify-center rounded-lg bg-forest-600 px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-forest-800"
              >
                {t("supportContactCta")}
              </Link>
              <Link
                href={`/${locale}/help`}
                className="flex h-10 w-full items-center justify-center rounded-lg border border-cream-300 bg-white px-4 text-sm font-semibold text-stone-900 transition-colors hover:bg-cream-100"
              >
                {t("supportHelpCta")}
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
