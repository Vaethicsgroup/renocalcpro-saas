// tests/pdf-route-gate.test.ts — étape D
// Vérifie le gate freemium dans /api/calc/pdf (route reste neutralisée pour la
// génération PDF physique ; on teste uniquement la décision policy).
//
// Stratégie : on n'importe PAS la route handler directement (NextRequest est
// complexe à mocker proprement). On teste les comportements observables via
// checkPdfExportAllowed + shouldWatermarkPdf qui sont l'API publique consommée
// par la route. Les tests `usage-actions.test.ts` couvrent déjà ces fonctions
// pour le mode "memory" ; ici on ajoute des assertions plus haut niveau pour
// l'enforcement "FREE → full = refusé" et "PRO → full = autorisé sans
// watermark", indispensables au comportement de la route PDF.

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mocks hoistés (compatibles vi.mock)
const { authMock, membershipFindFirst, subscriptionFindUnique } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    membershipFindFirst: vi.fn(),
    subscriptionFindUnique: vi.fn(),
  }),
);

vi.mock("@/lib/auth/config", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/db/client", () => ({
  prisma: {
    membership: { findFirst: (...a: unknown[]) => membershipFindFirst(...a) },
    subscription: { findUnique: (...a: unknown[]) => subscriptionFindUnique(...a) },
  },
}));

// Imports APRÈS les mocks
import { getCurrentBillingPlan } from "@/server/auth/getCurrentBillingPlan";
import {
  __resetUsageMem,
  type AccountIdentity,
  type RequestContext,
  checkPdfExportAllowed,
} from "@/server/actions/usage";
import { shouldWatermarkPdf } from "@/lib/billing/usage-policy";

const ctx: RequestContext = {
  rawDeviceId: "dev-test",
  rawIp: "203.0.113.42",
  userAgent: "Mozilla/5.0 Chrome/120.0.0",
};

beforeEach(() => {
  authMock.mockReset();
  membershipFindFirst.mockReset();
  subscriptionFindUnique.mockReset();
  __resetUsageMem();
});

// ─── getCurrentBillingPlan → FREE / PRO mapping ──────────────────────────

describe("PDF route gate — getCurrentBillingPlan flux", () => {
  it("retourne FREE si pas de session (anonymous)", async () => {
    authMock.mockResolvedValue(null);
    const plan = await getCurrentBillingPlan();
    expect(plan).toBe("FREE");
  });

  it("retourne PRO si subscription.plan = PRO", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "o-1" });
    subscriptionFindUnique.mockResolvedValue({ plan: "PRO" });
    expect(await getCurrentBillingPlan()).toBe("PRO");
  });
});

// ─── Enforcement watermark serveur ────────────────────────────────────────

describe("PDF route gate — watermark imposé serveur", () => {
  it("FREE → shouldWatermarkPdf = true (non négociable)", () => {
    expect(shouldWatermarkPdf("FREE")).toBe(true);
  });

  it("TRIAL/PRO/TEAM/ENTERPRISE → shouldWatermarkPdf = false", () => {
    expect(shouldWatermarkPdf("TRIAL")).toBe(false);
    expect(shouldWatermarkPdf("PRO")).toBe(false);
    expect(shouldWatermarkPdf("TEAM")).toBe(false);
    expect(shouldWatermarkPdf("ENTERPRISE")).toBe(false);
  });
});

// ─── checkPdfExportAllowed comportement ───────────────────────────────────

describe("PDF route gate — checkPdfExportAllowed", () => {
  const acc = (
    overrides: Partial<AccountIdentity> = {},
  ): AccountIdentity => ({
    accountId: "anonymous",
    plan: "FREE",
    emailVerified: true,
    ...overrides,
  });

  it("FREE demandant 'full' → refusé free_pdf_full_blocked", async () => {
    const d = await checkPdfExportAllowed(acc(), "full", ctx);
    expect(d.allowed).toBe(false);
    if (!d.allowed) {
      expect(d.reason).toBe("free_pdf_full_blocked");
    }
  });

  it("FREE demandant 'watermarked_preview' → autorisé, watermark=true", async () => {
    const d = await checkPdfExportAllowed(acc(), "watermarked_preview", ctx);
    expect(d.allowed).toBe(true);
    if (d.allowed) {
      expect(d.payload.effectiveMode).toBe("watermarked_preview");
      expect(d.payload.watermark).toBe(true);
    }
  });

  it("PRO demandant 'full' → autorisé, watermark=false", async () => {
    const d = await checkPdfExportAllowed(acc({ plan: "PRO" }), "full", ctx);
    expect(d.allowed).toBe(true);
    if (d.allowed) {
      expect(d.payload.effectiveMode).toBe("full");
      expect(d.payload.watermark).toBe(false);
    }
  });

  it("PRO demandant 'watermarked_preview' → autorisé en preview (pas d'élévation)", async () => {
    const d = await checkPdfExportAllowed(
      acc({ plan: "PRO" }),
      "watermarked_preview",
      ctx,
    );
    expect(d.allowed).toBe(true);
    if (d.allowed) {
      expect(d.payload.effectiveMode).toBe("watermarked_preview");
      expect(d.payload.watermark).toBe(false);
    }
  });

  it("FREE ne peut pas bypass via 'full' → reste refusé", async () => {
    // Vérifie l'hostilité au bypass client : même si le client passe "full"
    // explicitement, FREE est refusé. Le serveur a le dernier mot.
    const d1 = await checkPdfExportAllowed(acc(), "full", ctx);
    const d2 = await checkPdfExportAllowed(acc(), "full", ctx);
    expect(d1.allowed).toBe(false);
    expect(d2.allowed).toBe(false);
  });
});
