// app/[locale]/p/aids/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Page "Mes aides" — vue globale agrégée des aides demandées sur tous les
// dossiers du user. Tab "Suivi" + tab "Mobilisables" + tab "Bibliothèque".
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  HandCoins,
  ClipboardList,
  BookOpen,
  Plus,
  CircleDollarSign,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { MyAidsTracker } from "@/components/aids/MyAidsTracker";
import type { AidRequest } from "@/lib/calc/aids/tracking";
import { useParams } from "next/navigation";

const INITIAL_REQUESTS_TEMPLATE: Array<Omit<AidRequest, "shortLabelFr"> & { labelKey: string }> = [
  { aidId: "mpr-iso-mur-ite", labelKey: "reqIteMaisonTilleuls", status: "PLANNED", amountRequested_eur: 5400 },
  { aidId: "mpr-pac-air-eau", labelKey: "reqPacMaisonTilleuls", status: "SUBMITTED",
    submittedAt: "2026-05-20", expectedResponseAt: "2026-07-22", amountRequested_eur: 4000 },
  { aidId: "cee-coup-de-pouce-pac", labelKey: "reqCeePac", status: "GRANTED",
    submittedAt: "2026-04-10", respondedAt: "2026-05-15", amountRequested_eur: 5000, amountGranted_eur: 5000 },
  { aidId: "eco-ptz-individuel", labelKey: "reqEcoPtzCa", status: "UNDER_REVIEW",
    submittedAt: "2026-05-05", amountRequested_eur: 30000 },
  { aidId: "tva-5-5-renov-energetique", labelKey: "reqTvaDevis", status: "PAID",
    submittedAt: "2026-04-15", respondedAt: "2026-04-15", amountGranted_eur: 2150 },
];

const AID_PROGRAMS_KEYS: ReadonlyArray<{
  shortKey: string;
  emitterKey: string;
  ceilKey: string;
  href: string;
}> = [
  { shortKey: "progMpr", emitterKey: "emitterAnah", ceilKey: "progMprCeil",
    href: "https://www.france-renov.gouv.fr" },
  { shortKey: "progMprParcours", emitterKey: "emitterAnah", ceilKey: "progMprParcoursCeil",
    href: "https://www.france-renov.gouv.fr" },
  { shortKey: "progCee", emitterKey: "progCeeEmitter", ceilKey: "progCeeCeil",
    href: "https://www.ecologie.gouv.fr/coup-pouce-economies-denergie" },
  { shortKey: "progEcoPtz", emitterKey: "progEcoPtzEmitter", ceilKey: "progEcoPtzCeil",
    href: "https://www.service-public.fr/particuliers/vosdroits/F19905" },
  { shortKey: "progTva", emitterKey: "progTvaEmitter", ceilKey: "progTvaCeil",
    href: "https://www.service-public.fr/particuliers/vosdroits/F31988" },
  { shortKey: "progAdapt", emitterKey: "progAdaptEmitter", ceilKey: "progAdaptCeil",
    href: "https://www.france-renov.gouv.fr/aides/maprimeadapt" },
];

export default function MesAidesPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fr";
  const t = useTranslations("pAids");
  const [tab, setTab] = useState<"tracker" | "library">("tracker");

  const INITIAL_REQUESTS: AidRequest[] = INITIAL_REQUESTS_TEMPLATE.map(({ labelKey, ...rest }) => ({
    ...rest,
    shortLabelFr: t(labelKey),
  }));
  const AID_PROGRAMS = AID_PROGRAMS_KEYS.map((p) => ({
    shortFr: t(p.shortKey),
    emitter: t(p.emitterKey),
    ceil: t(p.ceilKey),
    href: p.href,
  }));

  const totalGranted = INITIAL_REQUESTS.filter(
    (r) =>
      r.status === "GRANTED" ||
      r.status === "PARTIALLY_GRANTED" ||
      r.status === "PAID",
  ).reduce((s, r) => s + (r.amountGranted_eur ?? 0), 0);

  const totalExpected = INITIAL_REQUESTS.reduce(
    (s, r) => s + (r.amountRequested_eur ?? 0),
    0,
  );

  const fmtEur = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
              <CircleDollarSign className="h-3 w-3" />
              {t("eyebrow")}
            </p>
            <h1
              className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
          </div>
          <Link
            href={`/${locale}/p/projects/new`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-forest-800"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t("newProject")}
          </Link>
        </div>

        {/* KPIs synthétiques */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Kpi
            label={t("kpiGranted")}
            value={fmtEur.format(totalGranted)}
            color="text-forest-700"
          />
          <Kpi
            label={t("kpiInProgress")}
            value={`${INITIAL_REQUESTS.filter((r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW").length}`}
            color="text-amber-700"
          />
          <Kpi
            label={t("kpiEstimate")}
            value={fmtEur.format(totalExpected)}
            color="text-night-700"
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cream-300">
        <button
          type="button"
          onClick={() => setTab("tracker")}
          className={[
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors",
            tab === "tracker"
              ? "border-b-2 border-forest-700 text-forest-900"
              : "text-stone-500 hover:text-forest-700",
          ].join(" ")}
        >
          <ClipboardList className="h-4 w-4" />
          {t("tabTracker")}
        </button>
        <button
          type="button"
          onClick={() => setTab("library")}
          className={[
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors",
            tab === "library"
              ? "border-b-2 border-forest-700 text-forest-900"
              : "text-stone-500 hover:text-forest-700",
          ].join(" ")}
        >
          <BookOpen className="h-4 w-4" />
          {t("tabLibrary")}
        </button>
      </div>

      {tab === "tracker" && (
        <MyAidsTracker initialRequests={INITIAL_REQUESTS} />
      )}

      {tab === "library" && (
        <div className="space-y-3">
          <p className="text-sm text-stone-600">{t("libraryIntro")}</p>
          {AID_PROGRAMS.map((p) => (
            <Card key={p.shortFr}>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                      <HandCoins className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-serif text-base font-bold text-forest-900">
                        {p.shortFr}
                      </p>
                      <p className="text-xs text-stone-600">{p.emitter}</p>
                      <p className="mt-1 text-sm text-forest-700">{p.ceil}</p>
                    </div>
                  </div>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-900"
                  >
                    {t("officialSource")}
                    <ChevronRight className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-cream-300 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className={`mt-1 font-serif text-2xl font-bold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}
