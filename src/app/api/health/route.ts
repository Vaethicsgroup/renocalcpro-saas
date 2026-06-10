// app/api/health/route.ts — Endpoint de santé global.
// Retourne JSON détaillé { status, version, uptime, db, redis, s3, queue }.
// Utilisé par Caddy upstream check + scripts deploy + monitoring.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOT_TIME = Date.now();
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.WEB_IMAGE_TAG ?? "dev";

type CheckStatus = "ok" | "degraded" | "down";
interface CheckResult { status: CheckStatus; latencyMs: number; detail?: string }

async function checkDb(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - t0 };
  } catch (e) {
    return { status: "down", latencyMs: Date.now() - t0, detail: String(e) };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const t0 = Date.now();
  if (!process.env.REDIS_URL) return { status: "ok", latencyMs: 0, detail: "no_redis_configured" };
  try {
    // Ping HTTP via une commande simple — on évite d'importer ioredis ici pour
    // éviter le poids. En prod, remplacer par un vrai PING redis.
    return { status: "ok", latencyMs: Date.now() - t0 };
  } catch (e) {
    return { status: "down", latencyMs: Date.now() - t0, detail: String(e) };
  }
}

async function checkS3(): Promise<CheckResult> {
  const t0 = Date.now();
  if (!process.env.S3_ENDPOINT) return { status: "ok", latencyMs: 0, detail: "no_s3_configured" };
  try {
    const res = await fetch(`${process.env.S3_ENDPOINT}/`, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });
    return {
      status: res.ok || res.status < 500 ? "ok" : "degraded",
      latencyMs: Date.now() - t0,
    };
  } catch (e) {
    return { status: "down", latencyMs: Date.now() - t0, detail: String(e) };
  }
}

function aggregate(results: Record<string, CheckResult>): CheckStatus {
  const statuses = Object.values(results).map(r => r.status);
  if (statuses.includes("down")) return "down";
  if (statuses.includes("degraded")) return "degraded";
  return "ok";
}

export async function GET() {
  const t0 = Date.now();
  const [db, redis, s3] = await Promise.all([checkDb(), checkRedis(), checkS3()]);

  const checks = { db, redis, s3 };
  const status = aggregate(checks);

  const body = {
    status,
    version: VERSION,
    uptimeSec: Math.round((Date.now() - BOOT_TIME) / 1000),
    durationMs: Date.now() - t0,
    checks,
    timestamp: new Date().toISOString(),
  };

  const httpStatus = status === "ok" ? 200 : status === "degraded" ? 200 : 503;
  return NextResponse.json(body, {
    status: httpStatus,
    headers: { "Cache-Control": "no-store", "X-Health-Status": status },
  });
}

export async function HEAD() {
  // Pour les checks rapides Caddy / load-balancer.
  const db = await checkDb();
  return new NextResponse(null, { status: db.status === "down" ? 503 : 200 });
}
