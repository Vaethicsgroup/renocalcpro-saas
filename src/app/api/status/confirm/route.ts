// app/api/status/confirm/route.ts
// Confirme un abonnement aux status emails (double opt-in RGPD).
// GET /api/status/confirm?token=<unsubscribeToken> → set confirmedAt et redirige.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/status?confirm=missing_token", req.url));
  }

  const sub = await prisma.statusSubscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!sub) {
    return NextResponse.redirect(new URL("/status?confirm=invalid_token", req.url));
  }

  if (sub.unsubscribedAt) {
    return NextResponse.redirect(new URL("/status?confirm=unsubscribed", req.url));
  }

  if (sub.confirmedAt) {
    return NextResponse.redirect(new URL("/status?confirm=already_confirmed", req.url));
  }

  // Vérifier l'âge (7 jours max)
  const ageDays = (Date.now() - sub.createdAt.getTime()) / (24 * 3600 * 1000);
  if (ageDays > 7) {
    return NextResponse.redirect(new URL("/status?confirm=expired", req.url));
  }

  await prisma.statusSubscriber.update({
    where: { id: sub.id },
    data: { confirmedAt: new Date() },
  });

  return NextResponse.redirect(new URL("/status?confirm=success", req.url));
}
