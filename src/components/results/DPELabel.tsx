// components/results/DPELabel.tsx — Étiquette DPE A→G premium v2.0
// Variants : compact (badge unique) | full (échelle entière) | beforeAfter (avant/après)
"use client";

import { useTranslations } from "next-intl";

type DpeClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

const DPE_COLORS: Record<DpeClass, string> = {
  A: "#319e3d",
  B: "#52b047",
  C: "#a3c63b",
  D: "#f3e02e",
  E: "#f5b400",
  F: "#ed7c2a",
  G: "#dc1f2c",
};

const DPE_RANGES: Record<DpeClass, string> = {
  A: "≤ 50",
  B: "51-90",
  C: "91-150",
  D: "151-230",
  E: "231-330",
  F: "331-450",
  G: "> 450",
};

const DPE_TEXT_COLOR: Record<DpeClass, string> = {
  A: "text-white", B: "text-white", C: "text-stone-900",
  D: "text-stone-900", E: "text-stone-900", F: "text-white", G: "text-white",
};

interface CompactProps {
  variant?: "compact";
  classification: DpeClass;
  size?: "sm" | "md" | "lg";
}

interface FullProps {
  variant: "full";
  current?: DpeClass;
}

interface BeforeAfterProps {
  variant: "beforeAfter";
  before: DpeClass;
  after: DpeClass;
}

type Props = CompactProps | FullProps | BeforeAfterProps;

export function DPELabel(props: Props) {
  if (props.variant === "full") return <FullScale current={props.current} />;
  if (props.variant === "beforeAfter") return <BeforeAfter before={props.before} after={props.after} />;
  return <Compact classification={props.classification} size={props.size ?? "md"} />;
}

function Compact({ classification, size }: { classification: DpeClass; size: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-10 w-10 text-base",
    lg: "h-16 w-16 text-3xl",
  };
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-md font-bold shadow-soft",
        sizeClasses[size],
        DPE_TEXT_COLOR[classification],
      ].join(" ")}
      style={{ backgroundColor: DPE_COLORS[classification] }}
      title={`Classe DPE ${classification} — ${DPE_RANGES[classification]} kWh/m²/an`}
      aria-label={`Classe énergétique ${classification}`}
    >
      {classification}
    </span>
  );
}

function FullScale({ current }: { current?: DpeClass }) {
  const fullT = useTranslations("dpeLabel");
  const classes: DpeClass[] = ["A", "B", "C", "D", "E", "F", "G"];
  return (
    <div className="space-y-1.5" role="img" aria-label={current ? `DPE ${current}` : "DPE"}>
      {classes.map((c, i) => {
        const width = 35 + i * 9;
        const active = c === current;
        return (
          <div key={c} className="flex items-center gap-3">
            <div
              className={[
                "flex h-8 items-center justify-end rounded pr-2 font-bold shadow-soft transition-all",
                DPE_TEXT_COLOR[c],
                active ? "ring-4 ring-stone-900/10 scale-105" : "",
              ].join(" ")}
              style={{ backgroundColor: DPE_COLORS[c], width: `${width}%` }}
            >
              {c}
            </div>
            <span className={["text-xs", active ? "font-semibold text-stone-900" : "text-stone-500"].join(" ")}>
              {DPE_RANGES[c]} {fullT("unit")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BeforeAfter({ before, after }: { before: DpeClass; after: DpeClass }) {
  const t = useTranslations("dpeLabel");
  return (
    <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-soft">
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xs font-semibold uppercase tracking-wider text-stone-500">{t("before")}</span>
        <Compact classification={before} size="lg" />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <svg viewBox="0 0 60 24" className="h-6 w-16 text-success-600" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h45M40 5l10 7-10 7" />
        </svg>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xs font-semibold uppercase tracking-wider text-success-700">{t("afterWorks")}</span>
        <Compact classification={after} size="lg" />
      </div>
    </div>
  );
}
