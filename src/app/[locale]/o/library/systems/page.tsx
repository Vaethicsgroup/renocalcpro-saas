// app/[locale]/o/library/systems/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bibliothèque systèmes v3 — Layout table compact conforme maquette client.
// Colonnes : icône+nom / catégorie / performance / compatibilité.
// Filtres : recherche + sélecteur catégorie + bouton filtres avancés.
// Clic sur une ligne → drawer détail complet (efficacité, coûts, aides, etc.)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  Filter,
  ChevronDown,
  X,
  Sparkles,
  Leaf,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  SYSTEMS_CATALOG,
  SYSTEM_CATEGORY_LABELS_FR,
  type SystemCategory,
  type SystemSpec,
} from "@/lib/calc/catalog/systems-library";
import { SystemIcon } from "@/components/library/SystemIcon";

const CATEGORY_ORDER: ReadonlyArray<SystemCategory> = [
  "CHAUFFAGE",
  "ECS",
  "VENTILATION",
  "CLIMATISATION",
  "RESEAU_URBAIN",
  "PRODUCTION_ENR",
  "GTB",
  "EMETTEUR",
];

const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// Calcule un label de compatibilité court (A++, A+, A, B) basé sur COP/SCOP
function compatibilityLabel(s: SystemSpec): { label: string; color: string } {
  const isCop = s.efficiencyKind === "COP" || s.efficiencyKind === "SCOP" || s.efficiencyKind === "SEER";
  if (isCop) {
    if (s.efficiencyOrCOP >= 4.5) return { label: "A++", color: "bg-forest-100 text-forest-800" };
    if (s.efficiencyOrCOP >= 3.5) return { label: "A+", color: "bg-forest-100 text-forest-800" };
    if (s.efficiencyOrCOP >= 2.5) return { label: "A", color: "bg-info-100 text-info-800" };
    return { label: "B", color: "bg-amber-100 text-amber-800" };
  }
  // Pour rendement (ETA), basé sur valeur (1.0 = excellent)
  if (s.efficiencyOrCOP >= 0.95) return { label: "A+", color: "bg-forest-100 text-forest-800" };
  if (s.efficiencyOrCOP >= 0.85) return { label: "A", color: "bg-info-100 text-info-800" };
  if (s.efficiencyOrCOP >= 0.7) return { label: "B", color: "bg-amber-100 text-amber-800" };
  return { label: "C", color: "bg-stone-100 text-stone-700" };
}

function performanceLabel(s: SystemSpec): string {
  if (s.efficiencyKind === "COP" || s.efficiencyKind === "SCOP" || s.efficiencyKind === "SEER") {
    return `${s.efficiencyKind} ${s.efficiencyOrCOP.toFixed(1)}`;
  }
  if (s.efficiencyKind === "ETAS") {
    return `${Math.round(s.efficiencyOrCOP * 100)}% ETAS`;
  }
  return `η ${Math.round(s.efficiencyOrCOP * 100)}%`;
}

