// app/[locale]/o/library/materials/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bibliothèque matériaux pro v2 — catalogue exhaustif avec croquis SVG,
// R/λ/coût/épaisseurs, avantages/inconvénients, compatibilité, badges
// innovant/biosourcé. Recherche + filtres catégorie + origine.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  Leaf,
  Sparkles,
  Library,
  Settings2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  MATERIALS_CATALOG,
  ORIGIN_COLORS,
  rForThickness,
  type MaterialCategory,
  type MaterialOrigin,
  type MaterialSpec,
} from "@/lib/calc/catalog/materials-library";
import { MaterialIcon } from "@/components/library/MaterialIcon";

const CATEGORY_ORDER: ReadonlyArray<MaterialCategory> = [
  "MUR",
  "ISOLANT",
  "TOITURE",
  "VITRAGE",
  "MEMBRANE",
  "PLANCHER_BAS",
  "FINITION",
];
const ORIGIN_ORDER: ReadonlyArray<MaterialOrigin> = [
  "BIOSOURCE",
  "GEOSOURCE",
  "MINERAL",
  "MINERAL_RECYCLE",
  "SYNTHETIQUE",
  "INNOVANT",
  "CONVENTIONNEL",
];

const CATEGORY_KEY: Record<MaterialCategory, string> = {
  MUR: "catMur", ISOLANT: "catIsolant", TOITURE: "catToiture", VITRAGE: "catVitrage",
  MEMBRANE: "catMembrane", PLANCHER_BAS: "catPlancherBas", FINITION: "catFinition",
};
const ORIGIN_KEY: Record<MaterialOrigin, string> = {
  BIOSOURCE: "originBio", GEOSOURCE: "originGeo", MINERAL: "originMineral",
  MINERAL_RECYCLE: "originMineralRecycle", SYNTHETIQUE: "originSynth",
  INNOVANT: "originInnov", CONVENTIONNEL: "originConv",
};

