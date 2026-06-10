// tests/setup.ts — Setup global Vitest pour SaaS.
// Mock @/lib/db/client + @/lib/security/auditLog avec un store in-memory.

import { vi, beforeEach } from "vitest";

interface SubscriptionRow {
  id: string;
  organizationId: string;
  plan: string;
  status: string;
  usageProjects: number;
  usageReports: number;
  usagePhotos: number;
  usageAiTokens: number;
  usageSeatsActive: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  billingPeriod: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  cancelAtPeriodEnd: boolean;
}
interface PlanFeatureRow { plan: string; feature: string; enabled: boolean; hardLimit: number | null }
interface OverrideRow {
  organizationId: string; feature: string; enabled: boolean;
  hardLimit: number | null; expiresAt: Date | null;
}
interface OrgRow { id: string; clientType: string; onboardingStep: string }

// ─── Store in-memory exposé globalement pour les helpers de test ─────────
const globalStore = {
  subs: new Map<string, SubscriptionRow>(),
  features: new Map<string, PlanFeatureRow>(),
  overrides: new Map<string, OverrideRow>(),
  orgs: new Map<string, OrgRow>(),
  audit: [] as Array<{ action: string; payloadJson: unknown; organizationId?: string | null }>,
};

(globalThis as unknown as { __TEST_STORE__: typeof globalStore }).__TEST_STORE__ = globalStore;

const k = (...parts: string[]) => parts.join("|");

beforeEach(() => {
  globalStore.subs.clear();
  globalStore.features.clear();
  globalStore.overrides.clear();
  globalStore.orgs.clear();
  globalStore.audit.length = 0;
});

// ─── Mock @/lib/db/client ────────────────────────────────────────────────
vi.mock("@/lib/db/client", () => ({
  prisma: {
    subscription: {
      findUnique: async ({ where }: { where: { organizationId: string } }) =>
        globalStore.subs.get(where.organizationId) ?? null,
      findFirst: async ({ where }: { where: Partial<SubscriptionRow> }) => {
        for (const v of globalStore.subs.values()) {
          let m = true;
          for (const [kk, vv] of Object.entries(where)) {
            if ((v as unknown as Record<string, unknown>)[kk] !== vv) { m = false; break; }
          }
          if (m) return v;
        }
        return null;
      },
      update: async ({ where, data }: { where: { organizationId: string }; data: Record<string, unknown> }) => {
        const cur = globalStore.subs.get(where.organizationId);
        if (!cur) throw new Error("not_found");
        const next = { ...cur };
        for (const [kk, vv] of Object.entries(data)) {
          if (vv && typeof vv === "object" && "increment" in (vv as object)) {
            (next as Record<string, unknown>)[kk] = (cur as unknown as Record<string, number>)[kk] + ((vv as { increment: number }).increment ?? 0);
          } else {
            (next as Record<string, unknown>)[kk] = vv as unknown;
          }
        }
        globalStore.subs.set(where.organizationId, next);
        return next;
      },
      updateMany: async ({ where, data }: { where: Partial<SubscriptionRow>; data: Partial<SubscriptionRow> }) => {
        let n = 0;
        for (const [k2, v] of globalStore.subs.entries()) {
          let m = true;
          for (const [kk, vv] of Object.entries(where)) {
            if ((v as unknown as Record<string, unknown>)[kk] !== vv) { m = false; break; }
          }
          if (!m) continue;
          globalStore.subs.set(k2, { ...v, ...data });
          n++;
        }
        return { count: n };
      },
      upsert: async ({ where, create, update }: { where: { organizationId: string }; create: SubscriptionRow; update: Partial<SubscriptionRow> }) => {
        const cur = globalStore.subs.get(where.organizationId);
        if (cur) {
          const next = { ...cur, ...update };
          globalStore.subs.set(where.organizationId, next);
          return next;
        }
        globalStore.subs.set(where.organizationId, create);
        return create;
      },
    },
    planFeature: {
      findUnique: async ({ where }: { where: { plan_feature: { plan: string; feature: string } } }) =>
        globalStore.features.get(k(where.plan_feature.plan, where.plan_feature.feature)) ?? null,
    },
    organizationFeatureOverride: {
      findUnique: async ({ where }: { where: { organizationId_feature: { organizationId: string; feature: string } } }) =>
        globalStore.overrides.get(k(where.organizationId_feature.organizationId, where.organizationId_feature.feature)) ?? null,
    },
    organization: {
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const cur = globalStore.orgs.get(where.id) ?? { id: where.id, clientType: "INDIVIDUAL", onboardingStep: "CLIENT_TYPE" };
        const next = { ...cur, ...data } as OrgRow;
        globalStore.orgs.set(where.id, next);
        return next;
      },
      findUnique: async ({ where }: { where: { id: string } }) => globalStore.orgs.get(where.id) ?? null,
    },
    auditLog: {
      findFirst: async () => null,
      create: async ({ data }: { data: { action: string; payloadJson: unknown } }) => {
        globalStore.audit.push(data);
        return data;
      },
    },
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
  },
  withOrgContext: async <T,>(_id: string, fn: () => Promise<T>) => fn(),
  orgContext: { getStore: () => undefined },
}));

// ─── Mock auditLog (évite la contrainte HMAC_KEY) ─────────────────────────
vi.mock("@/lib/security/auditLog", () => ({
  logAudit: async (entry: { action: string; payloadJson?: unknown; organizationId?: string }) => {
    globalStore.audit.push({
      action: entry.action,
      payloadJson: entry.payloadJson ?? null,
      organizationId: entry.organizationId ?? null,
    });
  },
  verifyAuditChain: async () => true,
}));

// ─── Mock next/cache et next/navigation ───────────────────────────────────
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`__REDIRECT__:${path}`); },
}));

// ─── Helpers exposés ───────────────────────────────────────────────────────
export function seedSubscription(sub: Partial<SubscriptionRow> & { organizationId: string; plan: string }): SubscriptionRow {
  const full: SubscriptionRow = {
    id: `sub_${sub.organizationId}`,
    organizationId: sub.organizationId,
    plan: sub.plan,
    status: sub.status ?? "ACTIVE",
    usageProjects: sub.usageProjects ?? 0,
    usageReports: sub.usageReports ?? 0,
    usagePhotos: sub.usagePhotos ?? 0,
    usageAiTokens: sub.usageAiTokens ?? 0,
    usageSeatsActive: sub.usageSeatsActive ?? 0,
    currentPeriodStart: sub.currentPeriodStart ?? new Date("2026-05-01"),
    currentPeriodEnd: sub.currentPeriodEnd ?? new Date("2026-06-01"),
    billingPeriod: sub.billingPeriod ?? "MONTHLY",
    stripeCustomerId: sub.stripeCustomerId ?? null,
    stripeSubscriptionId: sub.stripeSubscriptionId ?? null,
    stripePriceId: sub.stripePriceId ?? null,
    stripeProductId: sub.stripeProductId ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
  };
  globalStore.subs.set(full.organizationId, full);
  return full;
}
export function seedFeature(plan: string, feature: string, enabled: boolean, hardLimit: number | null = null): void {
  globalStore.features.set(k(plan, feature), { plan, feature, enabled, hardLimit });
}
export function seedOverride(orgId: string, feature: string, enabled: boolean, hardLimit: number | null = null, expiresAt: Date | null = null): void {
  globalStore.overrides.set(k(orgId, feature), { organizationId: orgId, feature, enabled, hardLimit, expiresAt });
}
export function getStore() { return globalStore; }
