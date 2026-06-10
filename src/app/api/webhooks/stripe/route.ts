// app/api/webhooks/stripe/route.ts — Webhook Stripe (signature verifiée).
// Gère les événements clés : checkout.session.completed, customer.subscription.*,
// invoice.payment_succeeded, invoice.payment_failed.

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, STRIPE_MOCK } from "@/lib/billing/stripe";
import { resetUsageForPeriod } from "@/lib/billing/usage";
import { prisma } from "@/lib/db/client";
import { auditLog } from "@/lib/security/auditLog";
import { emitWebhookEvent } from "@/lib/webhooks/dispatch";
import type Stripe from "stripe";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

// Stripe envoie le body brut — on ne doit PAS parser via JSON middleware.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Idempotence : on stocke les IDs Stripe traités (en mémoire process — OK
// pour un instance unique ; pour multi-instance, basculer sur Redis).
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(body, signature);
  } catch (err) {
    console.error("[stripe-webhook] Bad signature", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (processedEvents.has(event.id)) {
    return NextResponse.json({ ok: true, idempotent: true });
  }
  processedEvents.add(event.id);

  try {
    switch (event.type) {
      case "checkout.session.completed":      await onCheckoutCompleted(event); break;
      case "customer.subscription.created":   await onSubscriptionUpdated(event); break;
      case "customer.subscription.updated":   await onSubscriptionUpdated(event); break;
      case "customer.subscription.deleted":   await onSubscriptionDeleted(event); break;
      case "invoice.payment_succeeded":       await onInvoicePaid(event); break;
      case "invoice.payment_failed":          await onInvoiceFailed(event); break;
      default:
        // pas d'erreur — Stripe répétera si besoin
        console.log("[stripe-webhook] Unhandled event:", event.type);
    }
  } catch (err) {
    console.error("[stripe-webhook] Handler error", event.type, err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  await auditLog({
    action: `STRIPE_${event.type.toUpperCase().replace(/\./g, "_")}`,
    payloadJson: STRIPE_MOCK ? { mock: true } : { eventId: event.id },
  });

  return NextResponse.json({ ok: true });
}

/* -------------------------------------------------------------------------- */
/*  Handlers                                                                  */
/* -------------------------------------------------------------------------- */

async function onCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const orgId = session.metadata?.organizationId;
  if (!orgId) return;

  const plan = (session.metadata?.plan ?? "TRIAL") as SubscriptionPlan;
  const stripeCustomerId    = typeof session.customer === "string" ? session.customer : null;
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;

  await prisma.subscription.upsert({
    where: { organizationId: orgId },
    create: {
      organizationId: orgId,
      plan,
      status: "ACTIVE",
      stripeCustomerId, stripeSubscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
    update: {
      plan,
      status: "ACTIVE",
      stripeCustomerId, stripeSubscriptionId,
    },
  });
}

async function onSubscriptionUpdated(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription;
  const orgId = sub.metadata.organizationId;
  if (!orgId) return;

  const status = mapStripeStatus(sub.status);
  await prisma.subscription.update({
    where: { organizationId: orgId },
    data: {
      status,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price.id,
      stripeProductId: typeof sub.items.data[0]?.price.product === "string"
        ? sub.items.data[0].price.product
        : null,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  emitWebhookEvent({
    organizationId: orgId,
    event: "SUBSCRIPTION_UPDATED",
    data: {
      status,
      stripeSubscriptionId: sub.id,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      currentPeriodEnd: sub.current_period_end,
    },
  }).catch(err => console.warn("[webhook emit failed]", err));
}

async function onSubscriptionDeleted(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription;
  const orgId = sub.metadata.organizationId;
  if (!orgId) return;

  await prisma.subscription.update({
    where: { organizationId: orgId },
    data: { status: "CANCELED" },
  });

  emitWebhookEvent({
    organizationId: orgId,
    event: "SUBSCRIPTION_UPDATED",
    data: { status: "CANCELED", stripeSubscriptionId: sub.id },
  }).catch(err => console.warn("[webhook emit failed]", err));
}

async function onInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
  if (!subId) return;

  const sub = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: subId } });
  if (!sub) return;

  await resetUsageForPeriod(
    sub.organizationId,
    new Date(invoice.period_start * 1000),
    new Date(invoice.period_end   * 1000),
  );

  emitWebhookEvent({
    organizationId: sub.organizationId,
    event: "PAYMENT_SUCCEEDED",
    data: {
      invoiceId: invoice.id,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
    },
  }).catch(err => console.warn("[webhook emit failed]", err));
}

async function onInvoiceFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
  if (!subId) return;

  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subId },
    select: { organizationId: true },
  });

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subId },
    data: { status: "PAST_DUE" },
  });

  if (sub) {
    emitWebhookEvent({
      organizationId: sub.organizationId,
      event: "PAYMENT_FAILED",
      data: {
        invoiceId: invoice.id,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        attemptCount: invoice.attempt_count,
      },
    }).catch(err => console.warn("[webhook emit failed]", err));
  }
}

function mapStripeStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case "trialing":           return "TRIALING";
    case "active":             return "ACTIVE";
    case "past_due":           return "PAST_DUE";
    case "canceled":
    case "incomplete_expired": return "CANCELED";
    case "unpaid":             return "EXPIRED";
    default:                   return "ACTIVE";
  }
}
