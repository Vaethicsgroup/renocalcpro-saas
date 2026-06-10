// app/[locale]/p/projects/[id]/aids/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Onglet Aides v2.4 :
//   - vue éligibilité (AidsBreakdown existant)
//   - vue suivi des demandes (MyAidsTracker) avec statuts + délais officiels
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AidsBreakdown } from "@/components/results/AidsBreakdown";
import { MyAidsTracker } from "@/components/aids/MyAidsTracker";
import type { AidRequest } from "@/lib/calc/aids/tracking";
import { HandCoins, ClipboardList } from "lucide-react";

export default function AidsPage() {
  const t = useTranslations("aidsTracker");
  const [tab, setTab] = useState<"eligible" | "tracker">("tracker");

  const INITIAL_REQUESTS: AidRequest[] = [
    {
      aidId: "mpr-iso-mur-ite",
      shortLabelFr: t("demoAidMprIte"),
      status: "PLANNED",
      amountRequested_eur: 5400,
    },
    {
      aidId: "mpr-pac-air-eau",
      shortLabelFr: t("demoAidMprPac"),
      status: "SUBMITTED",
      submittedAt: "2026-05-20",
      expectedResponseAt: "2026-07-22",
      amountRequested_eur: 4000,
    },
    {
      aidId: "cee-coup-de-pouce-pac",
      shortLabelFr: t("demoAidCeePac"),
      status: "GRANTED",
      submittedAt: "2026-04-10",
      respondedAt: "2026-05-15",
      amountRequested_eur: 5000,
      amountGranted_eur: 5000,
      notes: t("demoNoteCee"),
    },
    {
      aidId: "eco-ptz-individuel",
      shortLabelFr: t("demoAidEcoPtz"),
      status: "UNDER_REVIEW",
      submittedAt: "2026-05-05",
      amountRequested_eur: 30000,
      notes: t("demoNoteEcoPtz"),
    },
    {
      aidId: "tva-5-5-renov-energetique",
      shortLabelFr: t("demoAidTva"),
      status: "PAID",
      submittedAt: "2026-04-15",
      respondedAt: "2026-04-15",
      amountGranted_eur: 2150,
      notes: t("demoNoteTva"),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">
          {t("headingFinancing")}
        </p>
        <h2
          className="mt-1 font-serif text-2xl font-bold text-forest-900 sm:text-3xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("headingMyAids")}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-forest-900/65">
          {t("headingDescription")}
        </p>
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
          onClick={() => setTab("eligible")}
          className={[
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors",
            tab === "eligible"
              ? "border-b-2 border-forest-700 text-forest-900"
              : "text-stone-500 hover:text-forest-700",
          ].join(" ")}
        >
          <HandCoins className="h-4 w-4" />
          {t("tabEligible")}
        </button>
      </div>

      {tab === "tracker" ? (
        <MyAidsTracker initialRequests={INITIAL_REQUESTS} />
      ) : (
        <AidsBreakdown
          totalCost={45_800}
          aids={[
            { id: "mpr",      name: t("demoAid1"), amount: 12_500, status: "eligible",    conditions: t("demoAid1Cond") },
            { id: "cee",      name: t("demoAid2"), amount: 4_000,  status: "eligible",    conditions: t("demoAid2Cond") },
            { id: "ptz",      name: t("demoAid3"), amount: 30_000, status: "eligible",    conditions: t("demoAid3Cond") },
            { id: "tva",      name: t("demoAid4"), amount: 2_150,  status: "eligible",    conditions: t("demoAid4Cond") },
            { id: "regional", name: t("demoAid5"), amount: 0,      status: "conditional", conditions: t("demoAid5Cond") },
          ]}
        />
      )}
    </div>
  );
}
