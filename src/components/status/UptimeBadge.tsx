// components/status/UptimeBadge.tsx
// Badge embeddable affichant le statut d'un composant en temps réel.
// Usage externe : <UptimeBadge component="web" /> ou via iframe pour sites tiers.

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  /** Composant à monitorer */
  component: "web" | "db" | "redis" | "storage" | "email" | "agents";
  /** API URL (default : current origin) */
  baseUrl?: string;
  /** Affichage compact (juste pastille) */
  compact?: boolean;
}

interface Health {
  status: "OPERATIONAL" | "DEGRADED" | "PARTIAL_OUTAGE" | "MAJOR_OUTAGE" | "MAINTENANCE";
  latencyMs: number | null;
  checkedAt: string;
}

const STATUS_KEY = {
  OPERATIONAL:    "operational",
  DEGRADED:       "degraded",
  PARTIAL_OUTAGE: "partialOutage",
  MAJOR_OUTAGE:   "majorOutage",
  MAINTENANCE:    "maintenance",
};

const STATUS_COLOR = {
  OPERATIONAL:    { bg: "bg-emerald-500", text: "text-emerald-900", border: "border-emerald-300" },
  DEGRADED:       { bg: "bg-amber-500",   text: "text-amber-900",   border: "border-amber-300" },
  PARTIAL_OUTAGE: { bg: "bg-orange-500",  text: "text-orange-900",  border: "border-orange-300" },
  MAJOR_OUTAGE:   { bg: "bg-rose-500",    text: "text-rose-900",    border: "border-rose-300" },
  MAINTENANCE:    { bg: "bg-sky-500",     text: "text-sky-900",     border: "border-sky-300" },
};

const COMPONENT_KEY = {
  web: "compWeb",
  db: "compDb",
  redis: "compRedis",
  storage: "compStorage",
  email: "compEmail",
  agents: "compAgents",
};

export function UptimeBadge({ component, baseUrl = "", compact = false }: Props) {
  const t = useTranslations("uptimeBadge");
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${baseUrl || ""}/api/status/stream`;
    const es = new EventSource(url);

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "health" && Array.isArray(data.components)) {
          const c = data.components.find((x: { component: string }) => x.component === component.toUpperCase());
          if (c && !cancelled) setHealth(c);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      cancelled = true;
      es.close();
    };
  }, [component, baseUrl]);

  if (!health) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-600">
        <span className="h-2 w-2 animate-pulse rounded-full bg-stone-400" />
        {t("loading")}
      </span>
    );
  }

  const c = STATUS_COLOR[health.status];
  const statusLabel = t(STATUS_KEY[health.status]);
  const compLabel = t(COMPONENT_KEY[component]);

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${c.text} ${c.border} bg-white`}
            title={`${compLabel} — ${statusLabel}${health.latencyMs ? ` (${health.latencyMs} ms)` : ""}`}>
        <span className={`h-2 w-2 rounded-full ${c.bg} ${health.status === "OPERATIONAL" ? "animate-pulse" : ""}`} />
        {statusLabel}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 rounded-lg border px-3 py-2 text-sm bg-white ${c.border}`}>
      <span className={`h-3 w-3 rounded-full ${c.bg} ${health.status === "OPERATIONAL" ? "animate-pulse" : ""}`} />
      <div>
        <div className={`font-semibold ${c.text}`}>{compLabel}</div>
        <div className="text-xs text-stone-600">
          {statusLabel}
          {health.latencyMs && ` · ${health.latencyMs} ms`}
        </div>
      </div>
    </div>
  );
}
