// src/components/project-summary/ProjectSummaryEditor.tsx
// UI éditeur de résumé projet / synthèse de visite.
// - Saisie de notes guidées
// - Génération du résumé via lib pure
// - Aperçu + zone éditable finale
// - Persistance localStorage
//
// AUCUN texte hardcodé : tout passe par useTranslations.

"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  type NarrativeTone,
  type ProjectNarrativeInputs,
  type ProjectNarrativeSummary,
  type VisitNotes,
  generateProjectNarrativeSummary,
  serializeNarrativeToText,
} from "@/lib/project-summary/project-narrative";
import {
  clearProjectSummary,
  loadProjectSummary,
  saveProjectSummary,
} from "@/lib/project-summary/storage";

interface Props {
  /** Identifiant projet utilisé pour la persistance localStorage. */
  projectId: string;
  /** Données techniques connues (peut être vide). */
  inputs?: ProjectNarrativeInputs;
}

const TONES: NarrativeTone[] = ["client", "professional", "technical"];

const NOTE_FIELDS: ReadonlyArray<keyof VisitNotes> = [
  "general",
  "walls",
  "roof",
  "floor",
  "openings",
  "heating",
  "dhw",
  "ventilation",
  "garageOrUnheatedRooms",
  "humidity",
  "comfort",
  "priorities",
];