export default function SystemsLibPage() {
  const t = useTranslations("matLib");
  const tName = useTranslations("sysCatNames");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SystemCategory | "ALL">("ALL");
  const [selectedSystem, setSelectedSystem] = useState<SystemSpec | null>(null);

  const filtered = useMemo(() => {
    let list = [...SYSTEMS_CATALOG];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (sys) => {
          let translatedName = "";
          try { translatedName = tName(sys.id).toLowerCase(); } catch { /* clé manquante */ }
          return sys.nameFr.toLowerCase().includes(s) ||
            translatedName.includes(s) ||
            (sys.synonymsFr ?? []).some((n) => n.toLowerCase().includes(s)) ||
            sys.recommendedForFr.some((r) => r.toLowerCase().includes(s));
        },
      );
    }
    if (categoryFilter !== "ALL") {
      list = list.filter((sys) => sys.category === categoryFilter);
    }
    return list;
  }, [search, categoryFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header>
        <h1
          className="font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("sysTitle")}
        </h1>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchSystemPh")}
            className="h-10 w-full rounded-md border border-cream-300 bg-white pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none"
          />
        </div>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as SystemCategory | "ALL")}
            className="h-10 appearance-none rounded-md border border-cream-300 bg-white pl-3 pr-9 text-sm font-medium text-stone-700 focus:border-forest-500 focus:outline-none"
          >
            <option value="ALL">{t("catLabel")}</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {SYSTEM_CATEGORY_LABELS_FR[cat]}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:bg-cream-50"
        >
          <Filter className="h-4 w-4" />
          {t("filtersLabel")}
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-8 text-center text-sm text-stone-600">
              {t("noResults")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <th className="px-5 py-3">{t("thSystem")}</th>
                  <th className="hidden px-3 py-3 sm:table-cell">{t("catLabel")}</th>
                  <th className="hidden px-3 py-3 md:table-cell">Performance</th>
                  <th className="px-3 py-3 text-right">{t("thCompat")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.map((s) => {
                  const compat = compatibilityLabel(s);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSystem(s)}
                      className="cursor-pointer transition-colors hover:bg-cream-50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 rounded-md border border-cream-200 bg-white p-1">
                            <SystemIcon kind={s.iconKey} className="h-10 w-10" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-forest-900">
                              {(() => { try { return tName(s.id); } catch { return s.nameFr; } })()}
                            </p>
                            {s.innovative && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-terracotta-100 px-1.5 py-0.5 text-[9px] font-bold text-terracotta-800">
                                <Sparkles className="h-2.5 w-2.5" />
                                {t("badgeInnov")}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 text-stone-700 sm:table-cell">
                        {SYSTEM_CATEGORY_LABELS_FR[s.category]}
                      </td>
                      <td className="hidden px-3 py-3 font-semibold text-forest-700 md:table-cell">
                        {performanceLabel(s)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${compat.color}`}
                        >
                          {compat.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Drawer détail */}
      {selectedSystem && (
        <SystemDetailDrawer
          system={selectedSystem}
          onClose={() => setSelectedSystem(null)}
        />
      )}
    </div>
  );
}

// ─── Drawer détail ────────────────────────────────────────────────────────

function SystemDetailDrawer({
  system: s,
  onClose,
}: {
  system: SystemSpec;
  onClose: () => void;
}) {
  const t = useTranslations("matLib");
  const tName = useTranslations("sysCatNames");
  const tEnergy = useTranslations("energySource");
  const tSeg = useTranslations("targetSegment");
  const tSys = useTranslations("sysCatContent");
  let translatedName = s.nameFr;
  try { translatedName = tName(s.id); } catch { /* fallback FR */ }
  const compat = compatibilityLabel(s);
  // Helper : traduit un item de pros/cons/compatibles via clé `${sysId}.${field}.${index}`
  // avec fallback sur le texte FR du catalogue.
  const tx = (field: string, items: readonly string[]) =>
    items.map((fr, idx) => {
      try { return tSys(`${s.id}.${field}.${idx}`); } catch { return fr; }
    });
  const prosTx = tx("pros", s.prosFr);
  const consTx = tx("cons", s.consFr);
  const compatTx = tx("compat", s.compatibleWithFr);
  const incompatTx = tx("incompat", s.incompatibleWithFr);
  const aidsTx = tx("aids", s.aidsAvailableFr);
  const costAvg = (s.costInstall_HT.min + s.costInstall_HT.max) / 2;
  const isRenewable = [
    "SOLAIRE_PV",
    "SOLAIRE_THERMIQUE",
    "BOIS_BUCHE",
    "BOIS_GRANULE",
    "RESEAU_CHALEUR",
    "ELEC_AEROTHERMIE",
    "ELEC_GEOTHERMIE",
  ].includes(s.energySource);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-end bg-night-900/40 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full max-h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-cream-200 bg-cream-50 px-5 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="shrink-0 rounded-md border border-cream-300 bg-white p-1">
              <SystemIcon kind={s.iconKey} className="h-14 w-14" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                <h2
                  className="font-serif text-xl font-bold text-forest-900"
                  style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                >
                  {translatedName}
                </h2>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${compat.color}`}
                >
                  {compat.label}
                </span>
                {s.innovative && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-terracotta-100 px-1.5 py-0.5 text-[9px] font-bold text-terracotta-800">
                    <Sparkles className="h-2.5 w-2.5" />
                    {t("badgeInnov")}
                  </span>
                )}
                {isRenewable && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-forest-100 px-1.5 py-0.5 text-[9px] font-bold text-forest-800">
                    <Leaf className="h-2.5 w-2.5" />
                    EnR
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-stone-600">
                {(() => { try { return tEnergy(s.energySource); } catch { return s.energySource; } })()} ·{" "}
                {SYSTEM_CATEGORY_LABELS_FR[s.category]}
              </p>
              {s.geoRestrictionFr && (
                <p className="mt-0.5 text-[11px] italic text-terracotta-700">
                  📍 {s.geoRestrictionFr}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="✕"
            className="rounded-md p-1 text-stone-500 hover:bg-cream-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 px-5 py-5">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <Kpi label={s.efficiencyKind} value={performanceLabel(s)} />
            <Kpi label={t("kpiInstall")} value={fmtEur(costAvg)} />
            <Kpi label={t("kpiCo2")} value={`${s.co2_gCO2eq_per_kWhUseful} g`} />
          </div>

          {/* Méta */}
          <div className="grid grid-cols-2 gap-2">
            <Spec label={t("kpiPower")} value={`${s.powerKW.min}-${s.powerKW.max} kW`} />
            <Spec label={t("lifetime")} value={`${s.lifetimeYears} ${t("yearsUnit")}`} />
            {s.energyCost_EUR_per_kWh && (
              <Spec label={t("kpiEnergyPrice")} value={`${s.energyCost_EUR_per_kWh.toFixed(3)} €`} />
            )}
            {s.annualMaintenance_EUR && (
              <Spec label={t("kpiMaintenance")} value={`${s.annualMaintenance_EUR} €`} />
            )}
          </div>

          {/* Segments */}
          {s.targetSegments.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                {t("drawerTargets")}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {s.targetSegments.map((seg) => (
                  <span
                    key={seg}
                    className="rounded bg-info-50 px-1.5 py-0.5 text-[10px] font-semibold text-info-700"
                  >
                    {(() => { try { return tSeg(seg); } catch { return seg; } })()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pros */}
          {s.prosFr.length > 0 && (
            <div>
              <p className="flex items-center gap-1 text-sm font-semibold text-forest-900">
                <Check className="h-3 w-3 text-forest-700" />
                {t("drawerProsTitle")}
              </p>
              <ul className="mt-1 space-y-0.5 pl-4 text-xs text-stone-700">
                {prosTx.map((p, i) => (
                  <li key={i} className="list-disc">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {s.consFr.length > 0 && (
            <div>
              <p className="flex items-center gap-1 text-sm font-semibold text-forest-900">
                <X className="h-3 w-3 text-red-600" />
                {t("drawerConsTitle")}
              </p>
              <ul className="mt-1 space-y-0.5 pl-4 text-xs text-stone-700">
                {consTx.map((c, i) => (
                  <li key={i} className="list-disc">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Compatibilité */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {s.compatibleWithFr.length > 0 && (
              <div className="rounded-md border border-forest-200 bg-forest-50/50 p-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-forest-800">
                  <Check className="h-3 w-3" />
                  {t("drawerCompatTitle")}
                </p>
                <ul className="mt-1 space-y-0.5 text-[11px] text-stone-700">
                  {compatTx.map((c, i) => (
                    <li key={i}>· {c}</li>
                  ))}
                </ul>
              </div>
            )}
            {s.incompatibleWithFr.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50/40 p-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  {t("drawerAvoidTitle")}
                </p>
                <ul className="mt-1 space-y-0.5 text-[11px] text-stone-700">
                  {incompatTx.map((c, i) => (
                    <li key={i}>· {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Aides */}
          {s.aidsAvailableFr.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50/60 p-2">
              <p className="text-[11px] font-bold text-amber-900">
                💰 {t("drawerAidsTitle")}
              </p>
              <ul className="mt-1 space-y-0.5 text-[11px] text-stone-700">
                {aidsTx.map((a, i) => (
                  <li key={i}>· {a}</li>
                ))}
              </ul>
            </div>
          )}

          {s.notesFr && (
            <p className="rounded-md border border-cream-300 bg-white p-2 text-[11px] italic text-stone-600">
              {s.notesFr}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cream-200 bg-white p-2 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-forest-900">{value}</p>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-cream-200 bg-white px-2 py-1">
      <p className="text-[9px] uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-0.5 text-[11px] font-bold text-forest-900">{value}</p>
    </div>
  );
}
