// e2e/landing.spec.ts — Visite des 12 sections sur 360 + 1440 + a11y skip-link.
import { test, expect } from "@playwright/test";

test.describe("Landing — page d'accueil publique", () => {
  test("page se charge et affiche les 12 sections clés", async ({ page }) => {
    await page.goto("/fr");
    await expect(page).toHaveTitle(/Réno·Calc Pro/i);

    // Hero
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/particulier/i).first()).toBeVisible();
    await expect(page.getByText(/professionnel/i).first()).toBeVisible();

    // SegmentSplit, TrustBar, FeatureCarousel, PdfShowcase, BenefitGrid
    await expect(page.getByText(/dpe 2021/i).first()).toBeVisible();
    await expect(page.getByText(/calculateur/i).first()).toBeVisible();
    await expect(page.getByText(/audit particulier/i).first()).toBeVisible();

    // ComparisonTable
    await expect(page.getByText(/excel/i).first()).toBeVisible();

    // HowItWorks (4 étapes numérotées)
    await expect(page.locator("ol li").first()).toBeVisible();

    // PricingTable + FAQ + CTA + Footer
    await expect(page.getByText(/découverte/i).first()).toBeVisible();
    await expect(page.getByText(/questions fréquentes/i).first()).toBeVisible();
    await expect(page.getByText(/contact@renocalcpro\.fr/i)).toBeVisible();
  });

  test("skip-link est focusable au premier Tab", async ({ page }) => {
    await page.goto("/fr");
    await page.keyboard.press("Tab");
    const focusedText = await page.evaluate(() =>
      document.activeElement?.textContent?.trim() ?? "",
    );
    expect(focusedText.toLowerCase()).toMatch(/aller au contenu|skip/);
  });

  test("CTA hero pointent vers /signup avec query type=", async ({ page }) => {
    await page.goto("/fr");
    const indCta = page.getByRole("link", { name: /particulier/i }).first();
    await expect(indCta).toHaveAttribute("href", /\/signup\?type=individual/);
    const proCta = page.getByRole("link", { name: /professionnel/i }).first();
    await expect(proCta).toHaveAttribute("href", /\/signup\?type=pro/);
  });
});
