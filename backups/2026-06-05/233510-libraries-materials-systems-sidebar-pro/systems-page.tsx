// app/[locale]/o/library/systems/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bibliothèque systèmes énergétiques pro v2 — 30+ systèmes (résidentiel +
// tertiaire + collectif) incluant réseaux urbains (CPCU, Climespace), PV,
// PAC, GTB, etc.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Sparkles,
  Library,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  Leaf,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  SYSTEMS_CATALOG,
  SYSTEM_CATEGORY_LABELS_FR,
  ENERGY_SOURCE_LABELS_FR,
  TARGET_SEGMENT_LABELS_FR,
  type SystemCategory,
  type EnergySource,
  type TargetSegment,
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
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export default function SystemsLibPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SystemCategory | "ALL">(
    "ALL",
  );
  const [segmentFilter, setSegmentFilter] = useState<TargetSegment | "ALL">(
    "ALL",
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...SYSTEMS_CATALOG];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (sys) =>
          sys.nameFr.toLowerCase().includes(s) ||
          (sys.synonymsFr ?? []).some((n) => n.toLowerCase().includes(s)) ||
          sys.recommendedForFr.some((r) => r.toLowerCase().includes(s)),
      );
    }
    if (categoryFilter !== "ALL") {
      list = list.filter((sys) => sys.category === categoryFilter);
    }
    if (segmentFilter !== "ALL") {
      list = list.filter((sys) => sys.targetSegments.includes(segmentFilter));
    }
    return list;
  }, [search, categoryFilter, segmentFilter]);

  const innovativeCount = SYSTEMS_CATALOG.filter((s) => s.innovative).length;
  const renewableCount = SYSTEMS_CATALOG.filter((s) =>
    ["SOLAIRE_PV", "SOLAIRE_THERMIQUE", "BOIS_BUCHE", "BOIS_GRANULE", "RESEAU_CHALEUR", "ELEC_AEROTHERMIE", "ELEC_GEOTHERMIE"].includes(s.energySource),
  ).length;

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
              <Library className="h-3 w-3" />
              Bibliothèque
            </p>
            <h1
              className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Systèmes énergétiques
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              <strong>{SYSTEMS_CATALOG.length}</strong> systèmes référencés ·{" "}
              <strong className="text-forest-700">{renewableCount}</strong>{" "}
              renouvelables ·{" "}
              <strong className="text-terracotta-700">{innovativeCount}</strong>{" "}
              innovants
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un système (PAC, CPCU, PV, GTB…)"
                className="h-10 w-full rounded-md border border-cream-300 pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterPill
                active={categoryFilter === "ALL"}
                onClick={() => setCategoryFilter("ALL")}
              >
                Tous ({SYSTEMS_CATALOG.length})
              </FilterPill>
              {CATEGORY_ORDER.map((cat) => {
                const count = SYSTEMS_CATALOG.filter(
                  (s) => s.category === cat,
                ).length;
                if (count === 0) return null;
                return (
                  <FilterPill
                    key={cat}
                    active={categoryFilter === cat}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {SYSTEM_CATEGORY_LABELS_FR[cat]} ({count})
                  </FilterPill>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Segment :
              </span>
              <FilterPill
                small
                active={segmentFilter === "ALL"}
                onClick={() => setSegmentFilter("ALL")}
              >
                Tous
              </FilterPill>
              {(Object.keys(TARGET_SEGMENT_LABELS_FR) as TargetSegment[]).map(
                (seg) => (
                  <FilterPill
                    key={seg}
                    small
                    active={segmentFilter === seg}
                    onClick={() => setSegmentFilter(seg)}
                  >
                    {TARGET_SEGMENT_LABELS_FR[seg]}
                  </FilterPill>
                ),
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-8 text-center text-sm text-stone-600">
              Aucun système ne correspond aux filtres.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <SystemCard
              key={s.id}
              system={s}
              isOpen={openId === s.id}
              onToggle={() => setOpenId(openId === s.id ? null : s.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
  small,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1 rounded-full border transition-colors",
        small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        active
          ? "border-forest-700 bg-forest-700 text-white shadow-sm"
          : "border-cream-300 bg-white text-stone-700 hover:border-forest-300 hover:text-forest-700",
      ].join(" ")}
    >
      <span className="font-semibold">{children}</span>
    </button>
  );
}

function SystemCard({
  system: s,
  isOpen,
  onToggle,
}: {
  system: SystemSpec;
  isOpen: boolean;
  onToggle: () => void;
}) {
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
    <article
      className={[
        "overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all",
        isOpen
          ? "border-forest-300 shadow-md"
          : "border-cream-200 hover:border-forest-200 hover:shadow-md",
      ].join(" ")}
    >
      <div className="border-b border-cream-200 bg-cream-50/40 p-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg border border-cream-300 bg-white p-1.5">
            <SystemIcon kind={s.iconKey} className="h-12 w-12" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              <h3 className="truncate font-serif text-base font-bold text-forest-900">
                {s.nameFr}
              </h3>
              {s.innovative && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-terracotta-100 px-1.5 py-0.5 text-[9px] font-bold text-terracotta-800">
                  <Sparkles className="h-2.5 w-2.5" />
                  INNOVANT
                </span>
              )}
              {isRenewable && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-forest-100 px-1.5 py-0.5 text-[9px] font-bold text-forest-800">
                  <Leaf className="h-2.5 w-2.5" />
                  EnR
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-stone-600">
              {ENERGY_SOURCE_LABELS_FR[s.energySource]} ·{" "}
              {SYSTEM_CATEGORY_LABELS_FR[s.category]}
            </p>
            {s.geoRestrictionFr && (
              <p className="mt-0.5 text-[10px] italic text-terracotta-700">
                📍 {s.geoRestrictionFr}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-cream-200">
        <Kpi
          label={s.efficiencyKind}
          value={s.efficiencyOrCOP.toFixed(s.efficiencyKind === "ETA" ? 2 : 1)}
          unit={s.efficiencyKind === "ETA" || s.efficiencyKind === "ETAS" ? "rendement" : "—"}
          highlight={
            (s.efficiencyKind === "COP" || s.efficiencyKind === "SCOP") &&
            s.efficiencyOrCOP >= 3.5
          }
        />
        <Kpi
          label="Install"
          value={fmtEur(costAvg)}
          unit="moyen HT"
        />
        <Kpi
          label="CO₂"
          value={`${s.co2_gCO2eq_per_kWhUseful} g`}
          unit="/ kWh"
          highlight={s.co2_gCO2eq_per_kWhUseful < 50}
        />
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-center gap-1 border-t border-cream-200 py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50"
      >
        {isOpen ? "Masquer le détail" : "Voir le détail"}
        {isOpen ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-cream-200 bg-cream-50/30 p-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <Spec
              label="Puissance"
              value={`${s.powerKW.min}-${s.powerKW.max} kW`}
            />
            <Spec
              label="Durée de vie"
              value={`${s.lifetimeYears} ans`}
            />
            {s.energyCost_EUR_per_kWh && (
              <Spec
                label="Énergie €/kWh"
                value={`${s.energyCost_EUR_per_kWh.toFixed(3)} €`}
              />
            )}
            {s.annualMaintenance_EUR && (
              <Spec
                label="Entretien/an"
                value={`${s.annualMaintenance_EUR} €`}
              />
            )}
          </div>

          {s.targetSegments.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Cibles
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {s.targetSegments.map((seg) => (
                  <span
                    key={seg}
                    className="rounded bg-info-50 px-1.5 py-0.5 text-[10px] font-semibold text-info-700"
                  >
                    {TARGET_SEGMENT_LABELS_FR[seg]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {s.recommendedForFr.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Recommandé pour
              </p>
              <p className="mt-0.5 text-stone-700">
                {s.recommendedForFr.join(" · ")}
              </p>
            </div>
          )}

          {s.prosFr.length > 0 && (
            <div>
              <p className="flex items-center gap-1 font-semibold text-forest-900">
                <Check className="h-3 w-3 text-forest-700" />
                Avantages
              </p>
              <ul className="mt-1 space-y-0.5 pl-4 text-stone-700">
                {s.prosFr.map((p) => (
                  <li key={p} className="list-disc">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {s.consFr.length > 0 && (
            <div>
              <p className="flex items-center gap-1 font-semibold text-forest-900">
                <X className="h-3 w-3 text-red-600" />
                Inconvénients
              </p>
              <ul className="mt-1 space-y-0.5 pl-4 text-stone-700">
                {s.consFr.map((c) => (
                  <li key={c} className="list-disc">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {s.compatibleWithFr.length > 0 && (
              <div className="rounded-md border border-forest-200 bg-forest-50/50 p-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-forest-800">
                  <Check className="h-3 w-3" />
                  Compatible avec
                </p>
                <ul className="mt-1 space-y-0.5 text-[11px] text-stone-700">
                  {s.compatibleWithFr.map((c) => (
                    <li key={c}>· {c}</li>
                  ))}
                </ul>
              </div>
            )}
            {s.incompatibleWithFr.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50/40 p-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  À éviter
                </p>
                <ul className="mt-1 space-y-0.5 text-[11px] text-stone-700">
                  {s.incompatibleWithFr.map((c) => (
                    <li key={c}>· {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {s.aidsAvailableFr.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50/60 p-2">
              <p className="text-[11px] font-bold text-amber-900">
                💰 Aides disponibles
              </p>
              <ul className="mt-1 space-y-0.5 text-[11px] text-stone-700">
                {s.aidsAvailableFr.map((a) => (
                  <li key={a}>· {a}</li>
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
      )}
    </article>
  );
}

function Kpi({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white p-2 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm font-bold tabular-nums ${
          highlight ? "text-forest-700" : "text-forest-900"
        }`}
      >
        {value}
      </p>
      <p className="text-[9px] text-stone-500">{unit}</p>
    </div>
  );
}

function Spec({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded border border-cream-200 bg-white px-2 py-1">
      <p className="text-[9px] uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className="mt-0.5 text-[11px] font-bold text-forest-900">{value}</p>
    </div>
  );
}
