// tests/getCurrentActiveProjectsCount.test.ts — étape F
// Vérifie le helper serveur qui retourne le nombre de projets actifs (non
// ARCHIVED) du compte courant. Posture FAIL-SOFT côté affichage.
//
// Mocks via vi.hoisted pour rester sûr du hoisting.

import { describe, it, expect, beforeEach, vi } from "vitest";

const { authMock, membershipFindFirst, projectCount } = vi.hoisted(() => ({
  authMock: vi.fn(),
  membershipFindFirst: vi.fn(),
  projectCount: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/db/client", () => ({
  prisma: {
    membership: {
      findFirst: (...args: unknown[]) => membershipFindFirst(...args),
    },
    project: {
      count: (...args: unknown[]) => projectCount(...args),
    },
  },
}));

import { getCurrentActiveProjectsCount } from "@/server/auth/getCurrentActiveProjectsCount";

beforeEach(() => {
  authMock.mockReset();
  membershipFindFirst.mockReset();
  projectCount.mockReset();
});

describe("getCurrentActiveProjectsCount — chemins nominaux", () => {
  it("anonyme (pas de session) → 0", async () => {
    authMock.mockResolvedValue(null);
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });

  it("connecté sans userId → 0", async () => {
    authMock.mockResolvedValue({ user: null });
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });

  it("connecté sans membership → 0", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockResolvedValue(null);
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });

  it("membership sans organizationId → 0", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: null });
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });

  it("compte avec 3 projets actifs → 3", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "o-1" });
    projectCount.mockResolvedValue(3);
    expect(await getCurrentActiveProjectsCount()).toBe(3);
  });

  it("appelle Prisma avec where NOT ARCHIVED", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "o-1" });
    projectCount.mockResolvedValue(5);
    await getCurrentActiveProjectsCount();
    expect(projectCount).toHaveBeenCalledTimes(1);
    const callArg = projectCount.mock.calls[0][0] as {
      where: { organizationId: string; NOT: { status: string } };
    };
    expect(callArg.where.organizationId).toBe("o-1");
    expect(callArg.where.NOT).toEqual({ status: "ARCHIVED" });
  });
});

describe("getCurrentActiveProjectsCount — fail-soft", () => {
  it("auth() throw → 0", async () => {
    authMock.mockRejectedValue(new Error("auth broken"));
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });

  it("prisma.membership throw → 0", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockRejectedValue(new Error("DB down"));
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });

  it("prisma.project.count throw → 0", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "o-1" });
    projectCount.mockRejectedValue(new Error("DB down"));
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });

  it("count retourne undefined (mock rudimentaire) → 0", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "o-1" });
    projectCount.mockResolvedValue(undefined);
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });

  it("count négatif (mock buggué) → 0", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "o-1" });
    projectCount.mockResolvedValue(-5);
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });

  it("count NaN → 0", async () => {
    authMock.mockResolvedValue({ user: { id: "u-1" } });
    membershipFindFirst.mockResolvedValue({ organizationId: "o-1" });
    projectCount.mockResolvedValue(Number.NaN);
    expect(await getCurrentActiveProjectsCount()).toBe(0);
  });
});
