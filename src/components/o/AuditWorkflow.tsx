// src/components/o/AuditWorkflow.tsx
// ════════════════════════════════════════════════════════════════════════════
// Composant Workflow d'audit : check-list documents + étapes process +
// niveau de confiance des résultats. Outil opérationnel pour l'auditeur.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileCheck,
  FileText,
  ListChecks,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Camera,
  Building,
  Coins,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import {
  AUDIT_DOCUMENTS_CATALOG,
  AUDIT_STAGES,
  DEFAULT_AUDIT_CRITERIA,
  CONFIDENCE_LEVELS_FR,
  computeConfidenceLevel,
  type AuditDocumentKey,
  type AuditStageKey,
  type ConfidenceCriterion,
} from "@/lib/calc/audit/workflow";

const CATEGORY_META: Record<
  (typeof AUDIT_DOCUMENTS_CATALOG)[number]["category"],
  { labelKey: string; icon: typeof FileText; color: string }
> = {
  PROPRIETE:     { labelKey: "catProperty",   icon: Building,    color: "bg-night-100 text-night-700" },
  FISCAL:        { labelKey: "catFiscal",     icon: Coins,       color: "bg-forest-100 text-forest-700" },
  ENERGIE:       { labelKey: "catEnergie",    icon: Wrench,      color: "bg-amber-100 text-amber-700" },
  TECHNIQUE:     { labelKey: "catTechnique",  icon: Camera,      color: "bg-stone-100 text-stone-700" },
  TRAVAUX:       { labelKey: "catTravaux",    icon: Wrench,      color: "bg-terracotta-100 text-terracotta-700" },
  REGLEMENTAIRE: { labelKey: "catRegulatory", icon: ShieldCheck, color: "bg-red-50 text-red-700" },
};

interface Props {
  /** Année construction pour conditionner amiante / plomb. */
  constructionYear?: number;
  /** Statut propriété pour conditionner SCI / indivision / copro. */
  isLegalEntity?: boolean;
  isCopropriete?: boolean;
  isIndivision?: boolean;
}