export default function MaterialsLibPage() {
  const t = useTranslations("matLib");
  const tName = useTranslations("matCatNames");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    MaterialCategory | "ALL"
  >("ALL");
  const [originFilter, setOriginFilter] = useState<MaterialOrigin | "ALL">(
    "ALL",
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...MATERIALS_CATALOG];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (m) => {
          let translatedName = "";
          try { translatedName = tName(m.id).toLowerCase(); } catch { /* clé manquante */ }
          return m.nameFr.toLowerCase().includes(s) ||
            translatedName.includes(s) ||
            (m.synonymsFr ?? []).some((n) => n.toLowerCase().includes(s)) ||
            m.applicationsFr.some((a) => a.toLowerCase().includes(s));
        },
      );
    }
    if (categoryFilter !== "ALL") {
      list = list.filter((m) => m.category === categoryFilter);
    }
    if (originFilter !== "ALL") {
      list = list.filter((m) => m.origin === originFilter);
    }
    return list;
  }, [search, categoryFilter, originFilter]);

  const innovativeCount = MATERIALS_CATALOG.filter((m) => m.innovative).length;
  const biosourceCount = MATERIALS_CATALOG.filter(
    (m) => m.origin === "BIOSOURCE",
  ).length;

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
              <Library className="h-3 w-3" />
              {t("eyebrow")}
            </p>
            <h1
              className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              {t("headerStats", { total: MATERIALS_CATALOG.length, bio: biosourceCount, innov: innovativeCount })}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-cream-300 bg-white px-3 text-sm font-semibold text-forest-900 shadow-sm hover:bg-cream-50"
          >
            <Settings2 className="h-4 w-4" />
            {t("btnOverrides")}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPh")}
                className="h-10 w-full rounded-md border border-cream-300 pl-9 pr-3 text-sm focus:border-forest-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterPill
                active={categoryFilter === "ALL"}
                onClick={() => setCategoryFilter("ALL")}
              >
                {t("filterAll", { count: MATERIALS_CATALOG.length })}
              </FilterPill>
              {CATEGORY_ORDER.map((cat) => {
                const count = MATERIALS_CATALOG.filter(
                  (m) => m.category === cat,
                ).length;
                if (count === 0) return null;
                return (
                  <FilterPill
                    key={cat}
                    active={categoryFilter === cat}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {t("filterCat", { cat: t(CATEGORY_KEY[cat]), count })}
                  </FilterPill>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                {t("originLabel")}
              </span>
              <FilterPill
                small
                active={originFilter === "ALL"}
                onClick={() => setOriginFilter("ALL")}
              >
                {t("filterAllSimple")}
              </FilterPill>
              {ORIGIN_ORDER.map((origin) => (
                <FilterPill
                  key={origin}
                  small
                  active={originFilter === origin}
                  onClick={() => setOriginFilter(origin)}
                  icon={
                    origin === "BIOSOURCE" ? (
                      <Leaf className="h-3 w-3" />
                    ) : origin === "INNOVANT" ? (
                      <Sparkles className="h-3 w-3" />
                    ) : null
                  }
                >
                  {t(ORIGIN_KEY[origin])}
                </FilterPill>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-8 text-center text-sm text-stone-600">
              {t("noResults")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              isOpen={openId === m.id}
              onToggle={() => setOpenId(openId === m.id ? null : m.id)}
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
  icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  small?: boolean;
  icon?: React.ReactNode;
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
      {icon}
      <span className="font-semibold">{children}</span>
    </button>
  );
}

function MaterialCard({
  material: m,
  isOpen,
  onToggle,
}: {
  material: MaterialSpec;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("matLib");
  const tName = useTranslations("matCatNames");
  const tMat = useTranslations("matCatContent");
  const locale = useLocale();
  let translatedName = m.nameFr;
  try { translatedName = tName(m.id); } catch { /* fallback FR */ }
  const tx = (field: string, items: readonly string[]) =>
    items.map((fr, idx) => {
      try { return tMat(`${m.id}.${field}.${idx}`); } catch { return fr; }
    });
  const appsTx = tx("apps", m.applicationsFr);
  const prosTx = tx("pros", m.prosFr);
  const consTx = tx("cons", m.consFr);
  const compatTx = tx("compat", m.compatibleWithFr);
  const incompatTx = tx("incompat", m.incompatibleWithFr);
  const labelsTx = m.labelsFr ? tx("labels", m.labelsFr) : null;
  const fmtNum = (n: number, digits = 2) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);

  const typicalThickness = m.costHTPerM2.typical_mm;
  const typicalR = rForThickness(m.lambda_W_mK, typicalThickness);
  const originColor = ORIGIN_COLORS[m.origin];

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
            <MaterialIcon kind={m.iconKey} className="h-12 w-12" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              <h3 className="truncate font-serif text-base font-bold text-forest-900">
                {translatedName}
              </h3>
              {m.innovative && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-terracotta-100 px-1.5 py-0.5 text-[9px] font-bold text-terracotta-800">
                  <Sparkles className="h-2.5 w-2.5" />
                  {t("badgeInnov")}
                </span>
              )}
              {m.mprBiosourceEligible && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-forest-100 px-1.5 py-0.5 text-[9px] font-bold text-forest-800">
                  <Leaf className="h-2.5 w-2.5" />
                  {t("badgeMpr")}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[11px] text-stone-600">
              {appsTx.slice(0, 2).join(" · ")}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${originColor}`}
              >
                {t(ORIGIN_KEY[m.origin])}
              </span>
              <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">
                {t(CATEGORY_KEY[m.category])}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-cream-200">
        <Kpi label="λ" value={fmtNum(m.lambda_W_mK, 3)} unit="W/m·K" />
        <Kpi
          label={`R (${typicalThickness} mm)`}
          value={fmtNum(typicalR, 2)}
          unit="m²·K/W"
          highlight={typicalR >= 3.7}
        />
        <Kpi
          label={t("costHT")}
          value={`${m.costHTPerM2.min}-${m.costHTPerM2.max} €`}
          unit="/ m²"
        />
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-center gap-1 border-t border-cream-200 py-2 text-xs font-semibold text-forest-700 hover:bg-cream-50"
      >
        {isOpen ? t("btnHide") : t("btnShow")}
        {isOpen ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-cream-200 bg-cream-50/30 p-3 text-xs">
          <div>
            <p className="font-semibold text-forest-900">
              {t("secThicknesses")}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {m.thicknessesAvailable_mm.map((t) => (
                <span
                  key={t}
                  className="rounded border border-cream-300 bg-white px-1.5 py-0.5 font-mono text-[10px]"
                >
                  {t < 1000 ? `${t} mm` : `${t / 1000} m`}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {m.Cp_J_kgK && <Spec label="Cp" value={`${m.Cp_J_kgK} J/kg·K`} />}
            {m.rho_kg_m3 && <Spec label="ρ" value={`${m.rho_kg_m3} kg/m³`} />}
            {m.dephasage_h_20cm && (
              <Spec
                label={t("phaseShift")}
                value={`${m.dephasage_h_20cm} h`}
                highlight={m.dephasage_h_20cm >= 10}
              />
            )}
            {m.euroclassFire && (
              <Spec
                label={t("fireReact")}
                value={m.euroclassFire}
                highlight={["A1", "A2"].includes(m.euroclassFire)}
              />
            )}
          </div>

          {m.prosFr.length > 0 && (
            <div>
              <p className="flex items-center gap-1 font-semibold text-forest-900">
                <Check className="h-3 w-3 text-forest-700" />
                {t("secAdvantages")}
              </p>
              <ul className="mt-1 space-y-0.5 pl-4 text-stone-700">
                {prosTx.map((p, i) => (
                  <li key={i} className="list-disc">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {m.consFr.length > 0 && (
            <div>
              <p className="flex items-center gap-1 font-semibold text-forest-900">
                <X className="h-3 w-3 text-red-600" />
                {t("secDisadvantages")}
              </p>
              <ul className="mt-1 space-y-0.5 pl-4 text-stone-700">
                {consTx.map((c, i) => (
                  <li key={i} className="list-disc">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {m.compatibleWithFr.length > 0 && (
              <div className="rounded-md border border-forest-200 bg-forest-50/50 p-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-forest-800">
                  <Check className="h-3 w-3" />
                  {t("secCompatible")}
                </p>
                <ul className="mt-1 space-y-0.5 text-[11px] text-stone-700">
                  {compatTx.map((c, i) => (
                    <li key={i}>· {c}</li>
                  ))}
                </ul>
              </div>
            )}
            {m.incompatibleWithFr.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50/40 p-2">
                <p className="flex items-center gap-1 text-[11px] font-bold text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  {t("secIncompatible")}
                </p>
                <ul className="mt-1 space-y-0.5 text-[11px] text-stone-700">
                  {incompatTx.map((c, i) => (
                    <li key={i}>· {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {(m.labelsFr || m.notesFr || m.historicalPeriodFr) && (
            <div className="rounded-md border border-cream-300 bg-white p-2 text-[11px] text-stone-600">
              {labelsTx && (
                <p>
                  <strong className="text-forest-900">{t("labelLabels")}</strong>{" "}
                  {labelsTx.join(" · ")}
                </p>
              )}
              {m.historicalPeriodFr && (
                <p>
                  <strong className="text-forest-900">{t("labelPeriod")}</strong>{" "}
                  {m.historicalPeriodFr}
                </p>
              )}
              {m.notesFr && <p className="mt-1 italic">{m.notesFr}</p>}
            </div>
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
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded border border-cream-200 bg-white px-2 py-1">
      <p className="text-[9px] uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[11px] font-bold ${
          highlight ? "text-forest-700" : "text-forest-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
