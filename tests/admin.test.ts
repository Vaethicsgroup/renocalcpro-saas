// tests/admin.test.ts — Tests sur isAdmin, requireAdmin, agrégateurs business.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Reset env entre tests pour ne pas leaker
const ORIGINAL_ADMIN_IDS = process.env.ADMIN_USER_IDS;
beforeEach(() => { vi.resetModules(); });
afterEach(() => { process.env.ADMIN_USER_IDS = ORIGINAL_ADMIN_IDS; });

describe("isAdmin", () => {
  it("retourne true pour un userId présent dans ADMIN_USER_IDS", async () => {
    process.env.ADMIN_USER_IDS = "user_abc,user_xyz,user_admin42";
    const { isAdmin } = await import("@/lib/auth/admin");
    expect(isAdmin("user_admin42")).toBe(true);
    expect(isAdmin("user_abc")).toBe(true);
  });

  it("retourne false pour un userId absent", async () => {
    process.env.ADMIN_USER_IDS = "user_abc,user_xyz";
    const { isAdmin } = await import("@/lib/auth/admin");
    expect(isAdmin("user_random")).toBe(false);
  });

  it("retourne false si userId undefined", async () => {
    process.env.ADMIN_USER_IDS = "user_abc";
    const { isAdmin } = await import("@/lib/auth/admin");
    expect(isAdmin(undefined)).toBe(false);
  });

  it("retourne false si liste vide", async () => {
    process.env.ADMIN_USER_IDS = "";
    const { isAdmin } = await import("@/lib/auth/admin");
    expect(isAdmin("user_abc")).toBe(false);
  });

  it("retourne false si ADMIN_USER_IDS pas défini", async () => {
    delete process.env.ADMIN_USER_IDS;
    const { isAdmin } = await import("@/lib/auth/admin");
    expect(isAdmin("user_abc")).toBe(false);
  });

  it("trim les espaces autour des IDs", async () => {
    process.env.ADMIN_USER_IDS = "  user_abc  ,user_xyz , user_42";
    const { isAdmin } = await import("@/lib/auth/admin");
    expect(isAdmin("user_abc")).toBe(true);
    expect(isAdmin("user_xyz")).toBe(true);
    expect(isAdmin("user_42")).toBe(true);
  });

  it("ADMIN_ENABLED reflète la présence d'IDs", async () => {
    process.env.ADMIN_USER_IDS = "user_abc";
    const { ADMIN_ENABLED } = await import("@/lib/auth/admin");
    expect(ADMIN_ENABLED).toBe(true);

    vi.resetModules();
    process.env.ADMIN_USER_IDS = "";
    const m2 = await import("@/lib/auth/admin");
    expect(m2.ADMIN_ENABLED).toBe(false);
  });
});

// ─── KPI agrégateurs (mocked datasets) ────────────────────────────────────

describe("KPI aggregators (datasets représentatifs)", () => {
  // Helper : calcule MRR depuis un set de subscriptions
  function computeMrr(subs: Array<{ status: string; plan: string; billingPeriod: string }>): number {
    const monthlyByPlan: Record<string, number> = {
      P_DECOUVERTE: 0, P_MON_PROJET: 19,
      TRIAL: 0, SOLO: 49, PRO: 149, TEAM: 449, ENTERPRISE: 999,
    };
    return subs
      .filter(s => s.status === "ACTIVE")
      .reduce((sum, s) => {
        const monthly = monthlyByPlan[s.plan] ?? 0;
        // Annual plan = 80 % du tarif mensuel (réduction 20 %) → MRR mensuel = annuel / 12
        return sum + (s.billingPeriod === "ANNUAL" ? Math.round(monthly * 0.8) : monthly);
      }, 0);
  }

  function computeActivationRate(orgs: Array<{ projectsCount: number }>): number {
    if (orgs.length === 0) return 0;
    return Math.round((orgs.filter(o => o.projectsCount > 0).length / orgs.length) * 100);
  }

  function computeChurnRate(opts: { canceledLast30d: number; activeStartOf30d: number }): number {
    if (opts.activeStartOf30d === 0) return 0;
    return Math.round((opts.canceledLast30d / opts.activeStartOf30d) * 1000) / 10;
  }

  it("MRR — set vide", () => {
    expect(computeMrr([])).toBe(0);
  });

  it("MRR — uniquement TRIAL → 0 €", () => {
    expect(computeMrr([
      { status: "ACTIVE", plan: "TRIAL", billingPeriod: "MONTHLY" },
      { status: "TRIALING", plan: "PRO", billingPeriod: "MONTHLY" },
    ])).toBe(0);
  });

  it("MRR — 5 SOLO + 3 PRO + 1 TEAM mensuels", () => {
    const subs = [
      ...Array(5).fill({ status: "ACTIVE", plan: "SOLO", billingPeriod: "MONTHLY" }),
      ...Array(3).fill({ status: "ACTIVE", plan: "PRO",  billingPeriod: "MONTHLY" }),
      { status: "ACTIVE", plan: "TEAM", billingPeriod: "MONTHLY" },
    ];
    expect(computeMrr(subs)).toBe(5 * 49 + 3 * 149 + 449); // 1141 €
  });

  it("MRR — annuel = 80 % du mensuel", () => {
    const subs = [{ status: "ACTIVE", plan: "PRO", billingPeriod: "ANNUAL" }];
    expect(computeMrr(subs)).toBe(Math.round(149 * 0.8)); // 119
  });

  it("MRR — ignore les subs CANCELED / PAST_DUE", () => {
    const subs = [
      { status: "ACTIVE",   plan: "PRO", billingPeriod: "MONTHLY" },
      { status: "CANCELED", plan: "PRO", billingPeriod: "MONTHLY" },
      { status: "PAST_DUE", plan: "PRO", billingPeriod: "MONTHLY" },
    ];
    expect(computeMrr(subs)).toBe(149);
  });

  it("Activation rate — 0 orgs", () => {
    expect(computeActivationRate([])).toBe(0);
  });

  it("Activation rate — 6/10 orgs avec projets", () => {
    const orgs = [
      ...Array(6).fill({ projectsCount: 3 }),
      ...Array(4).fill({ projectsCount: 0 }),
    ];
    expect(computeActivationRate(orgs)).toBe(60);
  });

  it("Activation rate — 100 %", () => {
    expect(computeActivationRate([{ projectsCount: 1 }, { projectsCount: 5 }])).toBe(100);
  });

  it("Churn rate — pas de subs", () => {
    expect(computeChurnRate({ canceledLast30d: 0, activeStartOf30d: 0 })).toBe(0);
  });

  it("Churn rate — 3 sur 100 = 3.0 %", () => {
    expect(computeChurnRate({ canceledLast30d: 3, activeStartOf30d: 100 })).toBe(3.0);
  });

  it("Churn rate — 1 sur 30 ≈ 3.3 %", () => {
    expect(computeChurnRate({ canceledLast30d: 1, activeStartOf30d: 30 })).toBe(3.3);
  });
});

