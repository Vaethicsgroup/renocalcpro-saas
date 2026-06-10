"use client";
// components/audit/MeasureAssistant.tsx
// Modal pédagogique avec schémas SVG inline pour aider à mesurer correctement
// les surfaces et éléments du bâtiment.

import { useState } from "react";
import { useTranslations } from "next-intl";

type MeasureKey = "wall" | "facade" | "roof" | "window" | "floor" | "ceiling-height";

interface Tab {
  id: MeasureKey;
  labelKey: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "wall",            labelKey: "wallLabel",          icon: "🧱" },
  { id: "facade",          labelKey: "facadeLabel",        icon: "🏠" },
  { id: "roof",            labelKey: "roofLabel",          icon: "🏡" },
  { id: "window",          labelKey: "windowLabel",        icon: "🪟" },
  { id: "floor",           labelKey: "floorLabel",         icon: "📐" },
  { id: "ceiling-height",  labelKey: "ceilingHeightLabel", icon: "📏" },
];

const TIP_KEYS: Record<MeasureKey, string[]> = {
  wall: ["wallTip1", "wallTip2", "wallTip3"],
  facade: ["facadeTip1", "facadeTip2", "facadeTip3"],
  roof: ["roofTip1", "roofTip2", "roofTip3"],
  window: ["windowTip1", "windowTip2", "windowTip3"],
  floor: ["floorTip1", "floorTip2", "floorTip3"],
  "ceiling-height": ["ceilingTip1", "ceilingTip2", "ceilingTip3"],
};

// ─── SCHÉMAS SVG INLINE ─────────────────────────────────────────────────────
type TranslateFn = (key: string) => string;

