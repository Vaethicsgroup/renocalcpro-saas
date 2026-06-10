// tests/usage-actions-prisma.test.ts — étape C
// Vérifie la persistance Prisma de UsageEvent (mode "prisma") avec fallback
// honnête vers mémoire si la table est absente / Prisma throw.
//
// Mocks isolés au fichier via vi.hoisted (compatibles hoisting de vi.mock).
// On simule `prisma.usageEvent` avec un stub configurable par test.

import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Stub Prisma usageEvent (hoisté) ───────────────────────────────────────
const { usageEventCreate, usageEventFindMany } = vi.hoisted(() => ({
  usageEventCreate: vi.fn(),
  usageEventFindMany: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  prisma: {
    usageEvent: {
      create: (...args: unknown[]) => usageEventCreate(...args),
      findMany: (...args: unknown[]) => usageEventFindMany(...args),
    },
  },
}));

// import APRÈS les mocks
import {
  __dumpUsageMem,
  __getStorageMode,
  __resetUsageMem,
  __setStorageMode,
  type AccountIdentity,
  type RequestContext,
  checkProjectCreationAllowed,
  getCurrentUsage,
  recordUsageEvent,
} from "@/server/actions/usage";

const acc = (overrides: Partial<AccountIdentity> = {}): AccountIdentity => ({
  accountId: "acc-1",
  plan: "FREE",
  emailVerified: true,
  ...overrides,
});

const ctx = (): RequestContext => ({
  rawDeviceId: "dev-1",
  rawIp: "203.0.113.1",
  userAgent: "Mozilla/5.0 Chrome/120.0.0",
});

beforeEach(() => {
  __resetUsageMem();
  usageEventCreate.mockReset();
  usageEventFindMany.mockReset();
  __setStorageMode("memory"); // par défaut, reset au mode initial
});

// ─── recordUsageEvent — mode "prisma" ──────────────────────────────────────

describe("recordUsageEvent — mode prisma", () => {
  it("écrit via prisma.usageEvent.create et retourne l'id Prisma", async () => {
    __setStorageMode("prisma");
    usageEventCreate.mockResolvedValue({
      id: "prisma-id-001",
      createdAt: new Date("2026-06-04T10:00:00Z"),
    });

    const { record, storage } = await recordUsageEvent({
      account: acc(),
      kind: "PROJECT_CREATED",
      context: ctx(),
    });

    expect(storage).toBe("prisma");
    expect(record.id).toBe("prisma-id-001");
    expect(usageEventCreate).toHaveBeenCalledTimes(1);
    const callArg = usageEventCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(callArg.data.accountId).toBe("acc-1");
    expect(callArg.data.kind).toBe("PROJECT_CREATED");
    expect(callArg.data.deviceHash).toMatch(/^(s|w)\$/);
    expect(callArg.data.ipHash).toMatch(/^(s|w)\$/);
    expect(callArg.data.compositeHash).toMatch(/^(s|w)\$/);
  });

  it("fallback memory si prisma.create throw (DB down)", async () => {
    __setStorageMode("prisma");
    usageEventCreate.mockRejectedValue(new Error("DB connection refused"));

    const { record, storage } = await recordUsageEvent({
      account: acc(),
      kind: "PROJECT_CREATED",
      context: ctx(),
    });

    // Le storage retourné reflète le mode TENTÉ, pas le mode effectif.
    expect(storage).toBe("prisma");
    // Le record a un id local (nowId) puisque Prisma a throw
    expect(record.id).toMatch(/^ue_/);
    // Le record a été poussé en mémoire en fallback
    expect(__dumpUsageMem().get("acc-1")?.length).toBe(1);
  });

  it("fallback memory si prisma.create retourne objet vide (mock proxy)", async () => {
    __setStorageMode("prisma");
    usageEventCreate.mockResolvedValue({});

    const { storage } = await recordUsageEvent({
      account: acc(),
      kind: "PROJECT_CREATED",
      context: ctx(),
    });

    expect(storage).toBe("prisma");
    expect(__dumpUsageMem().get("acc-1")?.length).toBe(1);
  });
});

