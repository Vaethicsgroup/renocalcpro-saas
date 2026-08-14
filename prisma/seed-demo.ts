// prisma/seed-demo.ts
// ═══════════════════════════════════════════════════════════════════════
// Seed IDEMPOTENT de données de démonstration pour la preview Vercel.
// Objectif : permettre à des testeurs bêta d'explorer RenocalcPro sans
// créer de compte, en se connectant avec des identifiants prêts à l'emploi.
//
// Utilisation :
//   DEMO_MODE=true npm run db:seed
//   ou :
//   npx tsx prisma/seed-demo.ts
//
// Sécurité :
// - Emails en @test.local (jamais routés vers vraie boîte)
// - Mot de passe unique demo1234 — CE N'EST QUE POUR LA PREVIEW
// - Aucune donnée personnelle réelle
// - Idempotent : peut se relancer sans doubler les données
// - Refuse de tourner si DATABASE_URL contient "prod" (garde-fou)
// ═══════════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Garde-fou anti-prod ───────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL ?? "";
if (/(\.prod\.|-prod-|_prod|renocalcpro\.fr|-production-)/i.test(dbUrl)) {
  console.error("[seed-demo] REFUS — DATABASE_URL semble pointer sur une base PROD.");
  console.error("[seed-demo] URL détectée :", dbUrl.replace(/:[^@]*@/, ":***@"));
  console.error("[seed-demo] Le seed démo est réservé aux bases preview/staging.");
  process.exit(1);
}

const DEMO_PASSWORD = "demo1234";

