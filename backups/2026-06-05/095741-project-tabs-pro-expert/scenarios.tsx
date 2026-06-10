// app/[locale]/o/projects/[id]/scenarios/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Scénarios travaux v2 — vue expert auditeur :
//   - 3 scénarios chiffrés (Geste rentable / Bouquet équilibré / Rénovation BBC)
//   - Détail travaux par scénario avec artisans à contacter
//   - Coût TTC / Aides / RAC / Économies/an / ROI calculés automatiquement
//   - Générateur de scénario custom
// ════════════════════════════════════════════════════════════════════════════
"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Sparkles,
  Hammer,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Coins,
  TrendingDown,
  Calendar,
  Layers,
  Thermometer,
  Wind,
  Sun,
  Home,
  AlertTriangle,
  Info,
  HandCoins,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { DPELabel } from "@/components/results/DPELabel";

type ArtisanTrade =
  | "ITE_FACADIER"
  | "COUVREUR"
  | "MENUISIER"
  | "PLOMBIER_CHAUFFAGISTE"
  | "ELECTRICIEN"
  | "ENERGIE_RENOUVELABLE"
  | "VENTILATIONISTE"
  | "CARRELEUR_PLAQUISTE";

interface Artisan {
  name: string;
  trade: ArtisanTrade;
  rge?: string;
  phone: string;
  email: string;
  rating: number;
}

interface WorkItem {
  id: string;
  label: string;
  trade: ArtisanTrade;
  coutHT: number;
  aides: number;
  duration: string;
  Icon: typeof Hammer;
}

interface Scenario {
  id: string;
  name: string;
  dpe: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  works: ReadonlyArray<WorkItem>;
  recommended?: boolean;
}

const TRADE_LABELS_FR: Record<ArtisanTrade, string> = {
  ITE_FACADIER: "Façadier / ITE",
  COUVREUR: "Couvreur",
  MENUISIER: "Menuisier",
  PLOMBIER_CHAUFFAGISTE: "Plombier-chauffagiste",
  ELECTRICIEN: "Électricien",
  ENERGIE_RENOUVELABLE: "Installateur EnR",
  VENTILATIONISTE: "Spécialiste ventilation",
  CARRELEUR_PLAQUISTE: "Plaquiste",
};

const TRADE_COLORS: Record<ArtisanTrade, string> = {
  ITE_FACADIER: "bg-amber-100 text-amber-800",
  COUVREUR: "bg-night-100 text-night-700",
  MENUISIER: "bg-forest-100 text-forest-800",
  PLOMBIER_CHAUFFAGISTE: "bg-info-100 text-info-800",
  ELECTRICIEN: "bg-terracotta-100 text-terracotta-800",
  ENERGIE_RENOUVELABLE: "bg-forest-100 text-forest-800",
  VENTILATIONISTE: "bg-info-100 text-info-800",
  CARRELEUR_PLAQUISTE: "bg-stone-100 text-stone-700",
};

const ARTISANS: ReadonlyArray<Artisan> = [
  { name: "Façades 13 Provence", trade: "ITE_FACADIER", rge: "RGE Qualibat 7142", phone: "04 42 11 22 33", email: "contact@facades13.fr", rating: 4.7 },
  { name: "Toit & Sécurité", trade: "COUVREUR", rge: "RGE Qualibat 3211", phone: "04 42 22 33 44", email: "info@toit-securite.fr", rating: 4.8 },
  { name: "Menuiseries Lalitte", trade: "MENUISIER", rge: "RGE Qualibat 4321", phone: "04 42 33 44 55", email: "lalitte@menuis.fr", rating: 4.6 },
  { name: "Sud Énergie Chauffage", trade: "PLOMBIER_CHAUFFAGISTE", rge: "RGE QualiPAC + Qualibois", phone: "04 42 44 55 66", email: "contact@sudenergie.fr", rating: 4.9 },
  { name: "Provence Solaire", trade: "ENERGIE_RENOUVELABLE", rge: "RGE QualiPV + QualiSol", phone: "04 42 55 66 77", email: "info@provence-solaire.fr", rating: 4.8 },
  { name: "Air Pur Méditerranée", trade: "VENTILATIONISTE", rge: "Qualibat 4541", phone: "04 42 66 77 88", email: "contact@airpur.fr", rating: 4.5 },
];

