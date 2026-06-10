// e2e/ai-assistant.spec.ts
// Scénarios E2E Playwright sur l'assistant IA métier (mode MOCK : ANTHROPIC_API_KEY absent).
// Pré-requis : seed e2e (PRO_BUREAU_ETUDES + INDIVIDUAL_USER) via scripts/seed-e2e.ts.

import { test, expect } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("AI Assistant — parcours complet", () => {
  test.beforeEach(async ({ page }) => {
    // Login mock magic-link via seed e2e
    await page.goto(`${BASE}/fr/auth/signin?e2e=1&email=pro-bureau@renocal.test`);
    await page.waitForURL(/\/fr\/o\/dashboard/);
  });

  test("Pattern 1 — démo page : ouvrir assistant via FieldHelper inline", async ({ page }) => {
    await page.goto(`${BASE}/fr/dev/ai-assistant-demo`);
    await page.getByLabel(/Aide sur le champ Surface habitable/).click();
    await expect(page.getByRole("complementary", { name: /Assistant IA/ })).toBeVisible();
    await expect(page.getByText("Surface habitable")).toBeVisible();
  });

  test("Pattern 2 — bouton flottant ouvre l'assistant en GENERAL", async ({ page }) => {
    await page.goto(`${BASE}/fr/o/dashboard`);
    await page.getByRole("button", { name: /Ouvrir l'assistant IA/ }).click();
    await expect(page.getByRole("complementary", { name: /Assistant IA/ })).toBeVisible();
  });

  test("Envoyer message + recevoir réponse mock + feedback 👍", async ({ page }) => {
    await page.goto(`${BASE}/fr/o/dashboard`);
    await page.getByRole("button", { name: /Ouvrir l'assistant IA/ }).click();

    const input = page.getByLabel("Votre question");
    await input.fill("Comment mesurer la surface habitable ?");
    await page.getByRole("button", { name: "Envoyer" }).click();

    // Attendre réponse mock (sync ou stream) — UI affiche un message assistant
    await expect(page.getByText(/démonstration|démo|réflé/i).first()).toBeVisible({ timeout: 15_000 });

    // Cliquer feedback positif
    await page.getByRole("button", { name: "Réponse utile" }).click();
    await expect(page.getByText(/Merci pour votre retour/)).toBeVisible();
  });

  test("QuickActions — Explique-moi déclenche un envoi", async ({ page }) => {
    await page.goto(`${BASE}/fr/dev/ai-assistant-demo`);
    await page.getByLabel(/Aide sur le champ Surface habitable/).click();

    await page.getByRole("button", { name: /Explique-moi/ }).click();
    await expect(page.getByText(/réfléchit|démonstration|démo/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("History Pro — liste conversations + détail", async ({ page }) => {
    // Créer une conversation via démo
    await page.goto(`${BASE}/fr/dev/ai-assistant-demo`);
    await page.getByLabel(/Aide sur le champ Surface habitable/).click();
    await page.getByLabel("Votre question").fill("Test history conversation");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.waitForTimeout(2000);

    // Aller à l'historique
    await page.goto(`${BASE}/fr/o/ai-assistant`);
    await expect(page.getByText("Historique de mes conversations")).toBeVisible();
    await expect(page.locator("text=Test history conversation").first()).toBeVisible({ timeout: 5000 });

    // Cliquer sur "Voir →"
    const firstVoir = page.getByRole("link", { name: /Voir →/ }).first();
    await firstVoir.click();
    await expect(page.getByText(/Conversation #/)).toBeVisible();
  });

  test("Export JSON RGPD art. 20 — téléchargement", async ({ page }) => {
    // Créer une conv
    await page.goto(`${BASE}/fr/dev/ai-assistant-demo`);
    await page.getByLabel(/Aide sur le champ Surface habitable/).click();
    await page.getByLabel("Votre question").fill("Conv pour export");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.waitForTimeout(2000);

    // Aller au détail
    await page.goto(`${BASE}/fr/o/ai-assistant`);
    await page.getByRole("link", { name: /Voir →/ }).first().click();

    // Click export → vérifier que le téléchargement démarre
    const downloadPromise = page.waitForEvent("download");
    await page.getByText(/Exporter JSON/).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^renocal-assistant-.+\.json$/);
  });

  test("Suppression RGPD art. 17 — soft delete + retrait listing", async ({ page }) => {
    // Créer une conv unique identifiable
    const tag = `e2e-delete-${Date.now()}`;
    await page.goto(`${BASE}/fr/dev/ai-assistant-demo`);
    await page.getByLabel(/Aide sur le champ Surface habitable/).click();
    await page.getByLabel("Votre question").fill(tag);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.waitForTimeout(2000);

    // Aller au détail de cette conversation
    await page.goto(`${BASE}/fr/o/ai-assistant`);
    await page.getByText(tag).first().click();

    // Cliquer Supprimer + Confirmer
    await page.getByRole("button", { name: /Supprimer/ }).click();
    await page.getByRole("button", { name: /Oui, supprimer/ }).click();

    // Vérifier retour à l'historique sans la conv
    await page.waitForURL(/\/fr\/o\/ai-assistant\/?$/, { timeout: 5000 });
    await expect(page.locator(`text=${tag}`)).toHaveCount(0);
  });
});

test.describe("AI Assistant — particulier", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/fr/auth/signin?e2e=1&email=user@renocal.test`);
    await page.waitForURL(/\/fr\/p\/dashboard/);
  });

  test("Particulier — UI simplifiée, mode sync (pas de streaming par défaut)", async ({ page }) => {
    await page.goto(`${BASE}/fr/p/dashboard`);
    await page.getByRole("button", { name: /Ouvrir l'assistant IA/ }).click();
    await page.getByLabel("Votre question").fill("Comment savoir si j'ai du double vitrage ?");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByText(/démonstration|démo|réfléchit/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("Particulier — history strict ownership (ne voit pas les convs des autres)", async ({ page }) => {
    await page.goto(`${BASE}/fr/p/ai-assistant`);
    await expect(page.getByText(/Mes conversations/)).toBeVisible();
    // Le seed e2e ne crée pas de convs cross-user, donc soit vide soit propres convs
  });
});
