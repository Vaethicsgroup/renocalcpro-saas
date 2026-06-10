// src/app/api/calc/pdf/route.ts — Route PDF v2 (étape D MVP freemium)
//
// STATUT GÉNÉRATION PDF : NEUTRALISÉE.
//   React-PDF avait provoqué l'erreur #31 et freeze le boot Next. La route
//   reste donc en mode "neutralized: true" — elle ne déclenche AUCUN appel
//   React-PDF, ce qui garantit la stabilité du boot.
//
// CE QUI EST FAIT À L'ÉTAPE D (sans rebrancher React-PDF) :
//   - Lecture du plan billing courant côté serveur via getCurrentBillingPlan
//     (placeholder réel : NextAuth + Subscription).
//   - Application du gate freemium via checkPdfExportAllowed :
//     * FREE demandant "full" → 402 plan_limit_reached.
//     * FREE demandant "watermarked_preview" → 200 (gate OK) MAIS toujours
//       neutralized=true tant que React-PDF est désactivé.
//     * PRO/TRIAL/TEAM/ENTERPRISE → 200 neutralized.
//   - Le serveur RESCELLE le mode et le watermark : le client ne peut pas
//     forcer "full" en passant `?mode=full` quand son plan ne l'autorise pas.
//
// QUAND REBRANCHER React-PDF :
//   - Le gate est DÉJÀ en place. Pas besoin d'y retoucher.
//   - Il suffira de remplacer le `neutralized: true` par l'appel React-PDF
//     dynamique (await import + renderToStream).
//   - Si on remet un import top-level React-PDF, on RISQUE de re-bloquer le
//     boot. Toujours utiliser `await import("@react-pdf/renderer")` dans le
//     handler, jamais en import statique.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentBillingPlan } from "@/server/auth/getCurrentBillingPlan";
import {
  checkPdfExportAllowed,
  type AccountIdentity,
  type RequestContext,
  type PdfExportMode,
} from "@/server/actions/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PdfGateOutcome {
  allowed: boolean;
  effectiveMode?: PdfExportMode;
  watermark?: boolean;
  reason?: string;
  message?: string;
  plan: string;
}

async function runGate(
  requestedModeParam: string | null,
  req: NextRequest,
): Promise<PdfGateOutcome> {
  // 1. Lecture du plan billing courant (placeholder FREE si pas de session/DB)
  const plan = await getCurrentBillingPlan();

  // 2. Normalisation du mode demandé par le client
  const requestedMode: PdfExportMode =
    requestedModeParam === "full" ? "full" : "watermarked_preview";

  // 3. Identité compte minimal (accountId = "anonymous" tant que NextAuth pas
  //    branché pour les routes API publiques ; en interne le caller peut
  //    passer un vrai ID via headers). MVP : utilise `plan` comme axe principal.
  const account: AccountIdentity = {
    accountId: "anonymous",
    plan,
    emailVerified: true,
  };

  // 4. Contexte requête (device/IP hash anti-abus, non bloquants à ce stade)
  const ctx: RequestContext = {
    rawIp: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  };

  // 5. Décision policy serveur — c'est la SEULE source de vérité.
  const decision = await checkPdfExportAllowed(account, requestedMode, ctx);

  if (!decision.allowed) {
    return {
      allowed: false,
      reason: decision.reason,
      message: decision.message,
      plan,
    };
  }

  return {
    allowed: true,
    effectiveMode: decision.payload.effectiveMode,
    watermark: decision.payload.watermark,
    plan,
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const requestedMode = url.searchParams.get("mode");

  const gate = await runGate(requestedMode, req);

  if (!gate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "plan_limit_reached",
        reason: gate.reason,
        message: gate.message,
        plan: gate.plan,
      },
      { status: 402 },
    );
  }

  // Gate passé. PDF reste neutralisé — ne PAS importer React-PDF ici.
  return NextResponse.json(
    {
      ok: true,
      neutralized: true,
      message:
        "Gate freemium OK. Génération PDF réelle non encore réactivée (React-PDF en cours de stabilisation).",
      plan: gate.plan,
      effectiveMode: gate.effectiveMode,
      watermark: gate.watermark,
      received_query: Object.fromEntries(url.searchParams.entries()),
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  // POST peut aussi vouloir un mode dans le body (à terme). Pour l'instant on
  // ne lit que le mode en query string ; le gate est appliqué de manière
  // identique.
  const url = new URL(req.url);
  const requestedMode = url.searchParams.get("mode");

  const gate = await runGate(requestedMode, req);

  if (!gate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "plan_limit_reached",
        reason: gate.reason,
        message: gate.message,
        plan: gate.plan,
      },
      { status: 402 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      neutralized: true,
      message:
        "Gate freemium OK. Génération PDF réelle non encore réactivée (React-PDF en cours de stabilisation).",
      plan: gate.plan,
      effectiveMode: gate.effectiveMode,
      watermark: gate.watermark,
    },
    { status: 200 },
  );
}
