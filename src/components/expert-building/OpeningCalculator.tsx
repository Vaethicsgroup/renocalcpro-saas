// src/components/expert-building/OpeningCalculator.tsx
// Prototype calculateur d'ouvertures (mode expert).
// - Saisie largeur × hauteur × nb d'ouvertures identiques
// - Saisie vitrage + châssis + gaz + faible émissivité
// - Calcule surface + Uw estimé en temps réel
//
// 100% i18n — aucune string hardcodée.
// Ne touche pas au wizard existant.

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  calculateOpeningArea,
  estimateUwFromGlazing,
} from "@/lib/expert-building/calculations";
import type {
  GasFill,
  GlazingParam,
  WindowFrameMaterial,
} from "@/lib/expert-building/types";

const GLAZINGS: GlazingParam[] = ["SIMPLE", "DOUBLE", "TRIPLE", "OVERGLAZE"];
const FRAMES: WindowFrameMaterial[] = [
  "WOOD", "PVC", "ALU_THERMAL_BREAK", "ALU_NO_THERMAL_BREAK",
  "MIXED_WOOD_ALU", "STEEL",
];
const GASES: GasFill[] = ["AIR", "ARGON", "KRYPTON"];

export function OpeningCalculator() {
  const t = useTranslations("expertOpenings");

  const [widthCm, setWidthCm]   = useState<number>(120);
  const [heightCm, setHeightCm] = useState<number>(140);
  const [count, setCount]       = useState<number>(1);
  const [glazingType, setGlazingType] = useState<GlazingParam>("DOUBLE");
  const [frame, setFrame]       = useState<WindowFrameMaterial>("PVC");
  const [gas, setGas]           = useState<GasFill>("ARGON");
  const [lowE, setLowE]         = useState<boolean>(true);

  const area = calculateOpeningArea(widthCm, heightCm, count);
  const uw = estimateUwFromGlazing({
    glazingType,
    frameMaterial: frame,
    gasFill: gas,
    lowEmissivity: lowE,
  });

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft"
      aria-label={t("calculatorTitle")}
    >
      <header>
        <h3 className="text-base font-semibold text-stone-900">{t("calculatorTitle")}</h3>
        <p className="mt-1 text-xs text-stone-600">{t("calculatorSubtitle")}</p>
      </header>

      {/* Dimensions */}
      <fieldset className="mt-4 grid grid-cols-3 gap-3">
        <NumberField
          id="op-width"
          label={t("fieldWidth")}
          value={widthCm}
          onChange={setWidthCm}
          unit={t("unitCm")}
        />
        <NumberField
          id="op-height"
          label={t("fieldHeight")}
          value={heightCm}
          onChange={setHeightCm}
          unit={t("unitCm")}
        />
        <NumberField
          id="op-count"
          label={t("fieldCount")}
          value={count}
          onChange={setCount}
          unit={t("unitCount")}
        />
      </fieldset>

      {/* Vitrage */}
      <fieldset className="mt-4 grid grid-cols-2 gap-3">
        <SelectField
          id="op-glazing"
          label={t("fieldGlazing")}
          value={glazingType}
          options={GLAZINGS.map((g) => ({ value: g, label: t(`glazing.${g}`) }))}
          onChange={(v) => setGlazingType(v as GlazingParam)}
        />
        <SelectField
          id="op-frame"
          label={t("fieldFrame")}
          value={frame}
          options={FRAMES.map((f) => ({ value: f, label: t(`frame.${f}`) }))}
          onChange={(v) => setFrame(v as WindowFrameMaterial)}
        />
        <SelectField
          id="op-gas"
          label={t("fieldGas")}
          value={gas}
          options={GASES.map((g) => ({ value: g, label: t(`gas.${g}`) }))}
          onChange={(v) => setGas(v as GasFill)}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-stone-700">{t("fieldLowE")}</span>
          <label className="flex h-10 items-center gap-2 rounded-md border border-cream-300 bg-white px-3 text-sm">
            <input
              type="checkbox"
              checked={lowE}
              onChange={(e) => setLowE(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-forest-600 focus:ring-forest-300"
            />
            <span>{lowE ? t("yes") : t("no")}</span>
          </label>
        </label>
      </fieldset>

      {/* Résultats calculés */}
      <section className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-forest-200 bg-forest-50/40 p-4">
        <ResultField
          label={t("resultTotalArea")}
          value={area != null ? `${area} ${t("unitM2")}` : "—"}
          hint={t("resultAreaHint")}
        />
        <ResultField
          label={t("resultUw")}
          value={uw != null ? `${uw} ${t("unitUw")}` : "—"}
          hint={t("resultUwHint")}
        />
      </section>

      <p className="mt-3 text-2xs italic text-stone-500">{t("estimationNotice")}</p>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function NumberField({
  id, label, value, onChange, unit,
}: {
  id: string; label: string; value: number; onChange: (n: number) => void; unit: string;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-stone-700">{label}</span>
      <div className="flex h-10 items-center gap-2">
        <input
          id={id}
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-10 w-full rounded-md border border-cream-300 bg-white px-3 text-sm focus:border-forest-500 focus:outline-none"
        />
        <span className="text-xs text-stone-500">{unit}</span>
      </div>
    </label>
  );
}

function SelectField({
  id, label, value, options, onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-stone-700">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-cream-300 bg-white px-3 text-sm focus:border-forest-500 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ResultField({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-0.5 font-serif text-2xl font-bold tabular-nums text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
        {value}
      </p>
      <p className="mt-0.5 text-2xs text-stone-500">{hint}</p>
    </div>
  );
}
