// lib/health/probes.ts
// Sondes de santé pour les briques externes : DB, Redis, S3, Stripe, Anthropic, Resend.
// Chaque probe retourne { status, latencyMs, detail }.

import { prisma } from "@/lib/db/client";

export type ProbeStatus = "UP" | "DEGRADED" | "DOWN" | "UNKNOWN";

export interface ProbeResult {
  name: string;
  status: ProbeStatus;
  latencyMs: number;
  detail?: string;
  required: boolean;  // si UP requis pour service global
}

const PROBE_TIMEOUT_MS = 3000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("probe_timeout")), ms)),
  ]);
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result?: T; error?: string; ms: number }> {
  const t0 = Date.now();
  try {
    const result = await withTimeout(fn(), PROBE_TIMEOUT_MS);
    return { result, ms: Date.now() - t0 };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), ms: Date.now() - t0 };
  }
}

// ── PROBE: PostgreSQL via Prisma ────────────────────────────────────────────
export async function probeDB(): Promise<ProbeResult> {
  const r = await timed(() => prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`);
  return {
    name: "PostgreSQL",
    status: r.error ? "DOWN" : r.ms > 1000 ? "DEGRADED" : "UP",
    latencyMs: r.ms,
    detail: r.error,
    required: true,
  };
}

// ── PROBE: Redis (Upstash) ───────────────────────────────────────────────────
export async function probeRedis(): Promise<ProbeResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return { name: "Redis", status: "UNKNOWN", latencyMs: 0, detail: "Not configured", required: false };
  }

  const r = await timed(async () => {
    const resp = await fetch(`${url}/ping`, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  });

  return {
    name: "Redis (Upstash)",
    status: r.error ? "DOWN" : r.ms > 800 ? "DEGRADED" : "UP",
    latencyMs: r.ms,
    detail: r.error,
    required: true,
  };
}

// ── PROBE: S3 storage ───────────────────────────────────────────────────────
export async function probeStorage(): Promise<ProbeResult> {
  const endpoint = process.env.S3_ENDPOINT_URL;
  if (!endpoint) {
    return { name: "S3 Storage", status: "UNKNOWN", latencyMs: 0, detail: "Not configured", required: false };
  }

  const r = await timed(async () => {
    // Healthcheck simple : HEAD sur le bucket
    const resp = await fetch(`${endpoint}/?location`, { method: "HEAD" });
    return resp.status;
  });

  return {
    name: "S3 Storage",
    status: r.error ? "DOWN" : r.ms > 1500 ? "DEGRADED" : "UP",
    latencyMs: r.ms,
    detail: r.error ?? `HTTP ${r.result}`,
    required: true,
  };
}

// ── PROBE: Stripe API ──────────────────────────────────────────────────────
export async function probeStripe(): Promise<ProbeResult> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { name: "Stripe", status: "UNKNOWN", latencyMs: 0, detail: "Mock mode", required: false };

  const r = await timed(async () => {
    const resp = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.status;
  });

  return {
    name: "Stripe",
    status: r.error ? "DOWN" : r.ms > 2000 ? "DEGRADED" : "UP",
    latencyMs: r.ms,
    detail: r.error,
    required: true,
  };
}

// ── PROBE: Anthropic ────────────────────────────────────────────────────────
export async function probeAnthropic(): Promise<ProbeResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { name: "Anthropic Claude", status: "UNKNOWN", latencyMs: 0, detail: "Mock mode", required: false };

  // On évite d'appeler /messages (coûteux) — on ping juste le DNS
  const r = await timed(async () => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 2000);
    try {
      // HEAD sur le domaine (ne consomme pas de tokens)
      const resp = await fetch("https://api.anthropic.com", { method: "HEAD", signal: ctrl.signal });
      return resp.status;
    } finally {
      ctrl.abort();
    }
  });

  return {
    name: "Anthropic Claude",
    status: r.error ? "DOWN" : "UP",
    latencyMs: r.ms,
    detail: r.error,
    required: false,  // Mode dégradé acceptable (mock fallback)
  };
}

// ── PROBE: Resend ───────────────────────────────────────────────────────────
export async function probeResend(): Promise<ProbeResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { name: "Resend (email)", status: "UNKNOWN", latencyMs: 0, detail: "Mock mode", required: false };

  const r = await timed(async () => {
    const resp = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.status;
  });

  return {
    name: "Resend (email)",
    status: r.error ? "DOWN" : "UP",
    latencyMs: r.ms,
    detail: r.error,
    required: true,
  };
}

// ── PROBE: Webhook deliveries en attente ────────────────────────────────────
export async function probeWebhooks(): Promise<ProbeResult> {
  const r = await timed(async () => {
    const pending = await prisma.webhookDelivery.count({
      where: { status: { in: ["PENDING", "RETRYING"] }, nextAttemptAt: { lte: new Date() } },
    });
    const overdue = await prisma.webhookDelivery.count({
      where: {
        status: "RETRYING",
        nextAttemptAt: { lte: new Date(Date.now() - 5 * 60 * 1000) },  // Stuck > 5 min
      },
    });
    return { pending, overdue };
  });

  if (r.error || !r.result) return { name: "Webhook deliveries", status: "DOWN", latencyMs: r.ms, detail: r.error, required: false };

  const { pending, overdue } = r.result;
  const status: ProbeStatus = overdue > 50 ? "DEGRADED" : pending > 200 ? "DEGRADED" : "UP";
  return {
    name: "Webhook deliveries",
    status,
    latencyMs: r.ms,
    detail: `${pending} en attente, ${overdue} en retard`,
    required: false,
  };
}

// ── ALL PROBES ─────────────────────────────────────────────────────────────
export async function probeAll(): Promise<ProbeResult[]> {
  return Promise.all([
    probeDB(),
    probeRedis(),
    probeStorage(),
    probeStripe(),
    probeAnthropic(),
    probeResend(),
    probeWebhooks(),
  ]);
}
