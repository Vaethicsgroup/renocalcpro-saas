// e2e/pricing.spec.ts — Toggle mensuel/annuel + cartes plans.
import { test, expect } from "@playwright/test";

test.describe("Pricing", () => {
  test("toggle mensuel/annuel affiche -20% sur l'annuel", async ({ page }) => {
    await page.goto("/fr#pricing");

    // Par défaut, mensuel sélectionné
    const monthlyBtn = page.getByRole("radio", { name: /mensuel/i });
    const annualBtn  = page.getByRole("radio", { name: /annuel/i });

    await expect(monthlyBtn).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText(/−20%/)).toBeVisible();

    // Bascule à annuel
    await annualBtn.click();
    await expect(annualBtn).toHaveAttribute("aria-checked", "true");

    // Le prix d'un plan a changé (ex : Solo passe de 49 à 470)
    await expect(page.getByText(/470/).first()).toBeVisible();
  });

  test("4 plans pros visibles + 2 plans particuliers", async ({ page }) => {
    await page.goto("/fr#pricing");
    // Pros : Essai 14 j, Solo, Pro, Équipe
    for (const name of ["Essai", "Solo", /^Pro$/i, "Équipe"]) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
    // Particuliers : Découverte, Mon projet
    for (const name of ["Découverte", "Mon projet"]) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test("plan recommandé affiche un badge", async ({ page }) => {
    await page.goto("/fr#pricing");
    await expect(page.getByText(/recommandé/i).first()).toBeVisible();
  });
});
