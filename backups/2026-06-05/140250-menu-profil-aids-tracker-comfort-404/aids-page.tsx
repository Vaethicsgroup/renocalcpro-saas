// app/[locale]/p/projects/[id]/aids/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Onglet Aides v2.4 :
//   - vue éligibilité (AidsBreakdown existant)
//   - vue suivi des demandes (MyAidsTracker) avec statuts + délais officiels
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { AidsBreakdown } from "@/components/results/AidsBreakdown";
import { MyAidsTracker } from "@/components/aids/MyAidsTracker";
import type { AidRequest } from "@/lib/calc/aids/tracking";
import { HandCoins, ClipboardList } from "lucide-react";

const INITIAL_REQUESTS: AidRequest[] = [
  {
    aidId: "mpr-iso-mur-ite",
    shortLabelFr: "MaPrimeRénov' ITE — Murs extérieurs",
    status: "PLANNED",
    amountRequested_eur: 5400,
  },
  {
    aidId: "mpr-pac-air-eau",
    shortLabelFr: "MaPrimeRénov' PAC air/eau",
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
    notes: "Facture et attestation RGE envoyées le 10/04.",
  },
  {
    aidId: "eco-ptz-individuel",
    shortLabelFr: "Éco-PTZ — Banque",
    status: "UNDER_REVIEW",
    submittedAt: "2026-05-05",
    amountRequested_eur: 30000,
    notes: "Dossier en cours chez Crédit Agricole.",
  },
  {
    aidId: "tva-5-5-renov-energetique",
    shortLabelFr: "TVA 5,5 % rénovation",
    status: "PAID",
    submittedAt: "2026-04-15",
    respondedAt: "2026-04-15",
    amountGranted_eur: 2150,
    notes: "Appliquée automatiquement sur les devis artisans.",
  },
];

export default function AidsPage() {
  const [tab, setTab] = useState<"eligible" | "tracker">("tracker");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">
          Financement
        </p>
        <h2
          className="mt-1 font-serif text-2xl font-bold text-forest-900 sm:text-3xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Mes aides
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-forest-900/65">
          Suivi des demandes que vous avez sollicitées, avec délais
          d&apos;instruction officiels, statuts et montants accordés.
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
          Suivi de mes demandes
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
          Aides mobilisables
        </button>
      </div>

      {tab === "tracker" ? (
        <MyAidsTracker initialRequests={INITIAL_REQUESTS} />
      ) : (
        <AidsBreakdown
          totalCost={45_800}
          aids={[
            {
              id: "mpr",
              name: "MaPrimeRénov' Sérénité (catégorie Jaune)",
              amount: 12_500,
              status: "eligible",
              conditions:
                "Saut de 3 classes DPE confirmé · accompagnement Mon Accompagnateur Rénov' inclus",
            },
            {
              id: "cee",
              name: "Coup de pouce CEE — Chauffage",
              amount: 4_000,
              status: "eligible",
              conditions: "PAC air-eau A++ avec installateur RGE QualiPAC",
            },
            {
              id: "ptz",
              name: "Éco-PTZ Performance globale",
              amount: 30_000,
              status: "eligible",
              conditions:
                "Prêt à 0 % sur 20 ans · accord bancaire requis (33 % d'endettement max)",
            },
            {
              id: "tva",
              name: "TVA réduite 5,5 % (intégrée aux devis artisans)",
              amount: 2_150,
              status: "eligible",
              conditions: "Logement > 2 ans + RGE · automatique",
            },
            {
              id: "regional",
              name: "Aide régionale Nouvelle-Aquitaine — Rénov' Habitat",
              amount: 0,
              status: "conditional",
              conditions:
                "Cumul possible si revenus < seuil régional · à vérifier auprès du conseil régional",
            },
          ]}
        />
      )}
    </div>
  );
}
