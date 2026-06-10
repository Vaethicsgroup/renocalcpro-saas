// e2e/onboarding.spec.ts — Parcours INDIVIDUAL + PRO_BUREAU_ETUDES.
import { test, expect } from "@playwright/test";

test.describe("Onboarding INDIVIDUAL", () => {
  test("parcours complet : 5 écrans → plan suggéré Découverte", async ({ page }) => {
    await page.goto("/fr/signup");

    // Écran 1 — choix INDIVIDUAL
    await page.getByRole("button", { name: /particulier/i }).click();

    // Écran 3 — email (étape 2 skipée pour individuels)
    await page.getByLabel(/adresse email/i).fill("test@example.com");
    await page.getByRole("button", { name: /^créer un compte$|^s'inscrire$/i }).click();

    // Écran 4 — objectif "Identifier toutes les aides"
    await page.getByRole("button", { name: /identifier toutes les aides/i }).click();

    // Écran 5 — plan suggéré P_DECOUVERTE pour FIND_AIDS
    await expect(page.getByText(/découverte/i)).toBeVisible();
  });
});

test.describe("Onboarding PRO_BUREAU_ETUDES", () => {
  test("parcours complet : 5 écrans → plan suggéré Pro", async ({ page }) => {
    await page.goto("/fr/signup");

    // Écran 1 — choix PRO
    await page.getByRole("button", { name: /^professionnel$/i }).click();

    // Écran 2 — bureau d'études + 30 dossiers/mois
    await page.getByLabel(/bureau d'études/i).check();
    await page.getByLabel(/dossiers par mois/i).fill("30");
    await page.getByRole("button", { name: /suivant/i }).click();

    // Écran 3 — email
    await page.getByLabel(/adresse email/i).fill("audit@bureau.fr");
    await page.getByRole("button", { name: /^créer un compte$|^s'inscrire$/i }).click();

    // Écran 4 — objectif premier
    await page.getByRole("button").nth(0).click();

    // Écran 5 — plan suggéré PRO (volume 30 → PRO via suggestPlan)
    await expect(page.getByText(/pro\s*\(/i)).toBeVisible();
  });
});

test.describe("Onboarding — stepper visible", () => {
  test("le stepper affiche bien 5 étapes", async ({ page }) => {
    await page.goto("/fr/signup");
    const steps = await page.locator('[aria-label="Étapes"] li').count();
    expect(steps).toBe(5);
  });
});
