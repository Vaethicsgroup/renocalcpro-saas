// src/components/aids/MyAidsTracker.tsx
// ════════════════════════════════════════════════════════════════════════════
// Tableau de suivi des demandes d'aides côté particulier :
//   - liste des aides énergie + autonomie potentiellement éligibles
//   - statut individuel (Non demandée / Prévue / Déposée / Instruction / Accordée / Refusée / Versée)
//   - dates dépôt + réponse estimée + réponse effective + montants
//   - alerte si délai dépassé
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ClipboardList,
  Calendar,
  Hourglass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CircleDollarSign,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  AID_STATUS_LABELS_FR,
  AID_PROCESSING_DELAYS_WEEKS,
  estimateExpectedResponseDate,
  calculateAidTimeline,
  type AidRequest,
  type AidRequestStatus,
} from "@/lib/calc/aids/tracking";

const STATUS_KEY: Record<AidRequestStatus, string> = {
  NOT_REQUESTED: "statusNotRequested",
  PLANNED: "statusPlanned",
  SUBMITTED: "statusSubmitted",
  UNDER_REVIEW: "statusUnderReview",
  GRANTED: "statusGranted",
  PARTIALLY_GRANTED: "statusPartiallyGranted",
  REJECTED: "statusRejected",
  PAID: "statusPaid",
};

interface Props {
  /** Liste des aides applicables au projet du user. */
  initialRequests: ReadonlyArray<AidRequest>;
  /** Callback pour persister les changements (server action). */
  onUpdate?: (updated: AidRequest) => void;
}

