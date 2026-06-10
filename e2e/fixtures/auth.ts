// e2e/fixtures/auth.ts — Auth fixture pour seed 3 personas (INDIVIDUAL / PRO / ADMIN)
//
// En mode E2E, on contourne le magic-link via un endpoint dédié `/api/test/seed-session`
// protégé par `E2E_TEST_TOKEN` env var (n'existe qu'en mode dev/CI).
// Le seed crée 3 users + 3 sessions et retourne les cookies de session.

import { test as base, type Page } from "@playwright/test";

export type Persona = "individual" | "pro" | "admin";

const TEST_USERS: Record<Persona, { email: string; orgSlug?: string; role?: string }> = {
  individual: { email: "e2e-individual@renocal.test" },
  pro:        { email: "e2e-pro-bureau@renocal.test", orgSlug: "cabinet-test", role: "OWNER" },
  admin:      { email: "e2e-admin@renocal.test", role: "ADMIN" },
};

interface AuthFixture {
  authenticateAs: (persona: Persona) => Promise<void>;
}

export const test = base.extend<AuthFixture>({
  authenticateAs: async ({ page }, use) => {
    async function authenticate(persona: Persona) {
      const user = TEST_USERS[persona];
      const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
      const seedToken = process.env.E2E_TEST_TOKEN;

      if (!seedToken) {
        throw new Error("E2E_TEST_TOKEN required to seed sessions");
      }

      // Appelle l'endpoint de seed (à créer en parallèle dans l'app)
      const resp = await page.request.post(`${baseUrl}/api/test/seed-session`, {
        headers: { "x-e2e-token": seedToken },
        data: { email: user.email, orgSlug: user.orgSlug, role: user.role },
      });

      if (!resp.ok()) {
        throw new Error(`Seed session failed: ${resp.status()} ${await resp.text()}`);
      }

      const { cookies } = await resp.json() as { cookies: { name: string; value: string; domain: string; path: string }[] };
      await page.context().addCookies(cookies);
    }
    await use(authenticate);
  },
});

export const VIEWPORTS = [
  { name: "mobile",  width: 360,  height: 800 },
  { name: "tablet",  width: 768,  height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  });
  if (overflow) {
    throw new Error("Horizontal overflow detected");
  }
}