const buildSchemas = (t: TranslateFn): Record<MeasureKey, JSX.Element> => ({
  wall: (
    <svg viewBox="0 0 300 180" className="w-full" role="img" aria-label={t("wallAria")}>
      <rect x="20" y="20" width="260" height="140" fill="#f5f5f4" stroke="#78716c" strokeWidth="2" />
      <rect x="100" y="50" width="50" height="80" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
      <line x1="20" y1="170" x2="280" y2="170" stroke="#0d9488" strokeWidth="2" markerEnd="url(#arrow)" markerStart="url(#arrowReverse)" />
      <text x="150" y="178" textAnchor="middle" fontSize="11" fill="#0d9488" fontWeight="600">{t("svgLength")}</text>
      <line x1="290" y1="20" x2="290" y2="160" stroke="#0d9488" strokeWidth="2" markerEnd="url(#arrow)" markerStart="url(#arrowReverse)" />
      <text x="295" y="93" fontSize="11" fill="#0d9488" fontWeight="600" transform="rotate(90 295 93)">{t("svgHeight")}</text>
      <text x="125" y="95" textAnchor="middle" fontSize="9" fill="#1d4ed8">{t("svgWindow")}</text>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#0d9488" />
        </marker>
        <marker id="arrowReverse" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill="#0d9488" />
        </marker>
      </defs>
    </svg>
  ),
  facade: (
    <svg viewBox="0 0 300 220" className="w-full" role="img" aria-label={t("facadeAria")}>
      {/* maison */}
      <polygon points="40,80 150,30 260,80 260,200 40,200" fill="#fef3c7" stroke="#78716c" strokeWidth="2" />
      <polygon points="40,80 150,30 260,80" fill="#fde68a" stroke="#78716c" strokeWidth="2" />
      <rect x="80" y="120" width="40" height="50" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <rect x="180" y="120" width="40" height="50" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1" />
      <rect x="130" y="155" width="40" height="45" fill="#92400e" />
      {/* mesures */}
      <line x1="40" y1="210" x2="260" y2="210" stroke="#0d9488" strokeWidth="2" markerEnd="url(#a2)" markerStart="url(#a2r)" />
      <text x="150" y="218" textAnchor="middle" fontSize="11" fill="#0d9488" fontWeight="600">{t("svgFacadeL")}</text>
      <line x1="270" y1="80" x2="270" y2="200" stroke="#0d9488" strokeWidth="2" markerEnd="url(#a2)" markerStart="url(#a2r)" />
      <text x="278" y="143" fontSize="11" fill="#0d9488" fontWeight="600" transform="rotate(90 278 143)">{t("svgFacadeH")}</text>
      <line x1="270" y1="30" x2="270" y2="80" stroke="#a16207" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#aA)" markerStart="url(#aAr)" />
      <text x="282" y="58" fontSize="10" fill="#a16207">{t("svgGable")}</text>
      <defs>
        <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#0d9488" />
        </marker>
        <marker id="a2r" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill="#0d9488" />
        </marker>
        <marker id="aA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#a16207" />
        </marker>
        <marker id="aAr" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill="#a16207" />
        </marker>
      </defs>
    </svg>
  ),
  roof: (
    <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={t("roofAria")}>
      <line x1="40" y1="160" x2="260" y2="160" stroke="#78716c" strokeWidth="2" />
      <polygon points="40,160 150,60 260,160" fill="#fecaca" stroke="#dc2626" strokeWidth="2" />
      <line x1="40" y1="160" x2="260" y2="160" stroke="#0d9488" strokeWidth="2" strokeDasharray="6,3" />
      <text x="150" y="178" textAnchor="middle" fontSize="11" fill="#0d9488" fontWeight="600">{t("svgRoofGround")}</text>
      <line x1="40" y1="160" x2="150" y2="60" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#a3)" markerStart="url(#a3r)" />
      <text x="80" y="100" fontSize="11" fill="#7c3aed" fontWeight="600" transform="rotate(-42 80 100)">{t("svgRoofDev")}</text>
      <path d="M40,160 A30,30 0 0 1 70,140" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
      <text x="68" y="158" fontSize="11" fill="#7c3aed" fontWeight="600">α</text>
      <text x="20" y="195" fontSize="10" fill="#1c1917">{t("svgRoofFormula")}</text>
      <defs>
        <marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#7c3aed" />
        </marker>
        <marker id="a3r" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M10,0 L0,5 L10,10 z" fill="#7c3aed" />
        </marker>
      </defs>
    </svg>
  ),
  window: (
    <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={t("windowAria")}>
      <rect x="50" y="30" width="200" height="140" fill="#f5f5f4" stroke="#78716c" strokeWidth="3" />
      <rect x="70" y="50" width="160" height="100" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" />
      <line x1="150" y1="50" x2="150" y2="150" stroke="#3b82f6" strokeWidth="1" />
      <line x1="70" y1="100" x2="230" y2="100" stroke="#3b82f6" strokeWidth="1" />
      {/* tableau */}
      <line x1="50" y1="20" x2="250" y2="20" stroke="#0d9488" strokeWidth="2" markerEnd="url(#a4)" markerStart="url(#a4r)" />
      <text x="150" y="14" textAnchor="middle" fontSize="11" fill="#0d9488" fontWeight="600">{t("svgWindowL")}</text>
      <line x1="270" y1="30" x2="270" y2="170" stroke="#0d9488" strokeWidth="2" markerEnd="url(#a4)" markerStart="url(#a4r)" />
      <text x="278" y="105" fontSize="11" fill="#0d9488" fontWeight="600" transform="rotate(90 278 105)">{t("svgWindowH")}</text>
      {/* dormant */}
      <line x1="40" y1="50" x2="40" y2="150" stroke="#a16207" strokeWidth="2" markerEnd="url(#a4o)" markerStart="url(#a4or)" />
      <text x="22" y="105" fontSize="10" fill="#a16207" transform="rotate(90 22 105)">{t("svgWindowFrame")}</text>
      <text x="155" y="195" textAnchor="middle" fontSize="10" fill="#1c1917">{t("svgWindowWarn")}</text>
      <defs>
        <marker id="a4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#0d9488" /></marker>
        <marker id="a4r" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="#0d9488" /></marker>
        <marker id="a4o" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a16207" /></marker>
        <marker id="a4or" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="#a16207" /></marker>
      </defs>
    </svg>
  ),
  floor: (
    <svg viewBox="0 0 300 180" className="w-full" role="img" aria-label={t("floorAria")}>
      <rect x="40" y="40" width="220" height="100" fill="#fef3c7" stroke="#78716c" strokeWidth="2" />
      {/* mur intérieur */}
      <rect x="120" y="40" width="20" height="60" fill="#a8a29e" />
      <line x1="40" y1="155" x2="260" y2="155" stroke="#0d9488" strokeWidth="2" markerEnd="url(#a5)" markerStart="url(#a5r)" />
      <text x="150" y="170" textAnchor="middle" fontSize="11" fill="#0d9488" fontWeight="600">{t("svgFloorRoomA")}</text>
      <line x1="40" y1="30" x2="120" y2="30" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#a5p)" markerStart="url(#a5pr)" />
      <text x="80" y="22" textAnchor="middle" fontSize="10" fill="#7c3aed" fontWeight="600">{t("svgFloorUsableA")}</text>
      <line x1="140" y1="30" x2="260" y2="30" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#a5p)" markerStart="url(#a5pr)" />
      <text x="200" y="22" textAnchor="middle" fontSize="10" fill="#7c3aed" fontWeight="600">{t("svgFloorUsableB")}</text>
      <text x="80" y="90" fontSize="10" fill="#1c1917" textAnchor="middle">A</text>
      <text x="200" y="90" fontSize="10" fill="#1c1917" textAnchor="middle">B</text>
      <defs>
        <marker id="a5" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#0d9488" /></marker>
        <marker id="a5r" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="#0d9488" /></marker>
        <marker id="a5p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#7c3aed" /></marker>
        <marker id="a5pr" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="#7c3aed" /></marker>
      </defs>
    </svg>
  ),
  "ceiling-height": (
    <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label={t("ceilingAria")}>
      <rect x="60" y="30" width="180" height="140" fill="#f5f5f4" stroke="#78716c" strokeWidth="2" />
      <line x1="100" y1="30" x2="100" y2="170" stroke="#0d9488" strokeWidth="2" markerEnd="url(#a6)" markerStart="url(#a6r)" />
      <line x1="200" y1="30" x2="200" y2="170" stroke="#0d9488" strokeWidth="2" markerEnd="url(#a6)" markerStart="url(#a6r)" />
      <text x="150" y="105" textAnchor="middle" fontSize="11" fill="#0d9488" fontWeight="600">{t("svgCeilingH")}</text>
      <text x="150" y="190" textAnchor="middle" fontSize="10" fill="#1c1917">{t("svgCeilingTip")}</text>
      <defs>
        <marker id="a6" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#0d9488" /></marker>
        <marker id="a6r" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M10,0 L0,5 L10,10 z" fill="#0d9488" /></marker>
      </defs>
    </svg>
  ),
});

