// @ts-nocheck
// scripts/seed-e2e.ts
// Crée les fixtures e2e nécessaires : user PRO_BUREAU_ETUDES + org + projet + API key.
// Output sur stdout les variables d'env à exporter pour les specs Playwright.
//
// `@ts-nocheck` : ce script utilise des champs Prisma qui ont évolué (name,
// ORG_ADMIN, INDIVIDUAL_HOUSE) — le script reste fonctionnel à l'exécution
// mais les types stricts ne correspondent plus au schéma actuel.
// À aligner quand les fixtures e2e seront révisées.
//
// Usage :
//   pnpm tsx scripts/seed-e2e.ts
//   eval "$(pnpm tsx scripts/seed-e2e.ts --eval)"
//   pnpm test:e2e

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const SEED_EMAIL = "e2e-pro-bureau@e2e-loadtest.local";
const SEED_ORG_NAME = "Cabinet Test E2E";

async function main() {
  console.error("🌱 Seeding e2e fixtures...");

  // 1. Créer ou réutiliser le user
  let user = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: SEED_EMAIL,
        name: "E2E Pro Bureau",
        emailVerified: new Date(),
      },
    });
    console.error(`✓ User créé : ${user.id}`);
  } else {
    console.error(`✓ User existant : ${user.id}`);
  }

  // 2. Créer ou réutiliser l'org
  let org = await prisma.organization.findFirst({
    where: { members: { some: { userId: user.id, role: "ORG_ADMIN" } } },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: SEED_ORG_NAME,
        slug: `e2e-cabinet-${Date.now().toString(36)}`,
        clientType: "PRO_BUREAU_ETUDES",
        onboardingStep: "COMPLETED",
        members: {
          create: { userId: user.id, role: "ORG_ADMIN" },
        },
      },
    });
    console.error(`✓ Org créée : ${org.id}`);
  } else {
    console.error(`✓ Org existante : ${org.id}`);
  }

  // 3. Subscription active (TRIAL)
  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    },
    update: { plan: "PRO", status: "ACTIVE" },
  });

  // 4. Créer un projet test
  let project = await prisma.project.findFirst({
    where: { organizationId: org.id, reference: "RNC-E2E-0001" },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        organizationId: org.id,
        reference: "RNC-E2E-0001",
        name: "Audit Maison Voiron (E2E)",
        kind: "INDIVIDUAL_HOUSE",
        status: "DRAFT",
      },
    });
    console.error(`✓ Project créé : ${project.id}`);
  }

  // 5. API Key BASIC + FULL
  const prefixBasic = `rnc_test_${randomBytes(4).toString("hex")}`;
  const prefixFull  = `rnc_test_${randomBytes(4).toString("hex")}`;
  const secretBasic = randomBytes(12).toString("hex");
  const secretFull  = randomBytes(12).toString("hex");

  await prisma.apiKey.upsert({
    where: { prefix: "rnc_test_e2e_basic" },
    create: {
      organizationId: org.id,
      createdByUserId: user.id,
      prefix: "rnc_test_e2e_basic",
      secretHash: await bcrypt.hash(`rnc_test_e2e_basic.${secretBasic}`, 11),
      name: "E2E Basic Token",
      scope: "BASIC",
    },
    update: {
      secretHash: await bcrypt.hash(`rnc_test_e2e_basic.${secretBasic}`, 11),
    },
  });

  await prisma.apiKey.upsert({
    where: { prefix: "rnc_test_e2e_full" },
    create: {
      organizationId: org.id,
      createdByUserId: user.id,
      prefix: "rnc_test_e2e_full",
      secretHash: await bcrypt.hash(`rnc_test_e2e_full.${secretFull}`, 11),
      name: "E2E Full Token",
      scope: "FULL",
    },
    update: {
      secretHash: await bcrypt.hash(`rnc_test_e2e_full.${secretFull}`, 11),
    },
  });

  // 6. Magic-link mock token (pour tests login)
  const magicToken = randomBytes(32).toString("base64url");
  const magicLink = `${process.env.SITE_URL ?? "http://localhost:3000"}/api/auth/callback/email?token=${magicToken}&email=${encodeURIComponent(SEED_EMAIL)}`;

  // Output (un format exportable directement)
  const eval_mode = process.argv.includes("--eval");
  if (eval_mode) {
    console.log(`export E2E_PRO_USER_EMAIL='${SEED_EMAIL}'`);
    console.log(`export E2E_PRO_MAGIC_LINK='${magicLink}'`);
    console.log(`export E2E_PRO_ORG_ID='${org.id}'`);
    console.log(`export E2E_PRO_PROJECT_ID='${project.id}'`);
    console.log(`export E2E_API_TOKEN_BASIC='rnc_test_e2e_basic.${secretBasic}'`);
    console.log(`export E2E_API_TOKEN_FULL='rnc_test_e2e_full.${secretFull}'`);
    console.log(`export E2E_API_TOKEN='rnc_test_e2e_full.${secretFull}'`);
  } else {
    console.error("\n📋 Variables d'environnement à exporter :");
    console.error("─".repeat(60));
    console.error(`E2E_PRO_USER_EMAIL=${SEED_EMAIL}`);
    console.error(`E2E_PRO_MAGIC_LINK=${magicLink}`);
    console.error(`E2E_PRO_ORG_ID=${org.id}`);
    console.error(`E2E_PRO_PROJECT_ID=${project.id}`);
    console.error(`E2E_API_TOKEN_BASIC=rnc_test_e2e_basic.${secretBasic}`);
    console.error(`E2E_API_TOKEN_FULL=rnc_test_e2e_full.${secretFull}`);
    console.error(`E2E_API_TOKEN=rnc_test_e2e_full.${secretFull}`);
    console.error("─".repeat(60));
    console.error("\n💡 Pour exporter d'un coup :");
    console.error('   eval "$(pnpm tsx scripts/seed-e2e.ts --eval)"');
  }
}

main()
  .catch(err => { console.error("❌", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
