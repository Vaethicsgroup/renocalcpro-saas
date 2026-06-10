// prisma/seed-features.ts
// Seed idempotent de la matrice PlanFeature.
// `npx tsx prisma/seed-features.ts` ou via prisma db seed.

import { PrismaClient, type SubscriptionPlan, type FeatureFlag } from "@prisma/client";

const prisma = new PrismaClient();

type Row = {
  plan: SubscriptionPlan;
  feature: FeatureFlag;
  enabled?: boolean;
  hardLimit?: number | null;
};

// ── Matrice plan × feature ───────────────────────────────────────────────────
//   null = illimité, 0 = désactivé.
const MATRIX: Row[] = [
  // ── PARTICULIER · DECOUVERTE (gratuit) ───────────────────────────────────
  { plan: "P_DECOUVERTE", feature: "CALC_BASIC" },
  { plan: "P_DECOUVERTE", feature: "PDF_TEMPLATE_PARTICULIER", hardLimit: 1 },

  // ── PARTICULIER · MON_PROJET (payant ponctuel) ───────────────────────────
  { plan: "P_MON_PROJET", feature: "CALC_BASIC" },
  { plan: "P_MON_PROJET", feature: "CALC_ADVANCED_SCENARIOS" },
  { plan: "P_MON_PROJET", feature: "PDF_TEMPLATE_PARTICULIER", hardLimit: 5 },
  { plan: "P_MON_PROJET", feature: "AI_PHOTO_ANALYSIS",        hardLimit: 50 },
  { plan: "P_MON_PROJET", feature: "AI_REPORT_DRAFTING",       hardLimit: 5 },

  // ── TRIAL (essai pro 14 j) ───────────────────────────────────────────────
  { plan: "TRIAL", feature: "CALC_BASIC" },
  { plan: "TRIAL", feature: "CALC_ADVANCED_SCENARIOS" },
  { plan: "TRIAL", feature: "PDF_TEMPLATE_PARTICULIER",   hardLimit: 3 },
  { plan: "TRIAL", feature: "PDF_TEMPLATE_DPE_COLLECTIF", hardLimit: 1 },
  { plan: "TRIAL", feature: "AI_PHOTO_ANALYSIS",          hardLimit: 100 },
  { plan: "TRIAL", feature: "AI_REPORT_DRAFTING",         hardLimit: 3 },

  // ── SOLO ─────────────────────────────────────────────────────────────────
  { plan: "SOLO", feature: "CALC_BASIC" },
  { plan: "SOLO", feature: "CALC_ADVANCED_SCENARIOS" },
  { plan: "SOLO", feature: "PDF_TEMPLATE_PARTICULIER" },
  { plan: "SOLO", feature: "PDF_TEMPLATE_DPE_COLLECTIF",  hardLimit: 5 },
  { plan: "SOLO", feature: "AI_PHOTO_ANALYSIS",           hardLimit: 200 },
  { plan: "SOLO", feature: "AI_REPORT_DRAFTING",          hardLimit: 20 },
  { plan: "SOLO", feature: "CLIENT_PORTAL_PUBLIC_LINK" },

  // ── PRO ──────────────────────────────────────────────────────────────────
  { plan: "PRO", feature: "CALC_BASIC" },
  { plan: "PRO", feature: "CALC_ADVANCED_SCENARIOS" },
  { plan: "PRO", feature: "PDF_TEMPLATE_PARTICULIER" },
  { plan: "PRO", feature: "PDF_TEMPLATE_DPE_COLLECTIF" },
  { plan: "PRO", feature: "PDF_TEMPLATE_COPROPRIETE" },
  { plan: "PRO", feature: "PDF_TEMPLATE_TERTIAIRE" },
  { plan: "PRO", feature: "PDF_BRAND_WHITELABEL" },
  { plan: "PRO", feature: "AI_PHOTO_ANALYSIS",            hardLimit: 1000 },
  { plan: "PRO", feature: "AI_REPORT_DRAFTING",           hardLimit: 100 },
  { plan: "PRO", feature: "AI_AGENT_ORCHESTRATOR",        hardLimit: 50 },
  { plan: "PRO", feature: "CLIENT_PORTAL_PUBLIC_LINK" },
  { plan: "PRO", feature: "COMMENT_THREADS" },
  { plan: "PRO", feature: "AUDIT_LOG_EXPORT" },

  // ── TEAM ─────────────────────────────────────────────────────────────────
  { plan: "TEAM", feature: "CALC_BASIC" },
  { plan: "TEAM", feature: "CALC_ADVANCED_SCENARIOS" },
  { plan: "TEAM", feature: "PDF_TEMPLATE_PARTICULIER" },
  { plan: "TEAM", feature: "PDF_TEMPLATE_DPE_COLLECTIF" },
  { plan: "TEAM", feature: "PDF_TEMPLATE_COPROPRIETE" },
  { plan: "TEAM", feature: "PDF_TEMPLATE_TERTIAIRE" },
  { plan: "TEAM", feature: "PDF_BRAND_WHITELABEL" },
  { plan: "TEAM", feature: "AI_PHOTO_ANALYSIS" },
  { plan: "TEAM", feature: "AI_REPORT_DRAFTING" },
  { plan: "TEAM", feature: "AI_AGENT_ORCHESTRATOR" },
  { plan: "TEAM", feature: "TEAM_MULTI_SEAT" },
  { plan: "TEAM", feature: "CLIENT_PORTAL_PUBLIC_LINK" },
  { plan: "TEAM", feature: "COMMENT_THREADS" },
  { plan: "TEAM", feature: "AUDIT_LOG_EXPORT" },
  { plan: "TEAM", feature: "WEBHOOKS" },

  // ── ENTERPRISE — tout activé, illimité ───────────────────────────────────
  { plan: "ENTERPRISE", feature: "CALC_BASIC" },
  { plan: "ENTERPRISE", feature: "CALC_ADVANCED_SCENARIOS" },
  { plan: "ENTERPRISE", feature: "PDF_TEMPLATE_PARTICULIER" },
  { plan: "ENTERPRISE", feature: "PDF_TEMPLATE_DPE_COLLECTIF" },
  { plan: "ENTERPRISE", feature: "PDF_TEMPLATE_COPROPRIETE" },
  { plan: "ENTERPRISE", feature: "PDF_TEMPLATE_TERTIAIRE" },
  { plan: "ENTERPRISE", feature: "PDF_BRAND_WHITELABEL" },
  { plan: "ENTERPRISE", feature: "AI_PHOTO_ANALYSIS" },
  { plan: "ENTERPRISE", feature: "AI_REPORT_DRAFTING" },
  { plan: "ENTERPRISE", feature: "AI_AGENT_ORCHESTRATOR" },
  { plan: "ENTERPRISE", feature: "TEAM_MULTI_SEAT" },
  { plan: "ENTERPRISE", feature: "CLIENT_PORTAL_PUBLIC_LINK" },
  { plan: "ENTERPRISE", feature: "COMMENT_THREADS" },
  { plan: "ENTERPRISE", feature: "AUDIT_LOG_EXPORT" },
  { plan: "ENTERPRISE", feature: "WEBHOOKS" },
  { plan: "ENTERPRISE", feature: "REST_API" },
];

async function main() {
  console.log(`Seeding ${MATRIX.length} feature rows…`);
  for (const row of MATRIX) {
    await prisma.planFeature.upsert({
      where: { plan_feature: { plan: row.plan, feature: row.feature } },
      create: {
        plan: row.plan,
        feature: row.feature,
        enabled: row.enabled ?? true,
        hardLimit: row.hardLimit ?? null,
      },
      update: {
        enabled: row.enabled ?? true,
        hardLimit: row.hardLimit ?? null,
      },
    });
  }
  console.log("Seed terminé.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