// ─── getCurrentUsage — mode "prisma" ───────────────────────────────────────

describe("getCurrentUsage — mode prisma", () => {
  it("lit via prisma.usageEvent.findMany et calcule les compteurs", async () => {
    __setStorageMode("prisma");
    const now = new Date();
    usageEventFindMany.mockResolvedValue([
      {
        id: "p1",
        accountId: "acc-1",
        kind: "PROJECT_CREATED",
        deviceHash: "s$abc",
        ipHash: "s$def",
        compositeHash: "s$ghi",
        uaNormalized: "chrome 120",
        createdAt: now,
        metadata: null,
      },
      {
        id: "p2",
        accountId: "acc-1",
        kind: "PDF_PREVIEW_EXPORTED",
        deviceHash: "s$abc",
        ipHash: "s$def",
        compositeHash: "s$ghi",
        uaNormalized: "chrome 120",
        createdAt: now,
        metadata: null,
      },
    ]);

    const usage = await getCurrentUsage(acc());
    expect(usage.activeProjectsCount).toBe(1);
    expect(usage.pdfExportsThisMonth).toBe(1);
    expect(usage.emailVerified).toBe(true);
    expect(usageEventFindMany).toHaveBeenCalledTimes(2); // readEvents + isSuspicious
  });

  it("fallback memory si prisma.findMany throw", async () => {
    __setStorageMode("prisma");
    usageEventFindMany.mockRejectedValue(new Error("DB down"));

    // On a 1 event mémoire qu'on garantit lu en fallback
    __setStorageMode("memory");
    await recordUsageEvent({
      account: acc(),
      kind: "PROJECT_CREATED",
      context: ctx(),
    });
    __setStorageMode("prisma"); // re-bascule pour le test
    usageEventFindMany.mockRejectedValue(new Error("DB down"));

    const usage = await getCurrentUsage(acc());
    // Le fallback memory devrait voir l'event qu'on a écrit
    expect(usage.activeProjectsCount).toBe(1);
  });

  it("respecte activeProjectsCountOverride même en mode prisma", async () => {
    __setStorageMode("prisma");
    usageEventFindMany.mockResolvedValue([]);
    const usage = await getCurrentUsage(acc(), 42);
    expect(usage.activeProjectsCount).toBe(42);
  });
});

// ─── checkProjectCreationAllowed — flux complet mode prisma ────────────────

describe("checkProjectCreationAllowed — mode prisma intégré", () => {
  it("FREE avec 1 projet déjà créé (vu en DB) → refusé", async () => {
    __setStorageMode("prisma");
    usageEventFindMany.mockResolvedValue([
      {
        id: "p1",
        accountId: "acc-1",
        kind: "PROJECT_CREATED",
        deviceHash: "s$abc",
        ipHash: "s$def",
        compositeHash: "s$ghi",
        uaNormalized: "chrome 120",
        createdAt: new Date(),
        metadata: null,
      },
    ]);

    const d = await checkProjectCreationAllowed(acc(), ctx());
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("free_project_limit");
  });

  it("FREE sans projet en DB → autorisé", async () => {
    __setStorageMode("prisma");
    usageEventFindMany.mockResolvedValue([]);

    const d = await checkProjectCreationAllowed(acc(), ctx());
    expect(d.allowed).toBe(true);
  });
});

// ─── __getStorageMode introspection ────────────────────────────────────────

describe("storage mode introspection", () => {
  it("mode initial = memory", () => {
    expect(__getStorageMode()).toBe("memory");
  });

  it("bascule prisma puis retour memory", () => {
    __setStorageMode("prisma");
    expect(__getStorageMode()).toBe("prisma");
    __setStorageMode("memory");
    expect(__getStorageMode()).toBe("memory");
  });

  it("bascule noop", async () => {
    __setStorageMode("noop");
    expect(__getStorageMode()).toBe("noop");
    // Pas de write mémoire en mode noop
    await recordUsageEvent({
      account: acc(),
      kind: "PROJECT_CREATED",
      context: ctx(),
    });
    expect(__dumpUsageMem().get("acc-1")).toBeUndefined();
  });
});
