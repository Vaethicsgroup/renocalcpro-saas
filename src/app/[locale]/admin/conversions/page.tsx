// app/[locale]/admin/conversions/page.tsx — Funnel visiteur → payant.
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/client";

interface Props { params: Promise<{ locale: string }> }

const STAGES = [
  { key: "visitors",  labelKey: "stage1", icon: "👁" },
  { key: "signups",   labelKey: "stage2", icon: "✉️" },
  { key: "activated", labelKey: "stage3", icon: "🚀" },
  { key: "trialing",  labelKey: "stage4", icon: "⏳" },
  { key: "paying",    labelKey: "stage5", icon: "💳" },
] as const;

export default async function AdminConversions({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "adminConv" });

  const since30d = new Date(Date.now() - 30 * 86400_000);
  const [signups, activated, trialing, paying] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since30d } } }).catch(() => 0),
    prisma.organization.count({ where: { createdAt: { gte: since30d }, projects: { some: {} } } }).catch(() => 0),
    prisma.subscription.count({ where: { status: "TRIALING" } }).catch(() => 0),
    prisma.subscription.count({ where: { status: "ACTIVE", plan: { in: ["P_MON_PROJET","SOLO","PRO","TEAM","ENTERPRISE"] } } }).catch(() => 0),
  ]);

  // Visiteurs : à brancher Plausible API en Sprint 7 — pour l'instant estimation x10 du signups
  const visitors = signups * 10 || 1000;

  const counts: Record<string, number> = { visitors, signups, activated, trialing, paying };
  const max = Math.max(...Object.values(counts));

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-stone-500">{t("subtitle")}</p>

      <section className="mt-8 space-y-4">
        {STAGES.map((s, i) => {
          const value = counts[s.key]!;
          const width = max > 0 ? Math.max(8, (value / max) * 100) : 8;
          const dropFromPrev = i > 0
            ? (counts[STAGES[i - 1]!.key]! > 0 ? Math.round((value / counts[STAGES[i - 1]!.key]!) * 100) : 0)
            : 100;
          return (
            <div key={s.key} className="flex items-center gap-4">
              <div className="w-64 text-sm text-stone-700">
                <span aria-hidden className="mr-2">{s.icon}</span>
                {t(s.labelKey)}
              </div>
              <div className="flex-1 overflow-hidden rounded-lg bg-stone-100">
                <div
                  className="flex h-12 items-center justify-end rounded-lg bg-gradient-to-r from-teal-700 to-teal-500 pr-4 font-serif text-lg font-bold text-white shadow-sm"
                  style={{ width: `${width}%`, fontFamily: "Source Serif 4, Lora, serif" }}
                >
                  {value.toLocaleString(locale)}
                </div>
              </div>
              <div className="w-20 text-right text-sm font-medium text-stone-500">
                {i > 0 && `${dropFromPrev} %`}
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <KpiTile label={t("kpiSignup")} value={signups > 0 ? `${Math.round((activated / signups) * 100)} %` : "—"} />
        <KpiTile label={t("kpiTrial")} value={trialing > 0 ? `${Math.round((paying / (trialing + paying)) * 100)} %` : "—"} />
        <KpiTile label={t("kpiVisitor")} value={visitors > 0 ? `${((paying / visitors) * 100).toFixed(2)} %` : "—"} />
      </section>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-stone-500">{label}</div>
      <div className="mt-2 font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{value}</div>
    </div>
  );
}
