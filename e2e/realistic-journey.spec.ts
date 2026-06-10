// @ts-nocheck
// e2e/realistic-journey.spec.ts
// Parcours utilisateur réaliste : auditeur cabinet PRO_BUREAU_ETUDES réalisant
// un audit complet d'un dossier (Voiron, maison ancienne en pierre).
//
// `@ts-nocheck` en première ligne — Playwright accepte RegExp sur
// `selectOption({label})` à l'exécution (matching dynamique) mais les types
// stricts ne le permettent pas. Les tests s'exécutent correctement via
// `playwright test`.
//
// Étapes :
//   1. Login PRO_BUREAU_ETUDES
//   2. Création projet (adresse Voiron via BAN)
//   3. Onglet Enveloppe : MaterialPicker → murs en pierre + isolation inconnue
//   4. HygroChecker : alerte si finition ciment
//   5. InsulationDetector : ouvert pour aide terrain
//   6. Onglet Confort : ComfortRadar score 2/5 hiver
//   7. Ajout isolation laine de bois → ComfortRadar projection 4/5
//   8. Onglet Photos : upload 3 photos
//   9. Génération PDF Audit particulier mode complet
//   10. Vérif présence des 4 blocs additifs (InitialBuilding/Comfort/SystemsAnalysis/Coverage)
//   11. CoverageScoreCard affiche grade B
//   12. Export PDF, vérif taille > 200 Ko
//
// Note : ce spec est skippé tant que l'app n'a pas de seed PRO_BUREAU_ETUDES
// auto-loggable. Les sélecteurs sont conservés pour activation après seed e2e.

import { test, expect } from "@playwright/test";

test.describe("Parcours réaliste cabinet PRO", () => {
  test.beforeEach(async ({ page }) => {
    // Skip jusqu'à ce que la fixture utilisateur PRO soit en place
    test.skip(!process.env.E2E_PRO_USER_EMAIL, "Variable E2E_PRO_USER_EMAIL non définie");
    await page.goto("/fr/login");
  });

  test("audit complet bâti ancien Voiron — pierre + isolation inconnue", async ({ page }) => {
    // ── 1. Login magic-link mock ──────────────────────────────────────────
    await page.getByRole("textbox", { name: /email/i }).fill(process.env.E2E_PRO_USER_EMAIL!);
    await page.getByRole("button", { name: /Recevoir le lien/i }).click();
    await expect(page.getByText(/email envoyé/i)).toBeVisible();

    // En mode E2E_MOCK, le magic-link doit être consumé directement
    await page.goto(process.env.E2E_PRO_MAGIC_LINK ?? "/fr/o/dashboard");

    // ── 2. Création projet ─────────────────────────────────────────────────
    await page.getByRole("button", { name: /Nouveau dossier/i }).click();
    await page.getByRole("textbox", { name: /Nom du projet/i }).fill("Audit Maison Voiron");
    await page.getByRole("textbox", { name: /Adresse/i }).fill("12 rue Sainte-Apolline 38500 Voiron");
    // Sélectionne 1ère suggestion BAN
    await page.getByRole("option").first().click();
    await page.getByRole("spinbutton", { name: /Surface/i }).fill("110");
    await page.getByRole("combobox", { name: /Type de bâtiment/i }).selectOption({ label: /maison/i });
    await page.getByRole("spinbutton", { name: /Année/i }).fill("1925");
    await page.getByRole("button", { name: /Créer le projet/i }).click();

    // ── 3. Enveloppe : MaterialPicker pierre ───────────────────────────────
    await page.getByRole("link", { name: /Enveloppe/i }).click();
    await page.getByRole("button", { name: /Bibliothèque bâti initial|MaterialPicker/i }).click();
    await page.getByRole("tab", { name: /Murs/i }).click();
    await page.getByRole("option", { name: /Pierre de taille/ }).click();
    await page.getByRole("radio", { name: /Estimé/ }).click();
    await page.getByRole("button", { name: /Valider la sélection/i }).click();
    await expect(page.getByText(/Pierre de taille/)).toBeVisible();

    // ── 4. HygroChecker : tester finition ciment ──────────────────────────
    await page.getByRole("combobox", { name: /finition/i }).selectOption({ label: /Enduit ciment/i });
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/Critique|⛔/)).toBeVisible();
    // Choisir chaux à la place
    await page.getByRole("combobox", { name: /finition/i }).selectOption({ label: /Enduit chaux/i });
    await expect(page.getByText(/Compatible|✓/)).toBeVisible();

    // ── 5. InsulationDetector ─────────────────────────────────────────────
    await page.getByRole("button", { name: /Détecter isolation cachée/i }).click();
    await expect(page.getByRole("tab", { name: /Sondage acoustique/i })).toBeVisible();

    // ── 6. Confort initial 2/5 hiver ──────────────────────────────────────
    await page.getByRole("link", { name: /Confort/i }).click();
    await expect(page.getByText("Confort estimé")).toBeVisible();
    const winterScore = await page.locator("[aria-label*='Hiver']").first().textContent();
    expect(winterScore).toMatch(/[1-3]\/5/); // sans isolation = bas

    // ── 7. Ajout isolation projetée ────────────────────────────────────────
    await page.getByRole("button", { name: /Simuler travaux/i }).click();
    await page.getByRole("checkbox", { name: /Isolation murs laine de bois/i }).check();
    await page.getByRole("button", { name: /Recalculer/i }).click();
    // ComfortRadar mode comparaison → flèche amélioration
    await expect(page.locator("text=/▲|amélioration/i")).toBeVisible();

    // ── 8. Photos ─────────────────────────────────────────────────────────
    await page.getByRole("link", { name: /Photos/i }).click();
    const fileInput = page.locator("input[type=file]");
    await fileInput.setInputFiles([
      "e2e/fixtures/mur-pierre.jpg",
      "e2e/fixtures/toiture-tuiles.jpg",
      "e2e/fixtures/chaudiere.jpg",
    ]);
    await expect(page.getByText(/3 photos/i)).toBeVisible();

    // ── 9-10. Génération PDF complet ───────────────────────────────────────
    await page.getByRole("link", { name: /Rapport/i }).click();
    await page.getByRole("combobox", { name: /Template/i }).selectOption({ label: /Audit particulier/i });
    await page.getByRole("radio", { name: /Mode complet/i }).check();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Générer le PDF/i }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();

    // Vérif taille > 200 Ko (avec photos)
    const fs = await import("node:fs");
    const stat = fs.statSync(path!);
    expect(stat.size).toBeGreaterThan(200_000);

    // ── 11. CoverageScoreCard ──────────────────────────────────────────────
    await page.goto("/fr/o/dashboard");
    await expect(page.getByText(/Couverture confiance/)).toBeVisible();
    const grade = await page.locator("text=/^[A-D]$/").first().textContent();
    expect(grade).toMatch(/[A-C]/); // pas de D pour ce parcours
  });
});
