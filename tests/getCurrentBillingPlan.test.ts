// tests/getCurrentBillingPlan.test.ts — étape B
// Vérifie la lecture réelle du plan billing + tous les fallbacks "FREE".
//
// Mocks isolés au fichier (pas de pollution globale). On utilise `vi.hoisted`
// pour déclarer les mocks AVANT le hoisting de `vi.mock`, évitant le piège
// classique "ReferenceError: Cannot access 'mock' before initialization".

import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Mocks hoistés (compatibles avec le hoisting Vitest de vi.mock) ───────
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
    membership: {
      findFirst: (...args: unknown[]) => membershipFindFirst(...args),
    },
    subscription: {
      findUnique: (...args: unknown[]) => subscriptionFindUnique(...args),
    },
  },
}));

// import APRÈS les mocks
import { getCurrentBillingPlan } from "@/server/auth/getCurrentBillingPlan";

beforeEach(() => {
  authMock.mockReset();
  membershipFindFirst.mockReset();
  subscriptionFindUnique.mockReset();
});

// ─── Cas FAIL-CLOSED → FREE ────────────────────────────────────────────────

describe("getCurrentBillingPlan — fail-closed sur FREE", () => {
  it("retourne FREE si pas de session (auth retourne null)", async () => {
    authMock.mockResolvedValue(null);
    const plan = await getCurrentBillingPlan();
    expect(plan).toBe("FREE");
    // Aucune lecture Prisma effectuée
    expect(membershipFindFirst).not.toHaveBeenCalled();
    expect(subscriptionFindUnique).not.toHaveBeenCalled();
  });

  it("retourne FREE si session sans user.id", async () => {
    authMock.mockResolvedValue({ user: { name: "x" } });
    const plan = await getCurrentBillingPlan();
    expect(plan).toBe("FREE");
    expect(membershipFindFirst).not.toHaveBeenCalled();
  });

  it("retourne FREE si user.id null", async () => {
    authMock.mockResolvedValue({ user: { id: null } });
    expect(await getCurrentBillingPlan()).toBe("FREE");
  });

  it("retourne FREE si aucune membership pour ce user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipFindFirst.mockResolvedValue(null);
    const plan = await getCurrentBillingPlan();
    expect(plan).toBe("FREE");
    expect(subscriptionFindUnique).not.toHaveBeenCalled();
  });

  it("retourne FREE si membership sans organizationId", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "" });
    expect(await getCurrentBillingPlan()).toBe("FREE");
  });

  it("retourne FREE si aucune subscription pour l'org", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "org-1" });
    subscriptionFindUnique.mockResolvedValue(null);
    expect(await getCurrentBillingPlan()).toBe("FREE");
  });

  it("retourne FREE si subscription sans plan", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "org-1" });
    subscriptionFindUnique.mockResolvedValue({ plan: null });
    expect(await getCurrentBillingPlan()).toBe("FREE");
  });

  it("retourne FREE si plan Prisma inconnu (mapping fallback)", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "org-1" });
    // billingPlanFromPrisma retourne FREE pour tout plan non listé
    subscriptionFindUnique.mockResolvedValue({ plan: "UNKNOWN_FUTURE_PLAN" });
    expect(await getCurrentBillingPlan()).toBe("FREE");
  });
});

// ─── Cas DB error → FREE (fail-closed) ────────────────────────────────────

describe("getCurrentBillingPlan — fail-closed sur erreurs DB", () => {
  it("retourne FREE si auth throw", async () => {
    authMock.mockRejectedValue(new Error("auth backend down"));
    expect(await getCurrentBillingPlan()).toBe("FREE");
  });

  it("retourne FREE si membership.findFirst throw", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipFindFirst.mockRejectedValue(new Error("DB down"));
    expect(await getCurrentBillingPlan()).toBe("FREE");
  });

  it("retourne FREE si subscription.findUnique throw", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "org-1" });
    subscriptionFindUnique.mockRejectedValue(new Error("DB connection refused"));
    expect(await getCurrentBillingPlan()).toBe("FREE");
  });
});

// ─── Cas plan réel → BillingPlan correct ──────────────────────────────────

describe("getCurrentBillingPlan — mapping plans réels", () => {
  const ok = (plan: string) => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "org-1" });
    subscriptionFindUnique.mockResolvedValue({ plan });
  };

  it("plan TRIAL → TRIAL", async () => {
    ok("TRIAL");
    expect(await getCurrentBillingPlan()).toBe("TRIAL");
  });

  it("plan PRO → PRO", async () => {
    ok("PRO");
    expect(await getCurrentBillingPlan()).toBe("PRO");
  });

  it("plan SOLO → PRO (mapping)", async () => {
    ok("SOLO");
    expect(await getCurrentBillingPlan()).toBe("PRO");
  });

  it("plan P_MON_PROJET → PRO (mapping)", async () => {
    ok("P_MON_PROJET");
    expect(await getCurrentBillingPlan()).toBe("PRO");
  });

  it("plan TEAM → TEAM", async () => {
    ok("TEAM");
    expect(await getCurrentBillingPlan()).toBe("TEAM");
  });

  it("plan ENTERPRISE → ENTERPRISE", async () => {
    ok("ENTERPRISE");
    expect(await getCurrentBillingPlan()).toBe("ENTERPRISE");
  });

  it("plan P_DECOUVERTE → FREE", async () => {
    ok("P_DECOUVERTE");
    expect(await getCurrentBillingPlan()).toBe("FREE");
  });
});

// ─── Vérif d'ordre : on n'interroge la DB que si la session est valide ────

describe("getCurrentBillingPlan — short-circuit", () => {
  it("ne lit pas membership si pas de userId", async () => {
    authMock.mockResolvedValue({ user: null });
    await getCurrentBillingPlan();
    expect(membershipFindFirst).not.toHaveBeenCalled();
    expect(subscriptionFindUnique).not.toHaveBeenCalled();
  });

  it("ne lit pas subscription si pas de membership", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipFindFirst.mockResolvedValue(null);
    await getCurrentBillingPlan();
    expect(membershipFindFirst).toHaveBeenCalledTimes(1);
    expect(subscriptionFindUnique).not.toHaveBeenCalled();
  });
});
