// app/[locale]/admin/analytics/page.tsx — Embed Plausible + KPIs custom
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { getTranslations } from "next-intl/server";

interface Props { params: Promise<{ locale: string }> }

export default async function AnalyticsAdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminAnalytics" });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-stone-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>{t("title")}</h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("kpiVisitors")} value="24 580" trend={{ direction: "up", value: "+12 %", period: t("trendPeriod") }} icon={<span aria-hidden>👁</span>} />
        <KpiCard label={t("kpiPageviews")} value="186 420" trend={{ direction: "up", value: "+8 %", period: t("trendPeriod") }} icon={<span aria-hidden>📄</span>} iconBg="bg-info-100" iconColor="text-info-700" />
        <KpiCard label={t("kpiConvRate")} value="2,4 %" trend={{ direction: "up", value: "+0,3 pts", period: t("trendPeriod") }} icon={<span aria-hidden>🎯</span>} iconBg="bg-amber-100" iconColor="text-amber-700" />
        <KpiCard label={t("kpiAvgSession")} value="3 min 42" trend={{ direction: "up", value: "+15 sec", period: t("trendPeriod") }} icon={<span aria-hidden>⏱</span>} iconBg="bg-success-100" iconColor="text-success-700" />
      </section>

      <Card>
        <CardHeader><CardTitle>{t("dashTitle")}</CardTitle></CardHeader>
        <CardContent>
          <div className="aspect-video rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-center">
            <div>
              <p className="text-3xl">📊</p>
              <p className="mt-3 text-sm text-stone-600">{t("embedPlaceholder")}</p>
              <p className="mt-1 text-xs text-stone-500">{t("embedHint")} <code className="rounded bg-stone-100 px-1.5 py-0.5">plausible.io/renocalcpro.fr</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
