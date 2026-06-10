// e2e/a11y.spec.ts — Audit axe-core AA sur les pages publiques.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  { url: "/fr",         name: "landing fr" },
  { url: "/en",         name: "landing en" },
  { url: "/fr/signup",  name: "signup" },
  { url: "/fr/login",   name: "login" },
  { url: "/fr/status",  name: "status" },
];

test.describe("@a11y SaaS — axe-core AA sur pages publiques", () => {
  for (const p of PAGES) {
    test(`${p.name} : aucune violation serious/critical`, async ({ page }) => {
      await page.goto(p.url);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude("iframe")
        .exclude("canvas")
        .analyze();

      const blocking = results.violations.filter(v => v.impact === "serious" || v.impact === "critical");

      if (blocking.length > 0) {
        console.log(`\n=== a11y violations ${p.name} ===`);
        for (const v of blocking) {
          console.log(`[${v.impact}] ${v.id} — ${v.help}`);
          for (const node of v.nodes.slice(0, 3)) console.log(`  → ${node.target.join(" ")}`);
        }
      }
      expect(blocking, `${blocking.length} violation(s) bloquante(s)`).toEqual([]);
    });
  }

  test("contraste color-contrast sur landing", async ({ page }) => {
    await page.goto("/fr");
    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();
    const blocking = results.violations.filter(v => v.impact === "serious" || v.impact === "critical");
    expect(blocking).toEqual([]);
  });
});
