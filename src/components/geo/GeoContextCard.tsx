// src/components/geo/GeoContextCard.tsx
// Affiche le contexte géographique enrichi (commune, INSEE, zone climatique,
// altitude, DJU, ensoleillement, parcelle cadastrale) avec source/confiance
// par champ. Permet à l'utilisateur de surcharger l'altitude manuellement.
//
// 100% i18n — aucune string utilisateur n'est hardcodée.

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  enrichGeoFromBanFeature,
  type GeoBuildingContext,
  type GeoEnrichmentResult,
  type GeoSourceQuality,
} from "@/lib/geo/building-geo-context";
import type { BanFeature } from "@/lib/geo/banGeocoding";

interface Props {
  /** Feature BAN sélectionnée. Si null, on rend un état vide. */
  feature: BanFeature | null;
  /** Altitude saisie manuellement (priorité sur l'auto). */
  manualAltitudeM?: number | null;
  /** Callback de mise à jour altitude (optionnel — si non fourni, lecture seule). */
  onAltitudeChange?: (m: number | null) => void;
}

export function GeoContextCard({ feature, manualAltitudeM, onAltitudeChange }: Props) {
  const t = useTranslations("geoContext");
  const tSources = useTranslations("geoSources");
  const tClimate = useTranslations("climateData");

  // Détails climatiques masqués par défaut sur mobile (UX compacte).
  const [showDetails, setShowDetails] = useState(false);

  const result: GeoEnrichmentResult = useMemo(
    () => enrichGeoFromBanFeature(feature, { manualAltitudeM }),
    [feature, manualAltitudeM],
  );
  const ctx = result.context;

  const confidenceLabel =
    result.overallConfidence === "high"   ? t("confidenceHigh")
    : result.overallConfidence === "medium" ? t("confidenceMedium")
    : result.overallConfidence === "low"  ? t("confidenceLow")
    :                                       t("confidenceUnknown");
  const confidenceClass =
    result.overallConfidence === "high"   ? "bg-emerald-100 text-emerald-900 border-emerald-300"
    : result.overallConfidence === "medium" ? "bg-teal-100 text-teal-900 border-teal-300"
    : result.overallConfidence === "low"  ? "bg-amber-100 text-amber-900 border-amber-300"
    :                                       "bg-stone-100 text-stone-700 border-stone-300";

  return (
    <section
      className="rounded-2xl border border-forest-200 bg-forest-50/30 p-4"
      aria-label={t("title")}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
            <MapPin className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-forest-900">{t("title")}</h3>
            <p className="mt-0.5 text-xs text-forest-900/70">{t("subtitle")}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-2xs font-bold uppercase tracking-wider ${confidenceClass}`}>
          {confidenceLabel}
        </span>
      </header>

      {/* Grille "Essentiels" — toujours visibles, mobile-first */}
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("labelCity")} value={ctx.city} source={ctx.sources.city.quality} tSources={tSources} />
        <Field
          label={t("labelClimate")}
          value={ctx.climateZone ? tClimate(ctx.climateZone) : null}
          source={ctx.sources.climateZone.quality}
          tSources={tSources}
        />

        {/* Altitude — éditable si callback fourni */}
        <div className="flex flex-col gap-1">
          <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
            {t("labelAltitude")}
          </dt>
          {onAltitudeChange ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={3000}
                value={manualAltitudeM ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  onAltitudeChange(raw === "" ? null : Number(raw));
                }}
                placeholder={t("altitudeMissing")}
                className="h-9 w-28 rounded-md border border-cream-300 bg-white px-2 text-sm focus:border-forest-500 focus:outline-none"
              />
              <SourceBadge source={ctx.sources.altitudeM.quality} tSources={tSources} />
            </div>
          ) : (
            <Value value={ctx.altitudeM != null ? String(ctx.altitudeM) : null} source={ctx.sources.altitudeM.quality} tSources={tSources} fallback={t("altitudeMissing")} />
          )}
        </div>

        <Field
          label={t("labelDju")}
          value={ctx.heatingDegreeDays != null
            ? `${ctx.heatingDegreeDays} ${tClimate("djuUnit")}`
            : null}
          source={ctx.sources.heatingDegreeDays.quality}
          tSources={tSources}
        />
      </dl>

      {/* Bouton toggle détails — compact mobile */}
      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        aria-expanded={showDetails}
        className="mt-3 inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-2xs font-semibold text-stone-700 hover:bg-stone-50"
      >
        {showDetails ? t("hideDetails") : t("showDetails")}
        {showDetails ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
      </button>

      {/* Détails climatiques — collapsible */}
      {showDetails && (
        <dl className="mt-3 grid grid-cols-1 gap-3 border-t border-forest-200/60 pt-3 sm:grid-cols-2">
          <Field label={t("labelAddress")} value={ctx.addressLabel} source={ctx.sources.addressLabel.quality} tSources={tSources} />
          <Field
            label={t("labelCoordinates")}
            value={ctx.latitude != null && ctx.longitude != null
              ? `${ctx.latitude.toFixed(5)}, ${ctx.longitude.toFixed(5)}`
              : null}
            source={ctx.sources.latitude.quality}
            tSources={tSources}
          />
          <Field label={t("labelPostalCode")} value={ctx.postalCode} source={ctx.sources.postalCode.quality} tSources={tSources} />
          <Field label={t("labelInsee")} value={ctx.inseeCode} source={ctx.sources.inseeCode.quality} tSources={tSources} />
          <Field label={t("labelDepartment")} value={ctx.departmentCode} source={ctx.sources.departmentCode.quality} tSources={tSources} />
          <Field label={t("labelRegion")} value={ctx.region} source={ctx.sources.region.quality} tSources={tSources} />
          <Field
            label={t("labelAvgTemp")}
            value={ctx.averageOutdoorTempC != null
              ? `${ctx.averageOutdoorTempC.toFixed(1)} ${tClimate("avgTempUnit")}`
              : null}
            source={ctx.sources.averageOutdoorTempC.quality}
            tSources={tSources}
          />
          <Field
            label={t("labelSolar")}
            value={ctx.solarIrradiationKwhM2Year != null
              ? `${ctx.solarIrradiationKwhM2Year} ${tClimate("solarUnit")}`
              : null}
            source={ctx.sources.solarIrradiationKwhM2Year.quality}
            tSources={tSources}
          />
          <Field
            label={t("labelCadastre")}
            value={ctx.cadastralParcelId}
            source={ctx.sources.cadastralParcelId.quality}
            tSources={tSources}
            fallback={t("cadastralMissing")}
          />
        </dl>
      )}

      {/* Warnings — toujours i18n */}
      {ctx.warnings.length > 0 && (
        <ul className="mt-4 space-y-1">
          {ctx.warnings.map((wKey) => (
            <li
              key={wKey}
              className="flex items-start gap-1.5 text-xs text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
              {/* useTranslations() supporte les clés à `.` quand l'arbre est plat */}
              <span>{t(wKey.replace("geoContext.", "") as never)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Hint utilisateur */}
      <p className="mt-3 text-2xs italic text-stone-500">{t("overrideHint")}</p>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function Field({
  label, value, source, tSources, fallback,
}: {
  label: string;
  value: string | null;
  source: GeoSourceQuality;
  tSources: (k: string) => string;
  fallback?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
      <Value value={value} source={source} tSources={tSources} fallback={fallback} />
    </div>
  );
}

function Value({
  value, source, tSources, fallback,
}: {
  value: string | null;
  source: GeoSourceQuality;
  tSources: (k: string) => string;
  fallback?: string;
}) {
  if (!value) {
    return <dd className="text-sm text-stone-400 italic">{fallback ?? "—"}</dd>;
  }
  return (
    <dd className="flex flex-wrap items-center gap-2 text-sm text-stone-800">
      <span>{value}</span>
      <SourceBadge source={source} tSources={tSources} />
    </dd>
  );
}

function SourceBadge({
  source, tSources,
}: {
  source: GeoSourceQuality;
  tSources: (k: string) => string;
}) {
  const cls =
    source === "OFFICIAL_BAN"          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
    : source === "INFERRED_FROM_POSTAL" ? "bg-teal-100 text-teal-900 border-teal-300"
    : source === "INFERRED_FROM_DEPT"   ? "bg-teal-100 text-teal-900 border-teal-300"
    : source === "ESTIMATED_BY_ZONE"    ? "bg-amber-100 text-amber-900 border-amber-300"
    : source === "MANUAL_OVERRIDE"      ? "bg-stone-100 text-stone-700 border-stone-300"
    :                                    "bg-stone-50 text-stone-400 border-stone-200";
  return (
    <span
      className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}
      title={tSources(source)}
    >
      {tSources(source)}
    </span>
  );
}
