// app/[locale]/o/projects/[id]/aides/page.tsx — Devis v2 (chiffrage + aides détaillées)
"use client";

import { useTranslations, useLocale } from "next-intl";
import { FileText, Download, Send, CheckCircle2, Clock, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { ComingSoonButton } from "@/components/ui/ComingSoonButton";

interface AideLine {
  id: string;
  nameKey: string;
  shortKey: string;
  amount: number;
  status: "ELIGIBLE" | "DEMANDEE" | "ACCORDEE" | "VERSEE" | "REFUSEE";
  conditionsKey: string;
  delayKey: string;
}

const AIDES: ReadonlyArray<AideLine> = [
  { id: "a1", nameKey: "a1_name", shortKey: "a1_short", amount: 18500, status: "DEMANDEE", conditionsKey: "a1_conditions", delayKey: "a1_delay" },
  { id: "a2", nameKey: "a2_name", shortKey: "a2_short", amount: 5000, status: "ELIGIBLE", conditionsKey: "a2_conditions", delayKey: "a2_delay" },
  { id: "a3", nameKey: "a3_name", shortKey: "a3_short", amount: 1500, status: "ELIGIBLE", conditionsKey: "a3_conditions", delayKey: "a3_delay" },
  { id: "a4", nameKey: "a4_name", shortKey: "a4_short", amount: 50000, status: "ELIGIBLE", conditionsKey: "a4_conditions", delayKey: "a4_delay" },
  { id: "a5", nameKey: "a5_name", shortKey: "a5_short", amount: 6800, status: "VERSEE", conditionsKey: "a5_conditions", delayKey: "a5_delay" },
  { id: "a6", nameKey: "a6_name", shortKey: "a6_short", amount: 2500, status: "ELIGIBLE", conditionsKey: "a6_conditions", delayKey: "a6_delay" },
];

const STATUS_META: Record<AideLine["status"], { labelKey: string; color: string; Icon: typeof CheckCircle2 }> = {
  ELIGIBLE: { labelKey: "statusEligible", color: "bg-stone-100 text-stone-700", Icon: Info },
  DEMANDEE: { labelKey: "statusDemandee", color: "bg-info-100 text-info-800", Icon: Clock },
  ACCORDEE: { labelKey: "statusAccordee", color: "bg-forest-100 text-forest-800", Icon: CheckCircle2 },
  VERSEE: { labelKey: "statusVersee", color: "bg-forest-200 text-forest-800", Icon: CheckCircle2 },
  REFUSEE: { labelKey: "statusRefusee", color: "bg-red-100 text-red-700", Icon: AlertTriangle },
};

export default function DevisPage() {
  const t = useTranslations("oAides");
  const locale = useLocale();
  const fmtEur = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const totalCoutHT = 64100;
  const totalCoutTTC = Math.round(totalCoutHT * 1.055);
  const totalAides = AIDES.reduce((s, a) => s + a.amount, 0);
  const totalRAC = Math.max(0, totalCoutTTC - totalAides);
  const subventionnables = AIDES.filter((a) => a.id !== "a4").reduce((s, a) => s + a.amount, 0);
  const pretMobilisable = AIDES.find((a) => a.id === "a4")?.amount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Export PDF — chantier React-PDF verrouillé pour la stabilité du
              boot, neutralisé proprement avec pill « Bientôt » et tooltip. */}
          <ComingSoonButton variant="secondary" size="md" leftIcon={Download}>
            {t("exportPdf")}
          </ComingSoonButton>
          {/* Envoi client — workflow email (Resend) pas branché pour le MVP. */}
          <ComingSoonButton variant="primary" size="md" leftIcon={Send}>
            {t("sendClient")}
          </ComingSoonButton>
        </div>
      </div>

      {/* Synthèse financière */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BigKpi label={t("kpiCost")} value={fmtEur(totalCoutTTC)} color="text-forest-900" />
            <BigKpi label={t("kpiSubventions")} value={`−${fmtEur(subventionnables)}`} color="text-forest-700" />
            <BigKpi label={t("kpiEcoPtz")} value={fmtEur(pretMobilisable)} color="text-info-700" />
            <BigKpi label={t("kpiRac")} value={fmtEur(totalRAC)} color="text-night-700" highlight />
          </div>
        </CardContent>
      </Card>

      {/* Tableau des aides */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-forest-900">{t("cardTitle", { count: AIDES.length })}</h3>
              <p className="text-xs text-stone-600">{t("cardSubtitle")}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-cream-200">
            <table className="w-full text-sm">
              <thead className="bg-cream-50">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  <th className="px-3 py-2 text-left">{t("thAide")}</th>
                  <th className="hidden px-3 py-2 text-left lg:table-cell">{t("thConditions")}</th>
                  <th className="px-3 py-2 text-right">{t("thAmount")}</th>
                  <th className="px-3 py-2 text-center">{t("thDelay")}</th>
                  <th className="px-3 py-2 text-center">{t("thStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {AIDES.map((a) => {
                  const meta = STATUS_META[a.status];
                  const Icon = meta.Icon;
                  return (
                    <tr key={a.id} className="hover:bg-cream-50">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-forest-900">{t(a.shortKey)}</p>
                        <p className="text-[11px] text-stone-500">{t(a.nameKey)}</p>
                      </td>
                      <td className="hidden px-3 py-3 text-[11px] text-stone-600 lg:table-cell">
                        {t(a.conditionsKey)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums text-forest-900">
                        {fmtEur(a.amount)}
                      </td>
                      <td className="px-3 py-3 text-center text-[11px] text-stone-600">{t(a.delayKey)}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {t(meta.labelKey)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-forest-50">
                <tr className="text-sm font-bold text-forest-900">
                  <td className="px-3 py-2.5" colSpan={2}>{t("totalRow")}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtEur(totalAides)}</td>
                  <td className="px-3 py-2.5" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-3 rounded-md border border-info-200 bg-info-50/40 p-2 text-xs text-info-900">
            <Info className="mr-1.5 inline h-3 w-3" />
            <strong>{t("auditorNote")}</strong> {t("auditorNoteText")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BigKpi({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-night-300 bg-night-50/40" : "border-cream-200 bg-white"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-1 font-serif text-xl font-bold tabular-nums leading-tight ${color}`} style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
        {value}
      </p>
    </div>
  );
}