export function AuditWorkflow({
  constructionYear,
  isLegalEntity,
  isCopropriete,
  isIndivision,
}: Props) {
  const t = useTranslations("auditWorkflow");
  // État des cases cochées
  const [collectedDocs, setCollectedDocs] = useState<Set<AuditDocumentKey>>(
    new Set(),
  );
  const [activeStage, setActiveStage] = useState<AuditStageKey | null>(
    "COLLECTE_DOCS",
  );
  const [confidenceState, setConfidenceState] = useState<Record<string, boolean>>({
    visit: false,
    bills_3y: false,
    photos: false,
    plans: false,
    dpe: false,
    thermography: false,
    blower_door: false,
    rge_quotes: false,
    calibration: false,
  });

  // Filtrer documents selon contexte
  const relevantDocs = useMemo(() => {
    return AUDIT_DOCUMENTS_CATALOG.filter((d) => {
      if (d.key === "STATUTS_SCI") return isLegalEntity;
      if (d.key === "KBIS") return isLegalEntity;
      if (d.key === "CONVENTION_INDIVISION") return isIndivision;
      if (d.key === "PV_AG_COPRO") return isCopropriete;
      if (d.key === "DIAGNOSTICS_AMIANTE")
        return constructionYear != null && constructionYear < 1997;
      if (d.key === "DIAGNOSTICS_PLOMB")
        return constructionYear != null && constructionYear < 1949;
      return true;
    });
  }, [constructionYear, isLegalEntity, isCopropriete, isIndivision]);

  // Grouper par catégorie
  const docsByCategory = useMemo(() => {
    const map = new Map<string, typeof relevantDocs>();
    for (const d of relevantDocs) {
      const arr = map.get(d.category) ?? [];
      arr.push(d);
      map.set(d.category, arr);
    }
    return map;
  }, [relevantDocs]);

  const requiredDocs = relevantDocs.filter((d) => d.required);
  const collectedRequired = requiredDocs.filter((d) =>
    collectedDocs.has(d.key),
  ).length;
  const docCompletion =
    requiredDocs.length === 0
      ? 0
      : (collectedRequired / requiredDocs.length) * 100;

  // Niveau de confiance global
  const criteria: ConfidenceCriterion[] = DEFAULT_AUDIT_CRITERIA.map((c) => ({
    ...c,
    satisfied: confidenceState[c.key] ?? false,
  }));
  const confidence = computeConfidenceLevel(criteria);

  const toggleDoc = (key: AuditDocumentKey) => {
    setCollectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* ─── Niveau de confiance global ─── */}
      <Card>
        <CardContent>
          <div className="flex items-start gap-4">
            <div
              className={[
                "grid h-14 w-14 shrink-0 place-items-center rounded-full font-serif text-xl font-bold",
                confidence.level === "A"
                  ? "bg-forest-100 text-forest-800"
                  : confidence.level === "B"
                    ? "bg-amber-100 text-amber-800"
                    : confidence.level === "C"
                      ? "bg-stone-100 text-stone-700"
                      : "bg-red-100 text-red-700",
              ].join(" ")}
            >
              {confidence.level}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Niveau de confiance du diagnostic
              </p>
              <p className="font-serif text-lg font-bold text-forest-900">
                {CONFIDENCE_LEVELS_FR[confidence.level].label} ·{" "}
                {Math.round(confidence.score * 100)} % de critères validés
              </p>
              <p className="mt-1 text-xs text-stone-600">
                {CONFIDENCE_LEVELS_FR[confidence.level].description}
              </p>
            </div>
          </div>

          {/* Critères de confiance — cochables */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_AUDIT_CRITERIA.map((c) => {
              const checked = confidenceState[c.key] ?? false;
              return (
                <label
                  key={c.key}
                  className={[
                    "flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-xs transition-colors",
                    checked
                      ? "border-forest-300 bg-forest-50"
                      : "border-cream-300 bg-white hover:border-forest-200",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setConfidenceState((prev) => ({
                        ...prev,
                        [c.key]: e.target.checked,
                      }))
                    }
                    className="mt-0.5 h-3.5 w-3.5 rounded accent-forest-600"
                  />
                  <span className="min-w-0">
                    <span
                      className={`font-medium ${checked ? "text-forest-900" : "text-stone-700"}`}
                    >
                      {c.labelFr}
                    </span>
                    <span className="ml-1 text-[10px] text-stone-500">
                      ({c.weight} pts)
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {confidence.missing.length > 0 && confidence.level !== "A" && (
            <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertCircle className="mr-1 inline h-3 w-3" />
              Pour monter au niveau supérieur, ajoutez :{" "}
              <strong>{confidence.missing.slice(0, 3).join(", ")}</strong>
              {confidence.missing.length > 3 ? "…" : ""}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Check-list documents ─── */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-lg font-bold text-forest-900">
                  Check-list documents à collecter
                </p>
                <p className="text-xs text-stone-600">
                  {collectedRequired} / {requiredDocs.length} documents
                  obligatoires reçus · {Math.round(docCompletion)} % du dossier
                </p>
              </div>
            </div>
            {/* Progression circulaire simple */}
            <div className="hidden sm:block">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-cream-200">
                <div
                  className="h-full bg-forest-600 transition-all"
                  style={{ width: `${docCompletion}%` }}
                />
              </div>
            </div>
          </div>

          {Array.from(docsByCategory.entries()).map(([catKey, docs]) => {
            const meta = CATEGORY_META[catKey as keyof typeof CATEGORY_META];
            const Icon = meta.icon;
            return (
              <div key={catKey} className="mt-4">
                <p
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}
                >
                  <Icon className="h-3 w-3" />
                  {t(meta.labelKey)}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {docs.map((d) => {
                    const checked = collectedDocs.has(d.key);
                    return (
                      <li key={d.key}>
                        <label
                          className={[
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                            checked
                              ? "border-forest-300 bg-forest-50/40"
                              : "border-cream-300 bg-white hover:border-forest-200",
                          ].join(" ")}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDoc(d.key)}
                            className="mt-0.5 h-4 w-4 rounded accent-forest-600"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-medium ${checked ? "text-forest-900" : "text-stone-800"}`}
                              >
                                {d.labelFr}
                              </span>
                              {d.required && (
                                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                                  Obligatoire
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-stone-600">
                              {d.descriptionFr}
                            </p>
                            {d.conditionsFr && (
                              <p className="mt-0.5 text-[11px] italic text-stone-500">
                                {d.conditionsFr}
                              </p>
                            )}
                          </div>
                          {checked && (
                            <FileCheck className="h-4 w-4 shrink-0 text-forest-600" />
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ─── Étapes du process d'audit ─── */}
      <Card>
        <CardContent>
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night-100 text-night-700">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-forest-900">
                Étapes du processus d'audit
              </p>
              <p className="text-xs text-stone-600">
                Séquence type d'un audit BBC réglementaire. Durée totale :{" "}
                {AUDIT_STAGES.reduce((s, st) => s + st.typicalDays, 0)} jours
                ouvrés (hors accompagnement chantier).
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {AUDIT_STAGES.map((stage, idx) => {
              const isOpen = activeStage === stage.key;
              return (
                <div
                  key={stage.key}
                  className="overflow-hidden rounded-lg border border-cream-300 bg-white"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStage(isOpen ? null : stage.key)
                    }
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-cream-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest-100 font-bold text-forest-700">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-forest-900">
                        {stage.labelFr}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-night-100 px-2 py-0.5 text-xs font-semibold text-night-700">
                        {stage.typicalDays} j
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-stone-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-stone-500" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-cream-200 bg-cream-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-night-700">
                        Livrables / sous-étapes
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-stone-700">
                        {stage.deliverablesFr.map((d) => (
                          <li key={d} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest-500" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
