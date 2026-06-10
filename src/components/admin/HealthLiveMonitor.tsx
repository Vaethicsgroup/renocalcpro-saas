"use client";
// components/admin/HealthLiveMonitor.tsx
// Refresh polling 10s du /api/admin/health avec affichage live.

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

interface ProbeResult {
  name: string;
  status: "UP" | "DEGRADED" | "DOWN" | "UNKNOWN";
  latencyMs: number;
  detail?: string;
  required: boolean;
}

interface Props { initialProbes: ProbeResult[] }

const STATUS_STYLE = {
  UP:       { bg: "bg-emerald-500", border: "border-emerald-300", text: "text-emerald-900", labelKey: "operational" },
  DEGRADED: { bg: "bg-amber-500",   border: "border-amber-300",   text: "text-amber-900",   labelKey: "degraded" },
  DOWN:     { bg: "bg-rose-500",    border: "border-rose-300",    text: "text-rose-900",    labelKey: "down" },
  UNKNOWN:  { bg: "bg-stone-400",   border: "border-stone-300",   text: "text-stone-700",   labelKey: "notConfigured" },
};

export function HealthLiveMonitor({ initialProbes }: Props) {
  const t = useTranslations("healthMonitor");
  const locale = useLocale();
  const [probes, setProbes] = useState(initialProbes);
  const [overallStatus, setOverallStatus] = useState<"UP" | "DEGRADED" | "DOWN">("UP");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const r = await fetch("/api/admin/health", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (cancelled) return;
        setProbes(data.probes);
        setOverallStatus(data.overallStatus);
        setLastUpdated(new Date(data.timestamp));
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "fetch_failed");
      }
    }
    const interval = setInterval(tick, 10_000);
    tick();
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const overall = STATUS_STYLE[overallStatus];

  return (
    <>
      {/* Global status */}
      <div className={`mb-6 rounded-2xl border-2 p-6 ${overall.border} bg-white`}>
        <div className="flex items-center gap-4">
          <span className={`h-6 w-6 rounded-full ${overall.bg} ${overallStatus === "UP" ? "animate-pulse" : ""}`} />
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${overall.text}`} aria-live="polite">
              {t(overall.labelKey)}
            </h2>
            <p className="text-sm text-stone-600">
              {t("lastCheck")} {lastUpdated.toLocaleTimeString(locale)}
            </p>
          </div>
          {error && <span className="rounded bg-rose-100 px-2 py-1 text-xs text-rose-900">⚠ {error}</span>}
        </div>
      </div>

      {/* Probes grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {probes.map(p => {
          const c = STATUS_STYLE[p.status];
          const label = t(c.labelKey);
          return (
            <article key={p.name} className={`rounded-xl border p-4 ${c.border} bg-white`}>
              <header className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-stone-900">{p.name}</h3>
                <span className={`h-3 w-3 rounded-full ${c.bg} ${p.status === "UP" ? "animate-pulse" : ""}`}
                      aria-label={t("statusAria", { label })} />
              </header>
              <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <span className="text-stone-600">{t("status")}</span>
                <span className={`font-semibold ${c.text}`}>{label}</span>
                <span className="text-stone-600">{t("latency")}</span>
                <span className="font-mono">{p.latencyMs} ms</span>
                {p.required && (
                  <>
                    <span className="text-stone-600">{t("critical")}</span>
                    <span className="text-amber-700">{t("yesShort")}</span>
                  </>
                )}
              </div>
              {p.detail && (
                <p className="mt-2 text-[10px] text-stone-500" title={p.detail}>
                  {p.detail.length > 80 ? p.detail.slice(0, 77) + "…" : p.detail}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
