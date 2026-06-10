// lib/billing/stripe.ts
// Abstraction Stripe avec mode MOCK pour développement sans clés réelles.
// STRIPE_MOCK=true → toutes les opérations sont simulées en mémoire.

import Stripe from "stripe";

export const STRIPE_MOCK = process.env.STRIPE_MOCK === "true" || !process.env.STRIPE_SECRET_KEY;

export const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2024-11-20.acacia";

/* -------------------------------------------------------------------------- */
/*  Client Stripe (réel ou null)                                              */
/* -------------------------------------------------------------------------- */

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (STRIPE_MOCK) return null;
  if (_stripe) return _stripe;
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: STRIPE_API_VERSION });
  return _stripe;
}

/* -------------------------------------------------------------------------- */
/*  Types DTO                                                                 */
/* -------------------------------------------------------------------------- */

export interface CheckoutSession {
  id: string;
  url: string;
  customerId: string;
  subscriptionId: string | null;
}

export interface CustomerPortalSession {
  url: string;
}

/* -------------------------------------------------------------------------- */
/*  Catalogue des prix                                                        */
/*    Mappage plan → priceId. Override via env STRIPE_PRICE_<PLAN>_<PERIOD>   */
/* -------------------------------------------------------------------------- */

export type Plan = "P_DECOUVERTE" | "P_MON_PROJET" | "TRIAL" | "SOLO" | "PRO" | "TEAM" | "ENTERPRISE";
export type Period = "MONTHLY" | "ANNUAL";

export function priceIdFor(plan: Plan, period: Period): string {
  const env = process.env[`STRIPE_PRICE_${plan}_${period}`];
  if (env) return env;
  // Mock IDs en dev — Stripe acceptera ou non selon le mode.
  return `price_mock_${plan.toLowerCase()}_${period.toLowerCase()}`;
}

/* -------------------------------------------------------------------------- */
/*  In-memory store pour MOCK                                                 */
/* -------------------------------------------------------------------------- */

interface MockCustomer {
  id: string;
  email: string;
  organizationId: string;
}

interface MockSubscription {
  id: string;
  customerId: string;
  priceId: string;
  status: "active" | "trialing" | "canceled";
  currentPeriodStart: number;
  currentPeriodEnd: number;
}

const mockStore = {
  customers: new Map<string, MockCustomer>(),
  subscriptions: new Map<string, MockSubscription>(),
};

/* -------------------------------------------------------------------------- */
/*  Création d'une session de checkout                                        */
/* -------------------------------------------------------------------------- */

export async function createCheckoutSession(opts: {
  organizationId: string;
  customerEmail: string;
  plan: Plan;
  period: Period;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSession> {
  const priceId = priceIdFor(opts.plan, opts.period);

  if (STRIPE_MOCK) {
    const customerId = `cus_mock_${opts.organizationId}`;
    const subscriptionId = `sub_mock_${opts.organizationId}_${Date.now()}`;
    mockStore.customers.set(customerId, {
      id: customerId,
      email: opts.customerEmail,
      organizationId: opts.organizationId,
    });
    mockStore.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      customerId,
      priceId,
      status: opts.plan === "TRIAL" ? "trialing" : "active",
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 30 * 24 * 3600 * 1000,
    });
    return {
      id: `cs_mock_${subscriptionId}`,
      url: `${opts.successUrl}?mock=1&plan=${opts.plan}&subId=${subscriptionId}`,
      customerId,
      subscriptionId,
    };
  }

  const stripe = getStripe()!;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card", "sepa_debit"],
    customer_email: opts.customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { organizationId: opts.organizationId, plan: opts.plan, period: opts.period },
    subscription_data: {
      metadata: { organizationId: opts.organizationId, plan: opts.plan, period: opts.period },
      ...(opts.plan === "TRIAL" ? { trial_period_days: 14 } : {}),
    },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    locale: "fr",
    allow_promotion_codes: true,
    billing_address_collection: "required",
    automatic_tax: { enabled: true },
  });

  return {
    id: session.id,
    url: session.url ?? opts.cancelUrl,
    customerId: typeof session.customer === "string" ? session.customer : "",
    subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Portail client (Stripe-managed)                                           */
/* -------------------------------------------------------------------------- */

export async function createCustomerPortalSession(opts: {
  customerId: string;
  returnUrl: string;
}): Promise<CustomerPortalSession> {
  if (STRIPE_MOCK) {
    return { url: `${opts.returnUrl}?portal=mock&cus=${opts.customerId}` };
  }
  const stripe = getStripe()!;
  const portal = await stripe.billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
  return { url: portal.url };
}

/* -------------------------------------------------------------------------- */
/*  Vérification de la signature webhook                                      */
/* -------------------------------------------------------------------------- */

export function verifyWebhookSignature(rawBody: string, signature: string): Stripe.Event {
  if (STRIPE_MOCK) {
    return JSON.parse(rawBody) as Stripe.Event;
  }
  const stripe = getStripe()!;
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}
