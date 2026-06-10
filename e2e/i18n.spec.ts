// e2e/i18n.spec.ts — Vérifie les 5 locales.
import { test, expect } from "@playwright/test";

const LOCALES = [
  { code: "fr", check: /particulier/i,    title: /Réno/ },
  { code: "en", check: /homeowner/i,      title: /Réno/ },
  { code: "es", check: /particular/i,     title: /Réno/ },
  { code: "de", check: /privatperson/i,   title: /Réno/ },
  { code: "pt", check: /particular/i,     title: /Réno/ },
];

test.describe("i18n — toutes les locales chargent", () => {
  for (const l of LOCALES) {
    test(`/${l.code} affiche du contenu localisé`, async ({ page }) => {
      const res = await page.goto(`/${l.code}`);
      expect(res?.ok()).toBe(true);
      await expect(page).toHaveTitle(l.title);
      await expect(page.getByText(l.check).first()).toBeVisible();
    });
  }
});

test.describe("LangSwitcher — bascule effective", () => {
  test("FR → EN change l'URL et la copy", async ({ page }) => {
    await page.goto("/fr");
    await page.getByLabel(/langue/i).selectOption("en");
    await expect(page).toHaveURL(/\/en/);
    await expect(page.getByText(/homeowner/i).first()).toBeVisible();
  });

  test("EN → ES → DE → PT chaîne sans erreur", async ({ page }) => {
    await page.goto("/en");
    for (const code of ["es", "de", "pt"]) {
      await page.getByLabel(/langue|language|idioma|sprache/i).selectOption(code);
      await page.waitForURL(new RegExp(`/${code}`));
    }
  });
});
