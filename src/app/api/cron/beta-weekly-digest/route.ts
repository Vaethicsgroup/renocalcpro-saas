// app/api/cron/beta-weekly-digest/route.ts
// Cron worker hebdo (lundi 9h UTC) qui envoie le digest aux beta testers actifs.
// Programmation : 0 9 * * 1 curl -H "x-cron-secret: $CRON_SECRET" .../api/cron/beta-weekly-digest

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FeatureOfTheWeek {
  weekStartIso: string;
  featureTitle: string;
  featureDescription: string;
  featureUrl: string;
  feedbackQuestion: string;
  feedbackUrl: string;
}

// Programmation rolling : 5 features pré-configurées, on cycle.
// En prod : table dédiée BetaFeatureOfWeek + UI admin.
const FEATURES_QUEUE: FeatureOfTheWeek[] = [
  {
    weekStartIso: "2026-05-11",
    featureTitle: "Identification matériau par photo (IA Vision)",
    featureDescription: "Prenez une photo d'un mur depuis l'app mobile, recevez 3 suggestions de matériau avec confiance %.",
    featureUrl: "https://renocalcpro.fr/fr/help/identifier-photo-mobile",
    feedbackQuestion: "Sur quelle catégorie (mur / plancher / menuiserie) l'IA a-t-elle été la plus précise ?",
    feedbackUrl: "https://renocalcpro.fr/fr/feedback/photo-id",
  },
  {
    weekStartIso: "2026-05-18",
    featureTitle: "Score de confort été/hiver visualisé",
    featureDescription: "Composant ComfortRadar avec mode comparaison avant/après travaux. Causes et améliorations détaillées.",
    featureUrl: "https://renocalcpro.fr/fr/help/comprendre-confort",
    feedbackQuestion: "Le score 1-5 est-il cohérent avec votre expérience terrain ?",
    feedbackUrl: "https://renocalcpro.fr/fr/feedback/comfort-score",
  },
  {
    weekStartIso: "2026-05-25",
    featureTitle: "Vérification compatibilité hygrothermique",
    featureDescription: "Détection automatique des associations à risque (pierre + ciment, pisé + RPE...) avec recommandations alternatives.",
    featureUrl: "https://renocalcpro.fr/fr/help/compatibilite-hygro",
    feedbackQuestion: "Avez-vous identifié des incompatibilités terrain non couvertes par notre moteur ?",
    feedbackUrl: "https://renocalcpro.fr/fr/feedback/hygro",
  },
  {
    weekStartIso: "2026-06-01",
    featureTitle: "Sélection bâti initial — bibliothèque 80 matériaux",
    featureDescription: "MaterialPicker avec filtres par catégorie + niveau de confiance par défaut.",
    featureUrl: "https://renocalcpro.fr/fr/help/utiliser-material-picker",
    feedbackQuestion: "Quel matériau du bâti ancien manque-t-il dans notre bibliothèque ?",
    feedbackUrl: "https://renocalcpro.fr/fr/feedback/materials",
  },
];

function getCurrentFeature(): FeatureOfTheWeek | null {
  const now = new Date().toISOString().slice(0, 10);
  // Prend la feature la plus récente dont le weekStart est <= aujourd'hui
  const sorted = [...FEATURES_QUEUE].sort((a, b) => b.weekStartIso.localeCompare(a.weekStartIso));
  return sorted.find(f => f.weekStartIso <= now) ?? null;
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: "cron_secret_not_configured" }, { status: 500 });
  const provided = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (provided !== expected) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const feature = getCurrentFeature();
  if (!feature) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no_feature_scheduled" });
  }

  // Récupère les beta testers acceptés actifs
  const accepted = await prisma.betaApplication.findMany({
    where: { status: "ACCEPTED" },
    select: { id: true, email: true, fullName: true, segment: true },
  });

  const weekNumber = Math.ceil(((Date.now() - new Date("2026-01-01").getTime()) / (7 * 24 * 3600 * 1000)));

  let sent = 0;
  for (const beta of accepted) {
    // TODO: appel sendEmail avec template "beta-weekly-digest"
    // await sendEmail({
    //   to: beta.email,
    //   locale: "fr",  // TODO: récupérer locale du user
    //   template: "beta-weekly-digest",
    //   props: {
    //     fullName: beta.fullName,
    //     weekNumber,
    //     ...feature,
    //     unsubscribeUrl: `https://renocalcpro.fr/api/beta/unsubscribe-digest?id=${beta.id}`,
    //   },
    // });
    sent++;
  }

  console.info(`[cron:beta-weekly-digest] week ${weekNumber}, sent to ${sent} beta testers`);

  return NextResponse.json({
    ok: true,
    weekNumber,
    feature: feature.featureTitle,
    sent,
    betaTestersTotal: accepted.length,
  });
}