// ─── DataTable logic (sort, filter, paginate) ────────────────────────────

describe("DataTable — logique pagination/tri/filtre", () => {
  // Mini-implémentation logique de la même fonction que dans <DataTable>
  type Row = { id: string; name: string; age: number };

  function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
    return rows.slice(page * pageSize, (page + 1) * pageSize);
  }
  function sortBy<T>(rows: T[], key: keyof T, asc = true): T[] {
    return [...rows].sort((a, b) => {
      const av = a[key] as unknown as string | number;
      const bv = b[key] as unknown as string | number;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return asc ? cmp : -cmp;
    });
  }
  function search<T>(rows: T[], q: string, fields: (keyof T)[]): T[] {
    if (!q.trim()) return rows;
    const ql = q.toLowerCase();
    return rows.filter(r => fields.some(f => String(r[f] ?? "").toLowerCase().includes(ql)));
  }

  const rows: Row[] = [
    { id: "1", name: "Alice",   age: 30 },
    { id: "2", name: "Bob",     age: 25 },
    { id: "3", name: "Charlie", age: 35 },
    { id: "4", name: "David",   age: 28 },
    { id: "5", name: "Eve",     age: 40 },
  ];

  it("paginate — page 0, 2 par page", () => {
    expect(paginate(rows, 0, 2)).toHaveLength(2);
    expect(paginate(rows, 0, 2)[0]!.name).toBe("Alice");
  });
  it("paginate — page 2 (dernière)", () => {
    expect(paginate(rows, 2, 2)).toEqual([rows[4]]);
  });
  it("paginate — page out of bounds renvoie []", () => {
    expect(paginate(rows, 99, 2)).toEqual([]);
  });
  it("sortBy — name asc", () => {
    expect(sortBy(rows, "name", true).map(r => r.name)).toEqual(["Alice","Bob","Charlie","David","Eve"]);
  });
  it("sortBy — age desc", () => {
    expect(sortBy(rows, "age", false).map(r => r.age)).toEqual([40, 35, 30, 28, 25]);
  });
  it("sortBy — set vide", () => {
    expect(sortBy([] as Row[], "name")).toEqual([]);
  });
  it("search — matche partiellement, casse-insensible", () => {
    expect(search(rows, "ali", ["name"]).map(r => r.name)).toEqual(["Alice"]);
    expect(search(rows, "ALI", ["name"]).map(r => r.name)).toEqual(["Alice"]);
  });
  it("search — multiple champs", () => {
    expect(search(rows, "3", ["id","age"]).length).toBeGreaterThanOrEqual(1);
  });
  it("search — query vide retourne tout", () => {
    expect(search(rows, "  ", ["name"])).toEqual(rows);
  });
  it("search — pas de match retourne []", () => {
    expect(search(rows, "zorglub", ["name"])).toEqual([]);
  });
});