export function ProjectSummaryEditor({ projectId, inputs }: Props) {
  const t = useTranslations("projectSummary");
  const tNotes = useTranslations("visitNotes");
  const tTone = useTranslations("narrativeTone");
  const locale = useLocale();

  const [notes, setNotes] = useState<VisitNotes>({});
  const [tone, setTone] = useState<NarrativeTone>("professional");
  const [includeUncertainty, setIncludeUncertainty] = useState(false);
  const [summary, setSummary] = useState<ProjectNarrativeSummary | null>(null);
  const [finalText, setFinalText] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate depuis localStorage
  useEffect(() => {
    const stored = loadProjectSummary(projectId);
    if (stored) {
      setNotes(stored.visitNotes ?? {});
      setFinalText(stored.finalText ?? "");
      if (stored.tone) setTone(stored.tone);
      if (typeof stored.includeUncertainty === "boolean") {
        setIncludeUncertainty(stored.includeUncertainty);
      }
    }
    setHydrated(true);
  }, [projectId]);

  function setNoteField(key: keyof VisitNotes, value: string) {
    setNotes(prev => ({ ...prev, [key]: value }));
  }

  function handleGenerate() {
    // Adapter : next-intl's translator has a richer signature (generic key) ;
    // notre Translator est volontairement plus simple pour rester testable.
    const tAdapter = (key: string, params?: Record<string, unknown>): string =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t as any)(key, params);
    const result = generateProjectNarrativeSummary(inputs, notes, {
      tone,
      includeUncertaintyNotes: includeUncertainty,
      locale,
      t: tAdapter,
    });
    setSummary(result);
    setFinalText(serializeNarrativeToText(result, { t: tAdapter }));
  }

  function handleCopy() {
    if (!finalText) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(finalText).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        },
        () => { /* clipboard refusé — silencieux */ },
      );
    }
  }

  function handleSave() {
    saveProjectSummary(projectId, {
      visitNotes: notes,
      finalText,
      tone,
      includeUncertainty,
    });
    setToast(t("savedToast"));
    setTimeout(() => setToast(null), 2500);
  }

  function handleClear() {
    clearProjectSummary(projectId);
    setNotes({});
    setSummary(null);
    setFinalText("");
  }

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft md:p-6"
      aria-busy={!hydrated}
    >
      {/* Header + badge */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className="font-serif text-xl font-bold text-stone-900 md:text-2xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            {t("editorTitle")}
          </h2>
          <p className="mt-1 text-sm text-stone-600">{t("editorSubtitle")}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-amber-900">
          ⚠ {t("reviewBadge")}
        </span>
      </header>

      {/* Storage notice */}
      <p className="mt-4 rounded-lg border-l-4 border-stone-300 bg-stone-50 p-3 text-xs text-stone-700">
        ℹ {t("storageNotice")}
      </p>

      {/* Notes de visite */}
      <section className="mt-6">
        <h3 className="text-sm font-semibold text-stone-900">{tNotes("sectionTitle")}</h3>
        <p className="mt-0.5 text-xs text-stone-500">{tNotes("sectionSubtitle")}</p>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {NOTE_FIELDS.map((field) => (
            <label key={field} className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium text-stone-700">
                {tNotes(field)}
              </span>
              <textarea
                value={notes[field] ?? ""}
                onChange={(e) => setNoteField(field, e.target.value)}
                placeholder={tNotes("placeholder")}
                rows={3}
                className="min-h-[64px] w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Contrôles : tone + uncertainty + génération */}
      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            {t("toneLabel")}
          </span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as NarrativeTone)}
            className="h-10 rounded-md border border-cream-300 bg-white px-3 text-sm focus:border-forest-500 focus:outline-none"
          >
            {TONES.map((tn) => (
              <option key={tn} value={tn}>{tTone(tn)}</option>
            ))}
          </select>
        </label>

        <label className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
          <input
            type="checkbox"
            checked={includeUncertainty}
            onChange={(e) => setIncludeUncertainty(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-forest-600 focus:ring-forest-300"
          />
          <span>
            <span className="block font-medium">{t("includeUncertaintyLabel")}</span>
            <span className="block text-stone-500">{t("includeUncertaintyHelper")}</span>
          </span>
        </label>
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="inline-flex h-10 items-center justify-center rounded-md bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-800"
        >
          {t("btnGenerate")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-10 items-center justify-center rounded-md border border-cream-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
        >
          {t("btnSave")}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex h-10 items-center justify-center rounded-md border border-cream-300 bg-white px-4 text-sm font-medium text-stone-500 hover:bg-stone-50"
        >
          {t("btnClear")}
        </button>
        {toast && (
          <span role="status" className="self-center text-xs font-medium text-forest-700">
            {toast}
          </span>
        )}
      </div>

      {/* Aperçu généré */}
      {summary && (
        <section className="mt-6 rounded-xl border border-forest-200 bg-forest-50/40 p-4">
          <h3 className="text-sm font-semibold text-forest-900">{t("previewTitle")}</h3>
          <div className="mt-3 space-y-3 text-sm text-stone-800">
            <h4 className="font-serif text-base font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              {summary.title}
            </h4>
            <PreviewBlock title={t("section.property")} body={summary.propertyOverview} />
            <PreviewBlock title={t("section.systems")} body={summary.systemsOverview} />
            <PreviewBlock title={t("section.envelope")} body={summary.envelopeOverview} />
            <PreviewBlock title={t("section.observations")} body={summary.visitObservations} />
            <PreviewBlock title={t("section.priorities")} body={summary.renovationPriorities} />
            {summary.disclaimers.length > 0 && (
              <PreviewList title={t("section.disclaimers")} items={summary.disclaimers} />
            )}
            {summary.confidenceNotes.length > 0 && (
              <PreviewList title={t("section.confidence")} items={summary.confidenceNotes} />
            )}
          </div>
        </section>
      )}

      {/* Texte final éditable */}
      <section className="mt-6">
        <h3 className="text-sm font-semibold text-stone-900">{t("finalEditTitle")}</h3>
        <p className="mt-0.5 text-xs text-stone-500">{t("finalEditHelper")}</p>
        <textarea
          value={finalText}
          onChange={(e) => setFinalText(e.target.value)}
          rows={14}
          className="mt-2 w-full rounded-md border border-cream-300 px-3 py-2 font-mono text-xs focus:border-forest-500 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!finalText}
            className="inline-flex h-9 items-center justify-center rounded-md bg-stone-900 px-3 text-xs font-semibold text-white disabled:opacity-50 hover:bg-stone-800"
          >
            {copied ? t("btnCopied") : t("btnCopy")}
          </button>
        </div>
      </section>
    </section>
  );
}

function PreviewBlock({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{title}</p>
      <p className="mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

function PreviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{title}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
