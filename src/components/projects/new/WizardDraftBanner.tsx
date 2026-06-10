// src/components/projects/new/WizardDraftBanner.tsx — i18n complet
"use client";

import {
  RefreshCw,
  X,
  Check,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { SaveStatus } from "@/hooks/useWizardAutoSave";

interface BannerProps {
  /** ISO 8601 de la sauvegarde restaurée. */
  savedAt: string;
  onAccept: () => void;
  onReject: () => void;
}

export function WizardDraftBanner({
  savedAt,
  onAccept,
  onReject,
}: BannerProps) {
  const t = useTranslations("wizardDraftBanner");
  const locale = useLocale();

  let prettySavedAt = savedAt;
  try {
    const d = new Date(savedAt);
    if (!isNaN(d.getTime())) {
      prettySavedAt = d.toLocaleString(locale, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch {
    /* fallback ISO */
  }

  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm shadow-sm"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
        <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-900">{t("title")}</p>
        <p className="text-xs text-amber-800">
          {t("subtitle", { date: prettySavedAt })}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex h-9 items-center gap-1 rounded-md bg-amber-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
          {t("continueBtn")}
        </button>
        <button
          type="button"
          onClick={onReject}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
        >
          <X className="h-3 w-3" strokeWidth={2.5} />
          {t("restartBtn")}
        </button>
      </div>
    </div>
  );
}

interface IndicatorProps {
  status: SaveStatus;
  lastSavedAt: string | null;
}

export function WizardSaveIndicator({ status, lastSavedAt }: IndicatorProps) {
  const t = useTranslations("wizardDraftBanner");
  const locale = useLocale();

  if (status === "idle" && !lastSavedAt) return null;

  let Icon = Cloud;
  let label = t("indicatorSavedDefault");
  let colorClass = "text-stone-500";

  if (status === "saving") {
    Icon = Loader2;
    label = t("indicatorSaving");
    colorClass = "text-info-700";
  } else if (status === "error") {
    Icon = CloudOff;
    label = t("indicatorError");
    colorClass = "text-amber-700";
  } else if (status === "saved" || lastSavedAt) {
    Icon = Cloud;
    colorClass = "text-forest-700";
    if (lastSavedAt) {
      try {
        const d = new Date(lastSavedAt);
        if (!isNaN(d.getTime())) {
          const hm = d.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          });
          label = t("indicatorSaved", { time: hm });
        }
      } catch {
        /* garde le label par défaut */
      }
    }
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1 text-[11px] ${colorClass}`}
    >
      <Icon
        className={`h-3 w-3 ${status === "saving" ? "animate-spin" : ""}`}
        strokeWidth={2}
        aria-hidden
      />
      {label}
    </p>
  );
}
