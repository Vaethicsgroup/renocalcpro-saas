"use client";
// components/audit/InsulationDetector.tsx
// Guide pédagogique pour détecter une isolation cachée — 4 méthodes terrain
// avec schémas SVG et arbre de décision rapide.

import { useState } from "react";
import { useTranslations } from "next-intl";

type Method = "jamb" | "knock" | "thermography" | "hygrometer";
type Difficulty = "easy" | "medium" | "expert";

interface MethodInfo {
  id: Method;
  labelKey: string;
  icon: string;
  durationKey: string;
  difficulty: Difficulty;
  stepKeys: string[];
  schema: (t: (key: string) => string) => JSX.Element;
}

const METHODS: MethodInfo[] = [
  {
    id: "jamb",
    labelKey: "m1Label",
    icon: "🪟",
    durationKey: "m1Duration",
    difficulty: "easy",
    stepKeys: ["m1S1", "m1S2", "m1S3", "m1S4"],
    schema: (t) => (
      <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={t("m1SchemaAria")}>
        <rect x="40" y="30" width="220" height="140" fill="#f5f5f4" stroke="#78716c" strokeWidth="2" />
        <rect x="40" y="30" width="40" height="140" fill="#a8a29e" stroke="#57534e" strokeWidth="1" />
        <rect x="80" y="30" width="20" height="140" fill="#fde68a" stroke="#a16207" strokeWidth="1" />
        <rect x="100" y="50" width="160" height="100" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
        <line x1="40" y1="20" x2="80" y2="20" stroke="#a8a29e" strokeWidth="2" />
        <text x="60" y="14" textAnchor="middle" fontSize="9" fill="#57534e">{t("m1SchemaWall")}</text>
        <line x1="80" y1="20" x2="100" y2="20" stroke="#fde68a" strokeWidth="3" />
        <text x="90" y="14" textAnchor="middle" fontSize="9" fill="#a16207" fontWeight="700">{t("m1SchemaDoublage")}</text>
        <text x="180" y="100" fontSize="11" fill="#1e3a8a" textAnchor="middle">{t("m1SchemaWindow")}</text>
        <text x="150" y="190" textAnchor="middle" fontSize="10" fill="#1c1917">{t("m1SchemaCaption")}</text>
      </svg>
    ),
  },
  {
    id: "knock",
    labelKey: "m2Label",
    icon: "✊",
    durationKey: "m2Duration",
    difficulty: "easy",
    stepKeys: ["m2S1", "m2S2", "m2S3", "m2S4", "m2S5"],
    schema: (t) => (
      <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={t("m2SchemaAria")}>
        <rect x="60" y="40" width="180" height="120" fill="#fef3c7" stroke="#78716c" strokeWidth="2" />
        <line x1="80" y1="100" x2="100" y2="100" stroke="#dc2626" strokeWidth="3" />
        <text x="100" y="100" fontSize="14" fontWeight="700" fill="#dc2626">✊</text>
        <path d="M120 95 Q140 80 160 95" fill="none" stroke="#0d9488" strokeWidth="1" strokeDasharray="3,2" />
        <path d="M120 100 Q145 80 170 100" fill="none" stroke="#0d9488" strokeWidth="1" strokeDasharray="3,2" />
        <text x="200" y="95" fontSize="10" fill="#0d9488" fontWeight="700">tap tap</text>
        <text x="150" y="180" textAnchor="middle" fontSize="10" fill="#1c1917">{t("m2SchemaCaption")}</text>
      </svg>
    ),
  },
  {
    id: "thermography",
    labelKey: "m3Label",
    icon: "🌡️",
    durationKey: "m3Duration",
    difficulty: "medium",
    stepKeys: ["m3S1", "m3S2", "m3S3", "m3S4", "m3S5"],
    schema: (t) => (
      <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={t("m3SchemaAria")}>
        <rect x="40" y="40" width="220" height="120" fill="url(#thermoGrad)" />
        <rect x="120" y="60" width="40" height="20" fill="#fbbf24" />
        <rect x="200" y="100" width="20" height="40" fill="#dc2626" />
        <text x="40" y="35" fontSize="9" fill="#1c1917">{t("m3SchemaCold")}</text>
        <text x="240" y="35" fontSize="9" fill="#dc2626">{t("m3SchemaHot")}</text>
        <text x="140" y="74" textAnchor="middle" fontSize="9" fill="#1c1917">{t("m3SchemaBridge")}</text>
        <defs>
          <linearGradient id="thermoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <text x="150" y="190" textAnchor="middle" fontSize="10" fill="#1c1917">{t("m3SchemaCaption")}</text>
      </svg>
    ),
  },
  {
    id: "hygrometer",
    labelKey: "m4Label",
    icon: "💧",
    durationKey: "m4Duration",
    difficulty: "expert",
    stepKeys: ["m4S1", "m4S2", "m4S3", "m4S4", "m4S5"],
    schema: (t) => (
      <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={t("m4SchemaAria")}>
        <rect x="60" y="40" width="180" height="120" fill="#fef3c7" stroke="#78716c" strokeWidth="2" />
        <rect x="200" y="80" width="50" height="40" fill="#1e3a8a" rx="4" />
        <text x="225" y="95" textAnchor="middle" fontSize="9" fill="white">15.2°C</text>
        <text x="225" y="108" textAnchor="middle" fontSize="9" fill="#fbbf24">68% HR</text>
        <line x1="200" y1="100" x2="160" y2="100" stroke="#dc2626" strokeWidth="2" markerEnd="url(#dot)" />
        <defs>
          <marker id="dot" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5">
            <circle cx="2.5" cy="2.5" r="2" fill="#dc2626" />
          </marker>
        </defs>
        <text x="120" y="95" textAnchor="middle" fontSize="9" fill="#1c1917" fontWeight="700">{t("m4SchemaPoint")}</text>
        <text x="150" y="180" textAnchor="middle" fontSize="10" fill="#1c1917">{t("m4SchemaCaption")}</text>
      </svg>
    ),
  },
];

