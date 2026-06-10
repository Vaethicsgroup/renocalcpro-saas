// lib/observability/metrics.ts
// Compteurs in-process exposés au format Prometheus expo (text 0.0.4).
// Léger, sans dépendance — adéquat pour un single-instance Next.js.
// Pour multi-instance, basculer sur prom-client + push-gateway.

type Labels = Record<string, string | number>;
const counters    = new Map<string, number>();
const histograms  = new Map<string, { buckets: number[]; counts: number[]; sum: number; count: number }>();
const gauges      = new Map<string, number>();

const HIST_BUCKETS_SECONDS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

function key(name: string, labels?: Labels): string {
  if (!labels) return name;
  const sorted = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  const labelStr = sorted.map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`).join(",");
  return `${name}{${labelStr}}`;
}

export function counterInc(name: string, labels?: Labels, value = 1): void {
  const k = key(name, labels);
  counters.set(k, (counters.get(k) ?? 0) + value);
}

export function gaugeSet(name: string, value: number, labels?: Labels): void {
  gauges.set(key(name, labels), value);
}

export function histogramObserve(name: string, valueSeconds: number, labels?: Labels): void {
  const k = key(name, labels);
  let h = histograms.get(k);
  if (!h) {
    h = { buckets: HIST_BUCKETS_SECONDS, counts: HIST_BUCKETS_SECONDS.map(() => 0), sum: 0, count: 0 };
    histograms.set(k, h);
  }
  for (let i = 0; i < h.buckets.length; i++) {
    if (valueSeconds <= h.buckets[i]!) h.counts[i]! += 1;
  }
  h.sum += valueSeconds;
  h.count += 1;
}

/**
 * Rendu Prometheus text exposition format 0.0.4.
 */
export function renderMetrics(): string {
  const lines: string[] = [];

  // Counters
  const counterNames = new Set<string>();
  for (const k of counters.keys()) counterNames.add(k.split("{")[0]!);
  for (const name of counterNames) {
    lines.push(`# TYPE ${name} counter`);
    for (const [k, v] of counters.entries()) {
      if (k === name || k.startsWith(`${name}{`)) lines.push(`${k} ${v}`);
    }
  }

  // Gauges
  const gaugeNames = new Set<string>();
  for (const k of gauges.keys()) gaugeNames.add(k.split("{")[0]!);
  for (const name of gaugeNames) {
    lines.push(`# TYPE ${name} gauge`);
    for (const [k, v] of gauges.entries()) {
      if (k === name || k.startsWith(`${name}{`)) lines.push(`${k} ${v}`);
    }
  }

  // Histograms
  const histNames = new Set<string>();
  for (const k of histograms.keys()) histNames.add(k.split("{")[0]!);
  for (const name of histNames) {
    lines.push(`# TYPE ${name} histogram`);
    for (const [k, h] of histograms.entries()) {
      if (k !== name && !k.startsWith(`${name}{`)) continue;
      const baseLabel = k.includes("{") ? k.slice(k.indexOf("{") + 1, -1) : "";
      for (let i = 0; i < h.buckets.length; i++) {
        const lbl = baseLabel ? `${baseLabel},le="${h.buckets[i]}"` : `le="${h.buckets[i]}"`;
        lines.push(`${name}_bucket{${lbl}} ${h.counts[i]}`);
      }
      const lblInf = baseLabel ? `${baseLabel},le="+Inf"` : `le="+Inf"`;
      lines.push(`${name}_bucket{${lblInf}} ${h.count}`);
      lines.push(`${name}_sum${baseLabel ? `{${baseLabel}}` : ""} ${h.sum}`);
      lines.push(`${name}_count${baseLabel ? `{${baseLabel}}` : ""} ${h.count}`);
    }
  }

  return lines.join("\n") + "\n";
}

// ─── Helpers métier ──────────────────────────────────────────────────────
export const metrics = {
  httpRequest(method: string, route: string, status: number, durationSeconds: number) {
    counterInc("http_requests_total", { method, route, status });
    histogramObserve("http_request_duration_seconds", durationSeconds, { method, route });
  },
  reportGenerated(template: string, success: boolean) {
    counterInc("reports_generated_total", { template, status: success ? "ok" : "fail" });
  },
  signupStarted(clientType: string) {
    counterInc("signups_started_total", { clientType });
  },
  signupCompleted(clientType: string, plan: string) {
    counterInc("signups_completed_total", { clientType, plan });
  },
  emailSent(template: string, status: "ok" | "fail" | "mock") {
    counterInc("email_sent_total", { template, status });
  },
  aiTokens(agent: string, type: "input" | "output", n: number) {
    counterInc("ai_tokens_total", { agent, type }, n);
  },
  paywallTriggered(feature: string, plan: string) {
    counterInc("paywall_triggered_total", { feature, plan });
  },
  setActiveSubscriptions(count: number) {
    gaugeSet("active_subscriptions", count);
  },
  setMrrEur(eur: number) {
    gaugeSet("stripe_subscription_mrr_eur", eur);
  },
};