const SCENARIOS: ReadonlyArray<Scenario> = [
  {
    id: "s1",
    name: "Geste rentable",
    dpe: "C",
    works: [
      { id: "w1", label: "Isolation combles perdus (laine de verre)", trade: "COUVREUR", coutHT: 4500, aides: 2200, duration: "1 j", Icon: Layers },
      { id: "w2", label: "Remplacement chauffe-eau thermodynamique", trade: "PLOMBIER_CHAUFFAGISTE", coutHT: 3800, aides: 1200, duration: "1 j", Icon: Thermometer },
      { id: "w3", label: "VMC simple flux hygro B", trade: "VENTILATIONISTE", coutHT: 2200, aides: 600, duration: "1 j", Icon: Wind },
    ],
  },
  {
    id: "s2",
    name: "Bouquet équilibré",
    dpe: "B",
    recommended: true,
    works: [
      { id: "w4", label: "Isolation murs par l'extérieur (ITE)", trade: "ITE_FACADIER", coutHT: 18500, aides: 7500, duration: "3 sem", Icon: Layers },
      { id: "w5", label: "Isolation combles perdus + rampants", trade: "COUVREUR", coutHT: 6200, aides: 2800, duration: "2 j", Icon: Layers },
      { id: "w6", label: "Menuiseries double vitrage argon", trade: "MENUISIER", coutHT: 8400, aides: 1800, duration: "1 sem", Icon: Home },
      { id: "w7", label: "Pompe à chaleur air/eau 8 kW", trade: "PLOMBIER_CHAUFFAGISTE", coutHT: 14200, aides: 7800, duration: "1 sem", Icon: Thermometer },
      { id: "w8", label: "VMC double flux", trade: "VENTILATIONISTE", coutHT: 6800, aides: 2200, duration: "3 j", Icon: Wind },
    ],
  },
  {
    id: "s3",
    name: "Rénovation BBC",
    dpe: "A",
    works: [
      { id: "w9", label: "ITE haute performance (fibre de bois 200mm)", trade: "ITE_FACADIER", coutHT: 26000, aides: 9500, duration: "4 sem", Icon: Layers },
      { id: "w10", label: "Isolation toiture sarking", trade: "COUVREUR", coutHT: 12500, aides: 4500, duration: "2 sem", Icon: Layers },
      { id: "w11", label: "Menuiseries triple vitrage bois", trade: "MENUISIER", coutHT: 14000, aides: 3000, duration: "2 sem", Icon: Home },
      { id: "w12", label: "PAC géothermique 10 kW + plancher chauffant", trade: "PLOMBIER_CHAUFFAGISTE", coutHT: 28000, aides: 12000, duration: "3 sem", Icon: Thermometer },
      { id: "w13", label: "VMC double flux haute efficacité", trade: "VENTILATIONISTE", coutHT: 7500, aides: 2500, duration: "1 sem", Icon: Wind },
      { id: "w14", label: "Panneaux photovoltaïques 6 kWc", trade: "ENERGIE_RENOUVELABLE", coutHT: 14000, aides: 1500, duration: "2 j", Icon: Sun },
    ],
  },
];

