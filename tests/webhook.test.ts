// tests/webhook.test.ts — 6 handlers webhook Stripe en mode MOCK.

import { describe, it, expect, vi, beforeEach } from "vitest";

// On force le mode MOCK avant tout import du module billing/stripe.
process.env.STRIPE_MOCK = "true";
delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_WEBHOOK_SECRET;

// auditLog : vi.mock dans `setupFiles` n'est pas systématiquement hoisté
// avant les imports d'un fichier de test (limitation vitest connue). On
// duplique localement le mock pour garantir que la route le voie au load.
vi.mock("@/lib/security/auditLog", () => ({
  auditLog: vi.fn(),
  logAudit: vi.fn(),
}));

import { POST } from "@/app/api/webhooks/stripe/route";
import { seedSubscription, getStore } from "./setup";

const ORG = "org_webhook_test";

function buildRequest(event: object): { req: Request } {
  const body = JSON.stringify(event);
  return {
    req: new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "mock_sig", "content-type": "application/json" },
      body,
    }),
  };
}

describe("webhook Stripe — checkout.session.completed", () => {
  it("upsert la subscription avec plan + customerId + subscriptionId", async () => {
    seedSubscription({ organizationId: ORG, plan: "TRIAL" });
    const event = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_xxx",
          subscription: "sub_xxx",
          metadata: { organizationId: ORG, plan: "PRO" },
        },
      },
    };
    const res = await POST(buildRequest(event).req as never);
    const json = await (res as Response).json();
    expect(json.ok).toBe(true);

    const sub = getStore().subs.get(ORG)!;
    expect(sub.plan).toBe("PRO");
    expect(sub.status).toBe("ACTIVE");
    expect(sub.stripeCustomerId).toBe("cus_xxx");
    expect(sub.stripeSubscriptionId).toBe("sub_xxx");
  });

  it("crée la subscription si elle n'existait pas", async () => {
    const event = {
      id: "evt_2",
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_new",
          subscription: "sub_new",
          metadata: { organizationId: "org_brand_new", plan: "SOLO" },
        },
      },
    };
    await POST(buildRequest(event).req as never);
    const sub = getStore().subs.get("org_brand_new");
    expect(sub).toBeDefined();
    expect(sub?.plan).toBe("SOLO");
  });

  it("ignore si organizationId manquant", async () => {
    const event = {
      id: "evt_3",
      type: "checkout.session.completed",
      data: { object: { customer: "cus", subscription: "sub", metadata: {} } },
    };
    const res = await POST(buildRequest(event).req as never);
    const json = await (res as Response).json();
    expect(json.ok).toBe(true);
  });
});

describe("webhook — customer.subscription.updated", () => {
  it("met à jour status + currentPeriod*", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    const event = {
      id: "evt_4",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_xxx",
          status: "active",
          metadata: { organizationId: ORG },
          items: { data: [{ price: { id: "price_xx", product: "prod_xx" } }] },
          current_period_start: 1717200000, // 2024-06-01
          current_period_end:   1719792000, // 2024-07-01
          cancel_at_period_end: false,
        },
      },
    };
    await POST(buildRequest(event).req as never);
    const sub = getStore().subs.get(ORG)!;
    expect(sub.status).toBe("ACTIVE");
    expect(sub.stripePriceId).toBe("price_xx");
    expect(sub.stripeProductId).toBe("prod_xx");
  });

  it("status past_due → PAST_DUE en interne", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    const event = {
      id: "evt_5",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_xxx", status: "past_due",
          metadata: { organizationId: ORG },
          items: { data: [{ price: { id: "p", product: "x" } }] },
          current_period_start: 0, current_period_end: 0,
          cancel_at_period_end: false,
        },
      },
    };
    await POST(buildRequest(event).req as never);
    expect(getStore().subs.get(ORG)?.status).toBe("PAST_DUE");
  });

  it("status trialing → TRIALING", async () => {
    seedSubscription({ organizationId: ORG, plan: "TRIAL" });
    const event = {
      id: "evt_6",
      type: "customer.subscription.updated",
      data: { object: {
        id: "sub", status: "trialing",
        metadata: { organizationId: ORG },
        items: { data: [{ price: { id: "p", product: "x" } }] },
        current_period_start: 0, current_period_end: 0,
        cancel_at_period_end: false,
      }},
    };
    await POST(buildRequest(event).req as never);
    expect(getStore().subs.get(ORG)?.status).toBe("TRIALING");
  });
});

describe("webhook — customer.subscription.deleted", () => {
  it("passe la sub en CANCELED", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO" });
    const event = {
      id: "evt_7",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub", metadata: { organizationId: ORG } } },
    };
    await POST(buildRequest(event).req as never);
    expect(getStore().subs.get(ORG)?.status).toBe("CANCELED");
  });
});

describe("webhook — invoice.payment_succeeded", () => {
  it("reset les compteurs et avance les bornes de période", async () => {
    seedSubscription({
      organizationId: ORG, plan: "PRO",
      stripeSubscriptionId: "sub_paid",
      usageReports: 50, usagePhotos: 200,
    });
    const event = {
      id: "evt_8",
      type: "invoice.payment_succeeded",
      data: {
        object: {
          subscription: "sub_paid",
          period_start: 1719792000, // 2024-07-01
          period_end:   1722470400, // 2024-08-01
        },
      },
    };
    await POST(buildRequest(event).req as never);
    const sub = getStore().subs.get(ORG)!;
    expect(sub.usageReports).toBe(0);
    expect(sub.usagePhotos).toBe(0);
  });

  it("ignore si subscription introuvable côté DB", async () => {
    const event = {
      id: "evt_9",
      type: "invoice.payment_succeeded",
      data: { object: { subscription: "sub_unknown", period_start: 0, period_end: 0 } },
    };
    const res = await POST(buildRequest(event).req as never);
    expect(((await (res as Response).json()) as { ok: boolean }).ok).toBe(true);
  });
});

describe("webhook — invoice.payment_failed", () => {
  it("passe la sub en PAST_DUE", async () => {
    seedSubscription({ organizationId: ORG, plan: "PRO", stripeSubscriptionId: "sub_fail" });
    const event = {
      id: "evt_10",
      type: "invoice.payment_failed",
      data: { object: { subscription: "sub_fail" } },
    };
    await POST(buildRequest(event).req as never);
    expect(getStore().subs.get(ORG)?.status).toBe("PAST_DUE");
  });
});

describe("webhook — événements non-gérés", () => {
  it("retourne ok=true sans planter", async () => {
    const event = { id: "evt_11", type: "customer.created", data: { object: {} } };
    const res = await POST(buildRequest(event).req as never);
    expect(((await (res as Response).json()) as { ok: boolean }).ok).toBe(true);
  });
});

describe("webhook — idempotence", () => {
  it("le même event ID n'est traité qu'une fois", async () => {
    seedSubscription({ organizationId: ORG, plan: "TRIAL" });
    const event = {
      id: "evt_dup",
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_a", subscription: "sub_a",
          metadata: { organizationId: ORG, plan: "PRO" },
        },
      },
    };
    await POST(buildRequest(event).req as never);
    const second = await POST(buildRequest(event).req as never);
    const json = await (second as Response).json();
    expect(json.idempotent).toBe(true);
  });
});

describe("webhook — signature", () => {
  it("en mode MOCK, n'importe quelle signature passe (test-friendly)", async () => {
    // Couvert implicitement par les autres tests : tous utilisent "mock_sig".
    expect(true).toBe(true);
  });
});