interface Props {
  open: boolean;
  onClose: () => void;
  /** Onglet à ouvrir par défaut. */
  defaultTab?: MeasureKey;
}

export function MeasureAssistant({ open, onClose, defaultTab = "wall" }: Props) {
  const t = useTranslations("measureAssistant");
  const [active, setActive] = useState<MeasureKey>(defaultTab);
  const SCHEMAS = buildSchemas(t);

  if (!open) return null;
  const tab = TABS.find(x => x.id === active)!;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="measure-assistant-title" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
          <h2 id="measure-assistant-title" className="font-serif text-lg font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("ariaClose")}
            className="rounded-md p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            ✕
          </button>
        </header>

        <div className="grid h-[70vh] overflow-hidden md:grid-cols-[180px_1fr]">
          {/* Sidebar onglets */}
          <nav className="overflow-y-auto border-b border-stone-200 bg-stone-50 p-2 md:border-b-0 md:border-r" aria-label={t("ariaNav")}>
            <div className="flex flex-wrap gap-1 md:flex-col">
              {TABS.map(tabItem => (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setActive(tabItem.id)}
                  aria-current={tabItem.id === active ? "page" : undefined}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium transition ${
                    tabItem.id === active ? "bg-teal-700 text-white" : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <span aria-hidden>{tabItem.icon}</span>
                  {t(tabItem.labelKey)}
                </button>
              ))}
            </div>
          </nav>

          {/* Contenu */}
          <div className="overflow-y-auto p-5">
            <h3 className="text-base font-semibold text-stone-900">{tab.icon} {t(tab.labelKey)}</h3>
            <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
              {SCHEMAS[active]}
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-700">{t("tipsTitle")}</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-stone-800">
                {TIP_KEYS[active].map((tKey) => <li key={tKey}>• {t(tKey)}</li>)}
              </ul>
            </div>
            <a
              href="/fr/help/mesurer-surfaces"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block text-sm font-semibold text-teal-700 hover:underline"
            >
              {t("helpLink")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
