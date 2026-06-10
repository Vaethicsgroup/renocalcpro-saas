// tests/__mocks__/prisma-client.ts
// Mock minimal de @prisma/client pour faire tourner les tests sans DB.
// Expose les enums utilisés par le code testé + un PrismaClient stub.

export type SubscriptionPlan =
  | "P_DECOUVERTE" | "P_MON_PROJET"
  | "TRIAL" | "SOLO" | "PRO" | "TEAM" | "ENTERPRISE";

export type SubscriptionStatus =
  | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";

export type BillingPeriod = "MONTHLY" | "ANNUAL";

export type ClientType =
  | "INDIVIDUAL"
  | "PRO_ARTISAN" | "PRO_DIAGNOSTICIAN" | "PRO_AUDITOR"
  | "PRO_BUREAU_ETUDES" | "PRO_AGENCY" | "PRO_SYNDIC" | "PRO_OTHER";

export type OnboardingStep =
  | "CLIENT_TYPE" | "PRO_SUB_SEGMENT" | "IDENTITY"
  | "QUESTIONS" | "PLAN_SUGGESTION" | "COMPLETED";

export type PrimaryGoal =
  | "FIND_AIDS" | "PLAN_RENO" | "COMPARE_QUOTES" | "REDUCE_BILLS" | "SELL_BUY_HOUSE"
  | "PRODUCE_AUDITS" | "PRODUCE_DPE" | "COMPLY_DECRET_TERTIAIRE" | "WIN_DEALS" | "ONBOARD_TEAM";

export type SegmentSize = "SOLO" | "XS" | "S" | "M" | "L" | "XL";

export type FeatureFlag =
  | "CALC_BASIC" | "CALC_ADVANCED_SCENARIOS"
  | "PDF_TEMPLATE_PARTICULIER" | "PDF_TEMPLATE_DPE_COLLECTIF"
  | "PDF_TEMPLATE_COPROPRIETE" | "PDF_TEMPLATE_TERTIAIRE"
  | "PDF_BRAND_WHITELABEL"
  | "AI_PHOTO_ANALYSIS" | "AI_REPORT_DRAFTING" | "AI_AGENT_ORCHESTRATOR"
  | "TEAM_MULTI_SEAT" | "CLIENT_PORTAL_PUBLIC_LINK" | "COMMENT_THREADS"
  | "AUDIT_LOG_EXPORT" | "WEBHOOKS" | "REST_API";

// ─── Stubs in-memory pour Prisma client ───────────────────────────────────
interface SubscriptionRow {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  usageProjects: number;
  usageReports: number;
  usagePhotos: number;
  usageAiTokens: number;
  usageSeatsActive: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  billingPeriod: BillingPeriod;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeProductId: string | null;
  cancelAtPeriodEnd: boolean;
}
interface PlanFeatureRow { plan: SubscriptionPlan; feature: FeatureFlag; enabled: boolean; hardLimit: number | null }
interface OverrideRow {
  organizationId: string;
  feature: FeatureFlag;
  enabled: boolean;
  hardLimit: number | null;
  expiresAt: Date | null;
}

const store = {
  subs: new Map<string, SubscriptionRow>(),
  features: new Map<string, PlanFeatureRow>(),
  overrides: new Map<string, OverrideRow>(),
  orgs: new Map<string, { id: string; clientType: ClientType; onboardingStep: OnboardingStep }>(),
  audit: [] as Array<{ action: string; payloadJson: unknown }>,
};

const k = (...parts: string[]) => parts.join("|");