async function main() {
  console.log("[seed-demo] Démarrage — hashage password bcrypt…");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 8); // rounds=8 = rapide en seed

  // ─── 1. Organisations ──────────────────────────────────────────────────
  console.log("[seed-demo] 1/8 · Organisations");
  const orgParticulier = await prisma.organization.upsert({
    where: { slug: "demo-particuliers" },
    update: {},
    create: {
      slug: "demo-particuliers",
      name: "Démo Particuliers",
      clientType: "INDIVIDUAL",
      onboardingStep: "COMPLETED",
      primaryGoal: "REDUCE_BILLS",
      defaultLocale: "fr",
      signupSource: "seed-demo",
    },
  });

  const orgPro = await prisma.organization.upsert({
    where: { slug: "demo-cabinet-diagnostics" },
    update: {},
    create: {
      slug: "demo-cabinet-diagnostics",
      name: "Cabinet Diagnostics Démo",
      legalName: "SARL Cabinet Diagnostics Démo",
      siret: "00000000000000",
      brandColor: "#115e59",
      qualifs: ["OPQIBI 1905", "RGE Audit"],
      clientType: "PRO_DIAGNOSTICIAN",
      onboardingStep: "COMPLETED",
      segmentSize: "SMALL",
      monthlyVolume: 15,
      defaultLocale: "fr",
      signupSource: "seed-demo",
    },
  });
  console.log(`[seed-demo]   ✓ 2 orgs (${orgParticulier.id.slice(0,8)}…, ${orgPro.id.slice(0,8)}…)`);

  // ─── 2. Utilisateurs + Memberships ────────────────────────────────────
  console.log("[seed-demo] 2/8 · Utilisateurs + memberships");
  const userParticulier = await prisma.user.upsert({
    where: { email: "demo.particulier@test.local" },
    update: { passwordHash, fullName: "Alice Démo (Particulier)" },
    create: {
      email: "demo.particulier@test.local",
      passwordHash,
      fullName: "Alice Démo (Particulier)",
      emailVerifiedAt: new Date(),
      locale: "fr",
    },
  });

  const userPro = await prisma.user.upsert({
    where: { email: "demo.pro@test.local" },
    update: { passwordHash, fullName: "Bob Démo (Diagnostiqueur)" },
    create: {
      email: "demo.pro@test.local",
      passwordHash,
      fullName: "Bob Démo (Diagnostiqueur)",
      emailVerifiedAt: new Date(),
      locale: "fr",
    },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: userParticulier.id, organizationId: orgParticulier.id } },
    update: { role: "OWNER", acceptedAt: new Date() },
    create: {
      userId: userParticulier.id,
      organizationId: orgParticulier.id,
      role: "OWNER",
      acceptedAt: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: userPro.id, organizationId: orgPro.id } },
    update: { role: "OWNER", acceptedAt: new Date() },
    create: {
      userId: userPro.id,
      organizationId: orgPro.id,
      role: "OWNER",
      acceptedAt: new Date(),
    },
  });
  console.log(`[seed-demo]   ✓ 2 users + 2 memberships (OWNER)`);

  // ─── 3. Subscriptions ─────────────────────────────────────────────────
  console.log("[seed-demo] 3/8 · Subscriptions");
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 3600 * 1000);
  const in1Year = new Date(now.getTime() + 365 * 24 * 3600 * 1000);

  await prisma.subscription.upsert({
    where: { organizationId: orgParticulier.id },
    update: {},
    create: {
      organizationId: orgParticulier.id,
      plan: "P_MON_PROJET",
      status: "ACTIVE",
      billingPeriod: "MONTHLY",
      currentPeriodStart: now,
      currentPeriodEnd: in1Year,
      monthlyQuotaProjects: 5,
      monthlyQuotaReports: 5,
      monthlyQuotaPhotos: 100,
      monthlyQuotaAiTokens: 0, // IA off en démo
      seatsIncluded: 1,
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: orgPro.id },
    update: {},
    create: {
      organizationId: orgPro.id,
      plan: "TRIAL",
      status: "TRIALING",
      billingPeriod: "MONTHLY",
      trialEndsAt: in14Days,
      currentPeriodStart: now,
      currentPeriodEnd: in14Days,
      monthlyQuotaProjects: null, // illimité en trial
      monthlyQuotaReports: 20,
      monthlyQuotaPhotos: 500,
      monthlyQuotaAiTokens: 0,
      seatsIncluded: 3,
    },
  });
  console.log(`[seed-demo]   ✓ 2 souscriptions (P_MON_PROJET, TRIAL)`);

  // ─── 4. Projets ────────────────────────────────────────────────────────
  console.log("[seed-demo] 4/8 · Projets");

  const proj1 = await prisma.project.upsert({
    where: { organizationId_reference: { organizationId: orgParticulier.id, reference: "RNC-DEMO-0001" } },
    update: {},
    create: {
      organizationId: orgParticulier.id,
      reference: "RNC-DEMO-0001",
      name: "Ma maison à Lyon — audit rénovation",
      kind: "AUDIT_PARTICULIER",
      status: "IN_PROGRESS",
      clientName: "Alice Démo",
      clientEmail: "demo.particulier@test.local",
      clientNotes: "Maison 1975, chauffage fioul, envie de basculer PAC + isoler combles.",
    },
  });

  const proj2 = await prisma.project.upsert({
    where: { organizationId_reference: { organizationId: orgPro.id, reference: "RNC-DEMO-0002" } },
    update: {},
    create: {
      organizationId: orgPro.id,
      reference: "RNC-DEMO-0002",
      name: "Copropriété 24 lots — Paris 19e",
      kind: "AUDIT_COPROPRIETE",
      status: "REPORT_READY",
      clientName: "Syndicat Bel Air",
      clientEmail: "syndic@test.local",
      clientNotes: "Copro 1968, chauffage collectif gaz, AG prévue T4 2026.",
    },
  });

  const proj3 = await prisma.project.upsert({
    where: { organizationId_reference: { organizationId: orgPro.id, reference: "RNC-DEMO-0003" } },
    update: {},
    create: {
      organizationId: orgPro.id,
      reference: "RNC-DEMO-0003",
      name: "Bureaux tertiaire — Lille 800 m²",
      kind: "AUDIT_TERTIAIRE",
      status: "IN_PROGRESS",
      clientName: "SAS Innovex",
      clientEmail: "contact@test.local",
      clientNotes: "R+2 années 90, chauffage électrique convecteurs, décret tertiaire à respecter.",
    },
  });
  console.log(`[seed-demo]   ✓ 3 projets (maison, copro, tertiaire)`);

  // ─── 5. Buildings ─────────────────────────────────────────────────────
  console.log("[seed-demo] 5/8 · Buildings");
  await prisma.building.upsert({
    where: { projectId: proj1.id },
    update: {},
    create: {
      projectId: proj1.id,
      addressLine: "12 rue des Lilas",
      city: "Lyon",
      postalCode: "69003",
      latitude: 45.7484,
      longitude: 4.8467,
      altitudeM: 173,
      climateZone: "H1c",
      djuBase18: 2200,
      contextUrban: "pavillonnaire",
      facadeAzimuth: 180,
      facadeAzimuthConfidence: "estimated",
      yearBuilt: 1975,
      yearBuiltConfidence: "verified",
      surfaceM2: 120,
      ceilingHeightM: 2.5,
      occupants: 4,
      levels: 2,
      groundType: "VIDE_SANITAIRE",
      floorStructure: "HOURDIS_POUTRELLES",
      floorAccessible: true,
    },
  });

  await prisma.building.upsert({
    where: { projectId: proj2.id },
    update: {},
    create: {
      projectId: proj2.id,
      addressLine: "45 avenue Jean Jaurès",
      city: "Paris",
      postalCode: "75019",
      latitude: 48.8843,
      longitude: 2.3826,
      altitudeM: 45,
      climateZone: "H1a",
      djuBase18: 2400,
      contextUrban: "dense",
      facadeAzimuth: 90,
      yearBuilt: 1968,
      surfaceM2: 1850,
      ceilingHeightM: 2.6,
      occupants: 48,
      levels: 6,
      nLogements: 24,
      nLotsCommerce: 2,
      tantiemesBase: 10000,
      syndicatName: "Syndicat Bel Air",
    },
  });

  await prisma.building.upsert({
    where: { projectId: proj3.id },
    update: {},
    create: {
      projectId: proj3.id,
      addressLine: "8 rue de la République",
      city: "Lille",
      postalCode: "59000",
      latitude: 50.6293,
      longitude: 3.0573,
      altitudeM: 20,
      climateZone: "H1a",
      djuBase18: 2350,
      contextUrban: "dense",
      facadeAzimuth: 270,
      yearBuilt: 1994,
      surfaceM2: 820,
      ceilingHeightM: 2.7,
      occupants: 45,
      levels: 3,
      nafCode: "6209Z",
      decretCategory: "TERTIAIRE_BUREAUX",
      surfaceSubatM2: 820,
    },
  });
  console.log(`[seed-demo]   ✓ 3 buildings`);

  // ─── 6. Scénarios + Interventions + Aides ─────────────────────────────
  console.log("[seed-demo] 6/8 · Scénarios + interventions + aides");
  for (const p of [proj1, proj2, proj3]) {
    // Scénario ECO (isolation combles seule)
    const eco = await prisma.scenario.upsert({
      where: { projectId_scenarioKey: { projectId: p.id, scenarioKey: "ECO" } },
      update: {},
      create: {
        projectId: p.id,
        scenarioKey: "ECO",
        name: "Économique — isolation combles",
        tagline: "Le geste rapide, ROI < 8 ans",
        isRecommended: false,
        kwhBefore: 320,
        kwhAfter: 260,
        costTtc: 8500,
        aidsTotal: 3200,
        netCost: 5300,
        paybackYears: 6.5,
        npv25y: 12000,
        co2BeforeKg: 5800,
        co2AfterKg: 4700,
        dpeClassBefore: "F",
        dpeClassAfter: "E",
      },
    });

    // Scénario PERFORMANT (isolation + PAC + VMC)
    const perf = await prisma.scenario.upsert({
      where: { projectId_scenarioKey: { projectId: p.id, scenarioKey: "PERFORMANT" } },
      update: {},
      create: {
        projectId: p.id,
        scenarioKey: "PERFORMANT",
        name: "Performant — bouquet 3 gestes",
        tagline: "Sortie de passoire thermique, DPE cible C",
        isRecommended: true,
        kwhBefore: 320,
        kwhAfter: 110,
        costTtc: 34000,
        aidsTotal: 14200,
        netCost: 19800,
        paybackYears: 12,
        npv25y: 41000,
        co2BeforeKg: 5800,
        co2AfterKg: 1900,
        dpeClassBefore: "F",
        dpeClassAfter: "C",
      },
    });

    // Interventions pour ECO
    await prisma.intervention.deleteMany({ where: { scenarioId: eco.id } });
    await prisma.intervention.createMany({
      data: [{
        scenarioId: eco.id,
        lot: "isolation",
        title: "Isolation combles perdus",
        description: "Laine de verre soufflée 320 mm, R=8",
        performanceTarget: "R 8.0",
        surfaceM2: 90,
        qty: 90,
        unit: "m²",
        unitPriceTtc: 45,
        totalPriceTtc: 4050,
        vatRate: 0.055,
        benefits: "Confort été et hiver, réduit ~30% du chauffage",
      }],
    });

    // Interventions pour PERFORMANT
    await prisma.intervention.deleteMany({ where: { scenarioId: perf.id } });
    await prisma.intervention.createMany({
      data: [
        {
          scenarioId: perf.id,
          lot: "isolation",
          title: "Isolation combles perdus",
          description: "Laine de verre soufflée 400 mm, R=10",
          performanceTarget: "R 10.0",
          surfaceM2: 90,
          qty: 90,
          unit: "m²",
          unitPriceTtc: 55,
          totalPriceTtc: 4950,
          vatRate: 0.055,
        },
        {
          scenarioId: perf.id,
          lot: "chauffage",
          title: "Pompe à chaleur air-eau 12 kW",
          description: "PAC bi-bloc, COP 4.2, remplace chaudière fioul",
          performanceTarget: "SCOP 4.2",
          qty: 1,
          unit: "u",
          unitPriceTtc: 18000,
          totalPriceTtc: 18000,
          vatRate: 0.055,
        },
        {
          scenarioId: perf.id,
          lot: "ventilation",
          title: "VMC double flux",
          description: "Récupération chaleur 85%, filtres F7",
          performanceTarget: "η 85%",
          qty: 1,
          unit: "u",
          unitPriceTtc: 4500,
          totalPriceTtc: 4500,
          vatRate: 0.10,
        },
      ],
    });

    // Aides pour ECO
    await prisma.aid.deleteMany({ where: { scenarioId: eco.id } });
    await prisma.aid.createMany({
      data: [
        { scenarioId: eco.id, kind: "MPR_PARCOURS_GESTE", label: "MaPrimeRénov' — combles", amount: 2500, authority: "ANAH" },
        { scenarioId: eco.id, kind: "CEE",                label: "Prime CEE — isolation combles", amount: 700, authority: "Obligé énergie" },
      ],
    });

    // Aides pour PERFORMANT
    await prisma.aid.deleteMany({ where: { scenarioId: perf.id } });
    await prisma.aid.createMany({
      data: [
        { scenarioId: perf.id, kind: "MPR_PARCOURS_ACCOMPAGNE", label: "MaPrimeRénov' Accompagné", amount: 9500, authority: "ANAH" },
        { scenarioId: perf.id, kind: "CEE",                     label: "Prime CEE bouquet",        amount: 2700, authority: "Obligé énergie" },
        { scenarioId: perf.id, kind: "TVA_REDUITE",             label: "TVA réduite 5.5%",         amount: 1500, authority: "État" },
        { scenarioId: perf.id, kind: "ECO_PTZ",                 label: "Éco-PTZ (0% sur 15 ans)",  amount: 30000, authority: "Banques partenaires", conditions: "Prêt à taux zéro, remboursable" },
      ],
    });
  }
  console.log(`[seed-demo]   ✓ 6 scénarios (2 par projet) + interventions + aides`);

  // ─── 7. Rapports (synthèse) ────────────────────────────────────────────
  console.log("[seed-demo] 7/8 · Rapports (synthèse)");
  for (const [p, authorId] of [[proj1, userParticulier.id], [proj2, userPro.id], [proj3, userPro.id]] as const) {
    const existing = await prisma.report.findFirst({ where: { projectId: p.id, level: "SYNTHESE" } });
    if (!existing) {
      await prisma.report.create({
        data: {
          projectId: p.id,
          authoredById: authorId,
          templateKind: p.kind,
          level: "SYNTHESE",
          language: "fr",
          status: "READY",
          generatedAt: new Date(),
          calcHash: "demo-hash",
          pages: 12,
        },
      });
    }
  }
  console.log(`[seed-demo]   ✓ 3 rapports SYNTHESE`);

  // ─── 8. Bilan ─────────────────────────────────────────────────────────
  console.log("[seed-demo] 8/8 · Bilan");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("Comptes de démo créés :");
  console.log("  demo.particulier@test.local / demo1234  → Org 'Démo Particuliers' (OWNER)");
  console.log("  demo.pro@test.local         / demo1234  → Org 'Cabinet Diagnostics Démo' (OWNER)");
  console.log("");
  console.log("Projets créés :");
  console.log("  RNC-DEMO-0001 — Maison Lyon (particulier)");
  console.log("  RNC-DEMO-0002 — Copropriété Paris 19e (pro)");
  console.log("  RNC-DEMO-0003 — Bureaux tertiaire Lille (pro)");
  console.log("");
  console.log("Chaque projet contient 2 scénarios (ECO + PERFORMANT), leurs interventions,");
  console.log("leurs aides (MPR + CEE + TVA + Éco-PTZ), et un rapport SYNTHESE prêt.");
  console.log("═══════════════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[seed-demo] ÉCHEC :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