export function MyAidsTracker({ initialRequests, onUpdate }: Props) {
  const t = useTranslations("aidsTracker");
  const locale = useLocale();
  const fmtEur = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const [requests, setRequests] = useState<AidRequest[]>([
    ...initialRequests,
  ]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const updateRequest = (idx: number, patch: Partial<AidRequest>) => {
    setRequests((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, ...patch };
        // Recalcul date estimée si statut passe à SUBMITTED + on a une date
        if (patch.status === "SUBMITTED" && updated.submittedAt) {
          updated.expectedResponseAt = estimateExpectedResponseDate(
            updated.aidId,
            updated.submittedAt,
          );
        }
        onUpdate?.(updated);
        return updated;
      }),
    );
  };

  // Compteurs synthétiques
  const counts = {
    total: requests.length,
    planned: requests.filter((r) => r.status === "PLANNED").length,
    submitted: requests.filter(
      (r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW",
    ).length,
    granted: requests.filter(
      (r) =>
        r.status === "GRANTED" ||
        r.status === "PARTIALLY_GRANTED" ||
        r.status === "PAID",
    ).length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };
  const totalGranted = requests
    .filter(
      (r) =>
        r.status === "GRANTED" ||
        r.status === "PARTIALLY_GRANTED" ||
        r.status === "PAID",
    )
    .reduce((s, r) => s + (r.amountGranted_eur ?? 0), 0);
  const totalExpected = requests.reduce(
    (s, r) => s + (r.amountRequested_eur ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      {/* Header KPIs */}
      <div className="rounded-xl border border-forest-200 bg-forest-50/40 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-700 text-white">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg font-bold text-forest-900">
              {t("trackerTitle")}
            </p>
            <p className="text-xs text-stone-600">
              {t("trackerSubtitle")}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label={t("kpiPlanned")} value={counts.planned} color="text-info-700" />
          <Kpi
            label={t("kpiSubmitted")}
            value={counts.submitted}
            color="text-amber-700"
          />
          <Kpi label={t("kpiGranted")} value={counts.granted} color="text-forest-700" />
          <Kpi label={t("kpiRejected")} value={counts.rejected} color="text-red-700" />
        </div>

        {totalGranted > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-md border border-forest-300 bg-white px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-forest-900">
              <CircleDollarSign className="h-4 w-4 text-forest-700" />
              {t("totalGranted")}
            </span>
            <span className="font-bold tabular-nums text-forest-700">
              {fmtEur.format(totalGranted)}
              {totalExpected > 0 && (
                <span className="ml-1 text-xs font-normal text-stone-500">
                  {t("totalEstimated", { amount: fmtEur.format(totalExpected) })}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Liste des aides */}
      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center text-sm text-stone-600">
          <Info className="mr-1.5 inline h-4 w-4 text-stone-500" />
          {t("emptyState")}
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r, idx) => {
            const isOpen = openIndex === idx;
            const statusMeta = AID_STATUS_LABELS_FR[r.status];
            const delay = AID_PROCESSING_DELAYS_WEEKS[r.aidId];
            const timeline = r.submittedAt
              ? calculateAidTimeline(r.aidId, r.submittedAt)
              : null;
            return (
              <div
                key={`${r.aidId}-${idx}`}
                className="overflow-hidden rounded-xl border border-cream-300 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-cream-50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <StatusIcon status={r.status} />
                    <div className="min-w-0">
                      <p className="font-semibold text-forest-900">
                        {r.shortLabelFr}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusMeta.color} ${statusMeta.bgColor}`}
                        >
                          {t(STATUS_KEY[r.status])}
                        </span>
                        {r.amountGranted_eur != null && r.amountGranted_eur > 0 && (
                          <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[11px] font-semibold text-forest-800">
                            {t("amountPaidBadge", { amount: fmtEur.format(r.amountGranted_eur) })}
                          </span>
                        )}
                        {timeline?.isOverdue && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            <AlertTriangle className="mr-0.5 inline h-2.5 w-2.5" />
                            {t("overdueBadge", { weeks: timeline.weeksSinceSubmission, max: timeline.maxWeeksExpected })}
                          </span>
                        )}
                        {delay && !timeline && (
                          <span className="text-[11px] text-stone-500">
                            <Calendar className="mr-0.5 inline h-2.5 w-2.5" />
                            {t("expectedDelay", { min: delay.minWeeks, max: delay.maxWeeks })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-stone-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-stone-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-cream-200 bg-cream-50 px-4 py-4">
                    {/* Sélecteur de statut */}
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-night-700">
                        {t("updateStatusTitle")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            "PLANNED",
                            "SUBMITTED",
                            "UNDER_REVIEW",
                            "GRANTED",
                            "PARTIALLY_GRANTED",
                            "REJECTED",
                            "PAID",
                            "NOT_REQUESTED",
                          ] as AidRequestStatus[]
                        ).map((s) => {
                          const m = AID_STATUS_LABELS_FR[s];
                          const isCurrent = r.status === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateRequest(idx, { status: s })}
                              className={[
                                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                                isCurrent
                                  ? `${m.color} ${m.bgColor} ring-2 ring-offset-1`
                                  : "border border-cream-300 bg-white text-stone-700 hover:border-forest-300",
                              ].join(" ")}
                            >
                              {t(STATUS_KEY[s])}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dates + montants */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label={t("fieldSubmitDate")}
                        type="date"
                        value={r.submittedAt ?? ""}
                        onChange={(v) =>
                          updateRequest(idx, { submittedAt: v || undefined })
                        }
                      />
                      <Field
                        label={t("fieldExpectedDate")}
                        type="date"
                        value={r.expectedResponseAt ?? ""}
                        readOnly
                        helper={t("fieldExpectedHelper")}
                      />
                      <Field
                        label={t("fieldRespondedDate")}
                        type="date"
                        value={r.respondedAt ?? ""}
                        onChange={(v) =>
                          updateRequest(idx, { respondedAt: v || undefined })
                        }
                      />
                      <Field
                        label={t("fieldAmount")}
                        type="number"
                        value={r.amountGranted_eur?.toString() ?? ""}
                        onChange={(v) =>
                          updateRequest(idx, {
                            amountGranted_eur: v ? Number(v) : undefined,
                          })
                        }
                      />
                    </div>

                    {/* Notes */}
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-stone-700">
                        {t("fieldNotes")}
                      </label>
                      <textarea
                        value={r.notes ?? ""}
                        rows={2}
                        onChange={(e) =>
                          updateRequest(idx, { notes: e.target.value })
                        }
                        className="mt-1 w-full rounded-md border border-cream-300 px-2.5 py-1.5 text-sm focus:border-forest-500 focus:outline-none"
                        placeholder={t("notesPlaceholder")}
                      />
                    </div>

                    {/* Délais officiels */}
                    {delay && (
                      <div className="mt-3 rounded-md border border-info-200 bg-info-50/60 p-3 text-xs text-info-900">
                        <Hourglass className="mr-1 inline h-3 w-3" />
                        <strong>{t("officialDelay")}</strong>{" "}
                        {t("officialDelayText", { min: delay.minWeeks, max: delay.maxWeeks })}{" "}
                        {delay.explanationFr}
                      </div>
                    )}

                    {timeline?.isInWindow && (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {t("inWindow", { weeks: timeline.weeksSinceSubmission, min: timeline.minWeeksExpected, max: timeline.maxWeeksExpected })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers UI
// ────────────────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: AidRequestStatus }) {
  switch (status) {
    case "GRANTED":
    case "PAID":
      return <CheckCircle2 className="h-5 w-5 text-forest-700" />;
    case "PARTIALLY_GRANTED":
      return <CheckCircle2 className="h-5 w-5 text-amber-600" />;
    case "REJECTED":
      return <XCircle className="h-5 w-5 text-red-700" />;
    case "UNDER_REVIEW":
      return <Hourglass className="h-5 w-5 text-amber-700" />;
    case "SUBMITTED":
      return <ClipboardList className="h-5 w-5 text-night-700" />;
    case "PLANNED":
      return <Calendar className="h-5 w-5 text-info-700" />;
    default:
      return (
        <div className="h-5 w-5 rounded-full border-2 border-stone-300" />
      );
  }
}

function Kpi({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-md border border-cream-200 bg-white p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className={`mt-0.5 font-serif text-xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  readOnly,
  helper,
}: {
  label: string;
  type: "date" | "number" | "text";
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-stone-700">{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={[
          "mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none",
          readOnly
            ? "border-stone-200 bg-stone-50 text-stone-600"
            : "border-cream-300 focus:border-forest-500",
        ].join(" ")}
      />
      {helper && (
        <span className="mt-0.5 block text-[10px] text-stone-500">{helper}</span>
      )}
    </label>
  );
}
