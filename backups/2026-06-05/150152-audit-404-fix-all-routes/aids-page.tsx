// app/[locale]/p/aids/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Page "Mes aides" — vue globale agrégée des aides demandées sur tous les
// dossiers du user. Tab "Suivi" + tab "Mobilisables" + tab "Bibliothèque".
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import Link from "next/link";
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

const INITIAL_REQUESTS: AidRequest[] = [
  {
    aidId: "mpr-iso-mur-ite",
    shortLabelFr: "MaPrimeRénov' ITE — Maison des Tilleuls",
    status: "PLANNED",
    amountRequested_eur: 5400,
  },
  {
    aidId: "mpr-pac-air-eau",
    shortLabelFr: "MaPrimeRénov' PAC air/eau — Maison des Tilleuls",
    status: "SUBMITTED",
    submittedAt: "2026-05-20",
    expectedResponseAt: "2026-07-22",
    amountRequested_eur: 4000,
  },
  {
    aidId: "cee-coup-de-pouce-pac",
    shortLabelFr: "Coup de Pouce CEE — PAC",
    status: "GRANTED",
    submittedAt: "2026-04-10",
    respondedAt: "2026-05-15",
    amountRequested_eur: 5000,
    amountGranted_eur: 5000,
  },
  {
    aidId: "eco-ptz-individuel",
    shortLabelFr: "Éco-PTZ — Crédit Agricole",
    status: "UNDER_REVIEW",
    submittedAt: "2026-05-05",
    amountRequested_eur: 30000,
  },
  {
    aidId: "tva-5-5-renov-energetique",
    shortLabelFr: "TVA 5,5 % — Devis artisans",
    status: "PAID",
    submittedAt: "2026-04-15",
    respondedAt: "2026-04-15",
    amountGranted_eur: 2150,
  },
];

const AID_PROGRAMS: ReadonlyArray<{
  shortFr: string;
  emitter: string;
  ceil: string;
  href: string;
}> = [
  {
    shortFr: "MaPrimeRénov'",
    emitter: "Anah",
    ceil: "Jusqu'à 70 % du devis (modestes)",
    href: "https://www.france-renov.gouv.fr",
  },
  {
    shortFr: "MaPrimeRénov' Parcours Accompagné",
    emitter: "Anah",
    ceil: "63 000 € plafond rénovation globale",
    href: "https://www.france-renov.gouv.fr",
  },
  {
    shortFr: "Coup de Pouce CEE",
    emitter: "Obligés énergie",
    ceil: "5 000 € PAC + 12 €/m² isolation",
    href: "https://www.ecologie.gouv.fr/coup-pouce-economies-denergie",
  },
  {
    shortFr: "Éco-PTZ",
    emitter: "Banques partenaires",
    ceil: "50 000 € sans intérêt sur 20 ans",
    href: "https://www.service-public.fr/particuliers/vosdroits/F19905",
  },
  {
    shortFr: "TVA 5,5 %",
    emitter: "État",
    ceil: "Économie ~14,5 % sur devis HT",
    href: "https://www.service-public.fr/particuliers/vosdroits/F31988",
  },
  {
    shortFr: "MaPrimeAdapt'",
    emitter: "Anah (autonomie)",
    ceil: "70 % de 22 000 € pour seniors/handicap",
    href: "https://www.france-renov.gouv.fr/aides/maprimeadapt",
  },
];

export default function MesAidesPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fr";
  const [tab, setTab] = useState<"tracker" | "library">("tracker");

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

  const fmtEur = new Intl.NumberFormat("fr-FR", {
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
              Financement
            </p>
            <h1
              className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Mes aides
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Suivi de toutes les aides demandées et catalogue des dispositifs
              mobilisables.
            </p>
          </div>
          <Link
            href={`/${locale}/p/projects/new`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-forest-800"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nouveau projet
          </Link>
        </div>

        {/* KPIs synthétiques */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Kpi
            label="Total accordé / versé"
            value={fmtEur.format(totalGranted)}
            color="text-forest-700"
          />
          <Kpi
            label="Demandes en cours"
            value={`${INITIAL_REQUESTS.filter((r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW").length}`}
            color="text-amber-700"
          />
          <Kpi
            label="Estimation totale"
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
          Suivi de mes demandes
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
          Bibliothèque des aides
        </button>
      </div>

      {tab === "tracker" && (
        <MyAidsTracker initialRequests={INITIAL_REQUESTS} />
      )}

      {tab === "library" && (
        <div className="space-y-3">
          <p className="text-sm text-stone-600">
            Tous les dispositifs nationaux mobilisables en rénovation
            énergétique 2025.
          </p>
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
                    Source officielle
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