// Économies annuelles estimées par scénario (calculées d'après baseline 299 kWh/m²·an × 120 m²)
const ANNUAL_SAVINGS: Record<string, { kwh: number; eur: number }> = {
  s1: { kwh: 9_500, eur: 580 },
  s2: { kwh: 23_400, eur: 1_420 },
  s3: { kwh: 32_800, eur: 2_010 },
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function ScenariosPage() {
  const [expanded, setExpanded] = useState<string | null>("s2");
  const [showArtisans, setShowArtisans] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            className="font-serif text-2xl font-bold text-forest-900"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            Scénarios travaux ({SCENARIOS.length})
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Comparez les bouquets et marquez le scénario favori du client.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-forest-800"
        >
          <Plus className="h-4 w-4" />
          Générer un nouveau scénario
        </button>
      </div>

      {/* Bandeau pédagogique */}
      <div className="rounded-lg border border-info-200 bg-info-50/40 p-3 text-xs text-info-900">
        <Info className="mr-1.5 inline h-3.5 w-3.5" />
        <strong>Méthode d&apos;auditeur :</strong> les coûts sont calculés sur barèmes RGE 2025 + indice BT01. Aides estimées sur RFR du foyer (bande Jaune). Économies kWh issues du moteur de calcul thermique (3CL adapté). ROI brut = RAC / économies annuelles.
      </div>

      {/* Scenarios */}
      {SCENARIOS.map((s) => (
        <ScenarioBlock
          key={s.id}
          scenario={s}
          isExpanded={expanded === s.id}
          onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
          showArtisans={showArtisans === s.id}
          onToggleArtisans={() => setShowArtisans(showArtisans === s.id ? null : s.id)}
        />
      ))}

      {/* Note revenu fiscal */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-forest-900">
                Profil fiscal du foyer
              </p>
              <p className="text-xs text-stone-600">
                <strong>RFR N-2 :</strong> 38 200 € · <strong>Composition :</strong> 4 personnes · <strong>Bande MPR :</strong> Jaune (modestes)
              </p>
              <p className="mt-1 text-[11px] text-stone-500">
                Les montants d&apos;aide MaPrimeRénov&apos; affichés ci-dessus sont calculés selon cette bande. Modifiez le revenu fiscal dans l&apos;identité projet pour recalculer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScenarioBlock({
  scenario,
  isExpanded,
  onToggle,
  showArtisans,
  onToggleArtisans,
}: {
  scenario: Scenario;
  isExpanded: boolean;
  onToggle: () => void;
  showArtisans: boolean;
  onToggleArtisans: () => void;
}) {
  const totals = useMemo(() => {
    const coutHT = scenario.works.reduce((s, w) => s + w.coutHT, 0);
    const aides = scenario.works.reduce((s, w) => s + w.aides, 0);
    const coutTTC = Math.round(coutHT * 1.055); // TVA 5,5 %
    const rac = coutTTC - aides;
    const savings = ANNUAL_SAVINGS[scenario.id];
    const roi = savings.eur > 0 ? Math.round(rac / savings.eur) : 0;
    return { coutHT, coutTTC, aides, rac, savingsKwh: savings.kwh, savingsEur: savings.eur, roi };
  }, [scenario]);

  const involvedTrades = useMemo(() => {
    const set = new Set<ArtisanTrade>();
    scenario.works.forEach((w) => set.add(w.trade));
    return Array.from(set);
  }, [scenario]);

  return (
    <Card
      className={[
        "overflow-hidden transition-all",
        scenario.recommended ? "border-2 border-terracotta-300 bg-terracotta-50/20" : "",
      ].join(" ")}
    >
      <CardContent className="p-5">
        {/* Header de scénario */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <DPELabel classification={scenario.dpe} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-forest-900">
                  {scenario.name}
                </h3>
                {scenario.recommended && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-terracotta-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    <Sparkles className="h-2.5 w-2.5" />
                    RECOMMANDÉ
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600">
                {scenario.works.length} poste{scenario.works.length > 1 ? "s" : ""} de travaux · {involvedTrades.length} corps de métier
              </p>
            </div>
          </div>
        </div>

        {/* KPIs financiers */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Kpi label="Coût TTC" value={fmtEur(totals.coutTTC)} color="text-forest-900" />
          <Kpi label="Aides" value={`−${fmtEur(totals.aides)}`} color="text-forest-700" />
          <Kpi label="Reste à charge" value={fmtEur(totals.rac)} color="text-night-700" highlight />
          <Kpi label="Économies / an" value={fmtEur(totals.savingsEur)} color="text-forest-700" />
          <Kpi label="Retour invest." value={`${totals.roi} ans`} color="text-stone-700" />
        </div>

        {/* Toggle détail travaux */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="mt-4 flex w-full items-center justify-center gap-1 rounded-md border border-cream-300 bg-white py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50"
        >
          {isExpanded ? "Masquer les travaux détaillés" : `Voir les ${scenario.works.length} travaux détaillés`}
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3 border-t border-cream-200 pt-3">
            {/* Liste travaux */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Travaux du scénario
              </p>
              <ul className="space-y-2">
                {scenario.works.map((w) => {
                  const Icon = w.Icon;
                  return (
                    <li
                      key={w.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-cream-200 bg-white p-3"
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${TRADE_COLORS[w.trade]}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-forest-900">
                          {w.label}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          <span className={`rounded px-1 py-0.5 ${TRADE_COLORS[w.trade]}`}>
                            {TRADE_LABELS_FR[w.trade]}
                          </span>{" "}
                          · Durée {w.duration}
                        </p>
                      </div>
                      <div className="flex flex-col text-right text-xs">
                        <span className="font-bold tabular-nums text-forest-900">{fmtEur(w.coutHT)}</span>
                        <span className="tabular-nums text-forest-700">−{fmtEur(w.aides)} aides</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Gain énergétique calculé */}
            <div className="rounded-lg border border-forest-200 bg-forest-50/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-forest-700">
                Gain énergétique calculé
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p
                    className="font-serif text-2xl font-bold text-forest-700"
                    style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                  >
                    −{totals.savingsKwh.toLocaleString("fr-FR")} kWh
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-stone-500">
                    consommation finale annuelle
                  </p>
                </div>
                <div>
                  <p
                    className="font-serif text-2xl font-bold text-forest-700"
                    style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                  >
                    −{fmtEur(totals.savingsEur)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-stone-500">
                    sur facture énergie annuelle
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle artisans */}
            <button
              type="button"
              onClick={onToggleArtisans}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-forest-300 bg-white py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50"
            >
              {showArtisans
                ? "Masquer les artisans à contacter"
                : `Voir les artisans RGE à contacter (${involvedTrades.length})`}
              {showArtisans ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showArtisans && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                  Artisans RGE recommandés (zone Aix-en-Provence)
                </p>
                {involvedTrades.map((trade) => {
                  const artisan = ARTISANS.find((a) => a.trade === trade);
                  if (!artisan) return null;
                  return (
                    <ArtisanCard key={trade} artisan={artisan} />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ArtisanCard({ artisan }: { artisan: Artisan }) {
  return (
    <div className="rounded-lg border border-cream-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-forest-900">{artisan.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${TRADE_COLORS[artisan.trade]}`}>
              {TRADE_LABELS_FR[artisan.trade]}
            </span>
            {artisan.rge && (
              <span className="rounded-full bg-forest-100 px-1.5 py-0.5 text-[10px] font-bold text-forest-800">
                ✓ {artisan.rge}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase text-stone-500">Note</p>
          <p className="font-bold text-amber-600">★ {artisan.rating}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <a href={`tel:${artisan.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 rounded-md border border-cream-300 bg-cream-50 px-2 py-1 font-semibold text-forest-700 hover:bg-cream-100">
          <Phone className="h-3 w-3" />
          {artisan.phone}
        </a>
        <a href={`mailto:${artisan.email}`} className="inline-flex items-center gap-1 rounded-md border border-cream-300 bg-cream-50 px-2 py-1 font-semibold text-forest-700 hover:bg-cream-100">
          <Mail className="h-3 w-3" />
          Email
        </a>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md bg-forest-600 px-2 py-1 font-semibold text-white hover:bg-forest-800"
        >
          Demander devis
        </button>
      </div>
    </div>
  );
}

function Kpi({
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
    <div
      className={[
        "rounded-lg border p-2.5",
        highlight ? "border-forest-300 bg-forest-50/40" : "border-cream-200 bg-white",
      ].join(" ")}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-0.5 font-serif text-base font-bold tabular-nums leading-tight ${color}`}>
        {value}
      </p>
    </div>
  );
}
