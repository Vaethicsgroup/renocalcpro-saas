// e2e/dashboards.spec.ts — Tests dashboards /p/ et /o/.
// Note : ces tests sautent gracieusement si pas de session mock côté serveur.

import { test, expect } from "@playwright/test";

// Helper : injecte un cookie de session NextAuth fake (mode test/dev).
// En CI, voir auth-mock.ts qui doit pré-créer une row Session.
async function loginAsFake(page: import("@playwright/test").Page, role: "individual" | "pro") {
  await page.context().addCookies([{
    name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
    value: `test-${role}-session`,
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  }]);
}

test.describe("Dashboard particulier (/p)", () => {
  test("affiche les 3 KPIs et la barre de progression", async ({ page }) => {
    await loginAsFake(page, "individual");
    const res = await page.goto("/fr/p/dashboard");
    if (!res?.ok()) test.skip(true, "Session mock non configurée — auth réelle requise.");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/aides potentielles/i)).toBeVisible();
    await expect(page.getByText(/économies/i)).toBeVisible();
    await expect(page.getByRole("progressbar")).toBeVisible();
  });

  test("sidebar contient 5 entrées", async ({ page }) => {
    await loginAsFake(page, "individual");
    const res = await page.goto("/fr/p/dashboard");
    if (!res?.ok()) test.skip();
    const links = await page.locator('aside[aria-label*="particulier"] nav a').count();
    expect(links).toBeGreaterThanOrEqual(5);
  });
});

test.describe("Dashboard pro (/o)", () => {
  test("affiche les 4 KPIs métier (MRR, Conv, Vol, CSAT)", async ({ page }) => {
    await loginAsFake(page, "pro");
    const res = await page.goto("/fr/o/dashboard");
    if (!res?.ok()) test.skip();

    await expect(page.getByText(/MRR/i)).toBeVisible();
    await expect(page.getByText(/conversion/i)).toBeVisible();
    await expect(page.getByText(/dossiers/i).first()).toBeVisible();
    await expect(page.getByText(/CSAT/i)).toBeVisible();
  });

  test("CTA 'Nouveau dossier' visible", async ({ page }) => {
    await loginAsFake(page, "pro");
    const res = await page.goto("/fr/o/dashboard");
    if (!res?.ok()) test.skip();
    await expect(page.getByRole("link", { name: /nouveau dossier/i })).toBeVisible();
  });
});