export class PrismaClient {
  subscription = {
    findUnique: async ({ where }: { where: { organizationId: string } }) =>
      store.subs.get(where.organizationId) ?? null,
    findFirst: async ({ where }: { where: Partial<SubscriptionRow> }) => {
      for (const v of store.subs.values()) {
        let m = true;
        for (const [kk, vv] of Object.entries(where)) {
          if ((v as unknown as Record<string, unknown>)[kk] !== vv) { m = false; break; }
        }
        if (m) return v;
      }
      return null;
    },
    update: async ({ where, data }: { where: { organizationId: string }; data: Partial<SubscriptionRow> & Record<string, { increment?: number }> }) => {
      const cur = store.subs.get(where.organizationId);
      if (!cur) throw new Error("not_found");
      const next = { ...cur };
      for (const [kk, vv] of Object.entries(data)) {
        if (vv && typeof vv === "object" && "increment" in vv) {
          const k2 = kk as keyof SubscriptionRow;
          (next as Record<string, unknown>)[kk] = (cur[k2] as number) + (vv.increment ?? 0);
        } else {
          (next as Record<string, unknown>)[kk] = vv as unknown;
        }
      }
      store.subs.set(where.organizationId, next);
      return next;
    },
    updateMany: async ({ where, data }: { where: { stripeSubscriptionId?: string }; data: Partial<SubscriptionRow> }) => {
      let n = 0;
      for (const [k2, v] of store.subs.entries()) {
        if (where.stripeSubscriptionId && v.stripeSubscriptionId !== where.stripeSubscriptionId) continue;
        store.subs.set(k2, { ...v, ...data });
        n++;
      }
      return { count: n };
    },
    upsert: async ({ where, create, update }: { where: { organizationId: string }; create: SubscriptionRow; update: Partial<SubscriptionRow> }) => {
      const cur = store.subs.get(where.organizationId);
      if (cur) {
        const next = { ...cur, ...update };
        store.subs.set(where.organizationId, next);
        return next;
      }
      store.subs.set(where.organizationId, create);
      return create;
    },
  };

  planFeature = {
    findUnique: async ({ where }: { where: { plan_feature: { plan: SubscriptionPlan; feature: FeatureFlag } } }) =>
      store.features.get(k(where.plan_feature.plan, where.plan_feature.feature)) ?? null,
    upsert: async ({ where, create, update }: { where: { plan_feature: { plan: SubscriptionPlan; feature: FeatureFlag } }; create: PlanFeatureRow; update: Partial<PlanFeatureRow> }) => {
      const key = k(where.plan_feature.plan, where.plan_feature.feature);
      const cur = store.features.get(key);
      if (cur) {
        const next = { ...cur, ...update };
        store.features.set(key, next);
        return next;
      }
      store.features.set(key, create);
      return create;
    },
  };

  organizationFeatureOverride = {
    findUnique: async ({ where }: { where: { organizationId_feature: { organizationId: string; feature: FeatureFlag } } }) =>
      store.overrides.get(k(where.organizationId_feature.organizationId, where.organizationId_feature.feature)) ?? null,
  };

  organization = {
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const cur = store.orgs.get(where.id) ?? { id: where.id, clientType: "INDIVIDUAL", onboardingStep: "CLIENT_TYPE" };
      const next = { ...cur, ...data } as { id: string; clientType: ClientType; onboardingStep: OnboardingStep };
      store.orgs.set(where.id, next);
      return next;
    },
    findUnique: async ({ where }: { where: { id: string } }) => store.orgs.get(where.id) ?? null,
  };

  auditLog = {
    create: async ({ data }: { data: { action: string; payloadJson: unknown } }) => {
      store.audit.push(data);
      return data;
    },
  };

  $transaction = async <T,>(ops: Promise<T>[]) => Promise.all(ops);
  $disconnect = async () => undefined;
}

// Helpers de test exposés
export const __resetStore = () => {
  store.subs.clear();
  store.features.clear();
  store.overrides.clear();
  store.orgs.clear();
  store.audit.length = 0;
};
export const __seedSubscription = (sub: SubscriptionRow) => store.subs.set(sub.organizationId, sub);
export const __seedFeature = (f: PlanFeatureRow) => store.features.set(k(f.plan, f.feature), f);
export const __seedOverride = (o: OverrideRow) => store.overrides.set(k(o.organizationId, o.feature), o);
export const __getStore = () => store;

export const Prisma = {} as Record<string, unknown>;
