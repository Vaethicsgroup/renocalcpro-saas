// src/components/calc/DownloadReportButton.tsx — Bouton client téléchargement PDF v1.0
// Branche le moteur Rich → API /api/calc/pdf → téléchargement réel chez l'utilisateur.
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { ProjectResultRich } from "@/lib/calc/result/consolidate-rich";

interface Props {
  /** Si fourni : POST le résultat → PDF du projet courant. */
  result?: ProjectResultRich;
  /** Si true : utilise GET /api/calc/pdf?demo=true (échantillon). */
  useDemo?: boolean;
  /** Label bouton. */
  label?: string;
  /** Taille bouton. */
  size?: "sm" | "md" | "lg";
}

export function DownloadReportButton({
  result, useDemo = false, label, size = "md",
}: Props) {
  const t = useTranslations("downloadReport");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        let response: Response;
        if (useDemo) {
          response = await fetch("/api/calc/pdf?demo=true", { method: "GET" });
        } else {
          if (!result) {
            setError(t("errorNoResult"));
            return;
          }
          response = await fetch("/api/calc/pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ result }),
          });
        }

        if (!response.ok) {
          const text = await response.text();
          let msg = t("errorPrefix", { code: response.status });
          try {
            const json = JSON.parse(text);
            if (json?.error) msg = json.error;
          } catch { /* text brut */ }
          setError(msg);
          return;
        }

        // Téléchargement réel du blob PDF
        const blob = await response.blob();
        const filename =
          extractFilename(response.headers.get("content-disposition")) ??
          `renocalc-rapport-${Date.now()}.pdf`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errorNetwork"));
      }
    });
  }

  const sizeClasses = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
  }[size];

  const defaultLabel = useDemo ? t("btnDemo") : t("btnReport");

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || (!useDemo && !result)}
        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-forest-700 font-semibold text-cream-50 shadow-sm transition hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses}`}
      >
        {pending ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {t("generating")}
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
            {label ?? defaultLabel}
          </>
        )}
      </button>
      {error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function extractFilename(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/filename="?([^"]+)"?/);
  return match?.[1] ?? null;
}
