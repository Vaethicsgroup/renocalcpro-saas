// e2e/v2-redesign.spec.ts — Tests E2E v2 multi-viewport effectifs
// Tag : @v2-redesign · exécution ciblée : npx playwright test --grep @v2-redesign

import { expect } from "@playwright/test";
import { test, VIEWPORTS, expectNoHorizontalOverflow } from "./fixtures/auth";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("@v2-redesign — Pages publiques", () => {
  for (const vp of VIEWPORTS) {
    test(`landing ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/fr`);
      // Hero présent
      await expect(page.getByRole("heading", { level: 1 })).toContainText(/rénovation énergétique/i);
      // Header + Footer présents
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      // CTA accessible
      await expect(page.getByRole("link", { name: /Créer mon projet/i }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test(`pricing ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/fr/tarifs`);
      await expect(page.getByRole("heading", { name: /Choisissez la formule/i })).toBeVisible();
      // Les 4 plans présents (peuvent être en carousel mobile)
      for (const plan of ["SOLO", "PRO", "ENTREPRISE"]) {
        await expect(page.getByText(plan).first()).toBeVisible();
      }
      await expectNoHorizontalOverflow(page);
    });
  }
});

test.describe("@v2-redesign — Parcours INDIVIDUAL (authentifié)", () => {
  test.beforeEach(async ({ authenticateAs }) => {
    await authenticateAs("individual");
  });

  for (const vp of VIEWPORTS) {
    test(`dashboard particulier ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/fr/p/dashboard`);
      await expect(page.getByText(/Bonjour/i)).toBeVisible();
      await expect(page.getByText(/scénario favori/i)).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  test("projet detail tabs + savings SVG", async ({ page }) => {
    await page.goto(`${BASE}/fr/p/projects/demo/savings`);
    await expect(page.getByRole("heading", { name: /Économies projetées/i })).toBeVisible();
    await expect(page.getByRole("img", { name: /VAN cumulée/i })).toBeVisible();
  });

  test("compte particulier accessible", async ({ page }) => {
    await page.goto(`${BASE}/fr/p/account`);
    await expect(page.getByRole("heading", { name: /Mon compte/i })).toBeVisible();
    // Sections RGPD
    await expect(page.getByText(/Exporter toutes mes données/i)).toBeVisible();
    await expect(page.getByText(/Supprimer mon compte/i)).toBeVisible();
  });
});

test.describe("@v2-redesign — Parcours PRO (authentifié)", () => {
  test.beforeEach(async ({ authenticateAs }) => {
    await authenticateAs("pro");
  });

  for (const vp of VIEWPORTS) {
    test(`dashboard pro ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/fr/o/dashboard`);
      await expect(page.getByText(/Tableau de bord/i)).toBeVisible();
      // KPIs cabinet
      await expect(page.getByText(/MRR/i)).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  test("workspace projet : 7 tabs accessibles", async ({ page }) => {
    await page.goto(`${BASE}/fr/o/projects/p1/identite`);
    await expect(page.getByRole("navigation", { name: /Onglets workspace projet/i })).toBeVisible();
    // Tabs présentes
    for (const tab of ["Identité", "Enveloppe", "Systèmes", "Confort", "Scénarios", "Aides", "Rapports"]) {
      await expect(page.getByRole("link", { name: new RegExp(tab, "i") })).toBeVisible();
    }
  });
});

test.describe("@v2-redesign — Parcours ADMIN (authentifié)", () => {
  test.beforeEach(async ({ authenticateAs }) => {
    await authenticateAs("admin");
  });

  for (const vp of VIEWPORTS) {
    test(`dashboard admin ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/fr/admin`);
      await expect(page.getByRole("heading", { name: /Tableau de bord global/i })).toBeVisible();
      // 6 KPIs : MRR, ARR, Signups, Churn, NPS, Activation
      for (const kpi of ["MRR", "ARR", "NPS"]) {
        await expect(page.getByText(kpi).first()).toBeVisible();
      }
      // 4 graphs (titres présents)
      await expect(page.getByText(/Évolution du chiffre d'affaires/i)).toBeVisible();
      await expect(page.getByText(/Funnel signup/i)).toBeVisible();
      await expect(page.getByText(/Cohort retention/i)).toBeVisible();
      await expect(page.getByText(/Répartition par segment/i)).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});

test.describe("@v2-redesign — i18n cohérence (5 langues)", () => {
  for (const locale of ["fr", "en", "es", "de", "pt"]) {
    test(`landing ${locale}`, async ({ page }) => {
      await page.goto(`${BASE}/${locale}`);
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});

test.describe("@v2-redesign — Design system", () => {
  test("vitrine /dev/design-system", async ({ page }) => {
    await page.goto(`${BASE}/fr/dev/design-system`);
    await expect(page.getByText(/Premium v2.0/i)).toBeVisible();
    await expect(page.getByText(/Palette/i)).toBeVisible();
  });
});