interface Props {
  /** État initial. */
  defaultMethod?: Method;
}

export function InsulationDetector({ defaultMethod = "jamb" }: Props) {
  const t = useTranslations("insulationDetector");
  const [active, setActive] = useState<Method>(defaultMethod);
  const m = METHODS.find(x => x.id === active)!;

  const difficultyColor = m.difficulty === "easy" ? "bg-emerald-100 text-emerald-900" : m.difficulty === "medium" ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-900";
  const difficultyLabel = m.difficulty === "easy" ? t("difficultyEasy") : m.difficulty === "medium" ? t("difficultyMedium") : t("difficultyExpert");

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <header className="mb-3">
        <h3 className="font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h3>
        <p className="mt-1 text-xs text-stone-600">
          {t("subtitle")}
        </p>
      </header>

      <div role="tablist" className="flex flex-wrap gap-1 border-b border-stone-200 pb-2">
        {METHODS.map(meth => (
          <button
            key={meth.id}
            type="button"
            role="tab"
            aria-selected={active === meth.id}
            onClick={() => setActive(meth.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              active === meth.id ? "bg-teal-700 text-white" : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            <span aria-hidden>{meth.icon}</span> {t(meth.labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px]">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">⏱ {t(m.durationKey)}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${difficultyColor}`}>{difficultyLabel}</span>
          </div>
          <ol className="ml-5 list-decimal space-y-2 text-sm text-stone-800 marker:font-bold marker:text-teal-700">
            {m.stepKeys.map((sKey) => <li key={sKey} dangerouslySetInnerHTML={{ __html: t(sKey).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />)}
          </ol>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-2">
          {m.schema(t)}
        </div>
      </div>

      <a
        href="/fr/help/identifier-materiaux"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-xs font-semibold text-teal-700 hover:underline"
      >
        {t("helpLink")}
      </a>
    </div>
  );
}
