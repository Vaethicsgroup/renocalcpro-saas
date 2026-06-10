// app/[locale]/o/projects/[id]/aides/page.tsx — Devis v2 (chiffrage + aides détaillées)
"use client";

import { FileText, Download, Send, CheckCircle2, Clock, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface AideLine {
  id: string;
  name: string;
  shortLabel: string;
  amount: number;
  status: "ELIGIBLE" | "DEMANDEE" | "ACCORDEE" | "VERSEE" | "REFUSEE";
  conditions: string;
  delayWeeks: string;
}

const AIDES: ReadonlyArray<AideLine> = [
  { id: "a1", name: "MaPrimeRénov' Parcours Accompagné", shortLabel: "MPR Accompagné", amount: 18500, status: "DEMANDEE", conditions: "Audit + bouquet 2+ gestes + gain ≥ 2 classes DPE", delayWeeks: "4 à 6 mois" },
  { id: "a2", name: "Coup de Pouce CEE – PAC air/eau", shortLabel: "Coup de Pouce CEE PAC", amount: 5000, status: "ELIGIBLE", conditions: "Sortie chaudière gaz · Installateur RGE QualiPAC", delayWeeks: "1 à 2 mois" },
  { id: "a3", name: "Coup de Pouce CEE – Isolation combles", shortLabel: "CEE Isolation", amount: 1500, status: "ELIGIBLE", conditions: "R ≥ 7 m²·K/W · Installateur RGE", delayWeeks: "1 à 2 mois" },
  { id: "a4", name: "Éco-PTZ Performance globale", shortLabel: "Éco-PTZ", amount: 50000, status: "ELIGIBLE", conditions: "Audit énergétique + bouquet de travaux · accord bancaire", delayWeeks: "1 à 3 mois" },
  { id: "a5", name: "TVA réduite 5,5 %", shortLabel: "TVA 5,5 %", amount: 6800, status: "VERSEE", conditions: "Travaux éligibles + RGE · attestation simplifiée signée par le client", delayWeeks: "Immédiat" },
  { id: "a6", name: "Aide locale PACA Rénov Énergie", shortLabel: "PACA Rénov", amount: 2500, status: "ELIGIBLE", conditions: "Résidence principale en Provence-Alpes-Côte d'Azur", delayWeeks: "3 à 5 mois" },
];

const STATUS_META: Record<AideLine["status"], { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  ELIGIBLE: { label: "Éligible", color: "bg-stone-100 text-stone-700", Icon: Info },
  DEMANDEE: { label: "Demandée", color: "bg-info-100 text-info-800", Icon: Clock },
  ACCORDEE: { label: "Accordée", color: "bg-forest-100 text-forest-800", Icon: CheckCircle2 },
  VERSEE: { label: "Versée", color: "bg-forest-200 text-forest-800", Icon: CheckCircle2 },
  REFUSEE: { label: "Refusée", color: "bg-red-100 text-red-700", Icon: AlertTriangle },
};

export default function DevisPage() {
  const fmtEur = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

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
            Devis & financement
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Chiffrage global et aides mobilisables pour le scénario recommandé.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 text-sm font-semibold text-forest-700 hover:bg-cream-50">
            <Download className="h-4 w-4" />
            Exporter PDF
          </button>
          <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white hover:bg-forest-800">
            <Send className="h-4 w-4" />
            Envoyer au client
          </button>
        </div>
      </div>

      {/* Synthèse financière */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BigKpi label="Coût travaux TTC" value={fmtEur(totalCoutTTC)} color="text-forest-900" />
            <BigKpi label="Subventions" value={`−${fmtEur(subventionnables)}`} color="text-forest-700" />
            <BigKpi label="Éco-PTZ mobilisable" value={fmtEur(pretMobilisable)} color="text-info-700" />
            <BigKpi label="Reste à charge final" value={fmtEur(totalRAC)} color="text-night-700" highlight />
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
              <h3 className="font-serif text-lg font-bold text-forest-900">Aides mobilisables ({AIDES.length})</h3>
              <p className="text-xs text-stone-600">Tableau de synthèse à transmettre avec le devis client.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-cream-200">
            <table className="w-full text-sm">
              <thead className="bg-cream-50">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  <th className="px-3 py-2 text-left">Aide</th>
                  <th className="hidden px-3 py-2 text-left lg:table-cell">Conditions</th>
                  <th className="px-3 py-2 text-right">Montant</th>
                  <th className="px-3 py-2 text-center">Délai</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {AIDES.map((a) => {
                  const meta = STATUS_META[a.status];
                  const Icon = meta.Icon;
                  return (
                    <tr key={a.id} className="hover:bg-cream-50">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-forest-900">{a.shortLabel}</p>
                        <p className="text-[11px] text-stone-500">{a.name}</p>
                      </td>
                      <td className="hidden px-3 py-3 text-[11px] text-stone-600 lg:table-cell">
                        {a.conditions}
                      </td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums text-forest-900">
                        {fmtEur(a.amount)}
                      </td>
                      <td className="px-3 py-3 text-center text-[11px] text-stone-600">{a.delayWeeks}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-forest-50">
                <tr className="text-sm font-bold text-forest-900">
                  <td className="px-3 py-2.5" colSpan={2}>Total subventions + prêt mobilisable</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtEur(totalAides)}</td>
                  <td className="px-3 py-2.5" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-3 rounded-md border border-info-200 bg-info-50/40 p-2 text-xs text-info-900">
            <Info className="mr-1.5 inline h-3 w-3" />
            <strong>Note auditeur :</strong> les délais d&apos;instruction sont indicatifs et basés sur les statistiques 2024-2025 des organismes payeurs (Anah, obligés CEE, banques).
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
