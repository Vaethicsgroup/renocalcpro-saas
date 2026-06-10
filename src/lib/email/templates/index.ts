// lib/email/templates/index.ts — Registry des 8 templates × 5 langues.
// Génération HTML responsive (table-based pour compatibilité Gmail / Outlook).

import type { Locale } from "./types";
import { magicLinkLogin }     from "./magic-link-login";
import { magicLinkSignup }    from "./magic-link-signup";
import { welcomeIndividual }  from "./welcome-individual";
import { welcomePro }         from "./welcome-pro";
import { trialEndingSoon }    from "./trial-ending-soon";
import { trialEnded }         from "./trial-ended";
import { paymentFailed }      from "./payment-failed";
import { subscriptionCanceled } from "./subscription-canceled";
import { weeklyUsageReport }  from "./weekly-usage-report";

export type TemplateName =
  | "magic-link-login"
  | "magic-link-signup"
  | "welcome-individual"
  | "welcome-pro"
  | "trial-ending-soon"
  | "trial-ended"
  | "payment-failed"
  | "subscription-canceled"
  | "weekly-usage-report";

export interface TemplateProps {
  "magic-link-login":      { url: string; userEmail: string };
  "magic-link-signup":     { url: string; userEmail: string };
  "welcome-individual":    { firstName?: string; dashboardUrl: string };
  "welcome-pro":           { firstName?: string; companyName: string; dashboardUrl: string };
  "trial-ending-soon":     { daysLeft: number; planName: string; upgradeUrl: string };
  "trial-ended":           { planName: string; pricingUrl: string };
  "payment-failed":        { amount: string; updatePaymentUrl: string };
  "subscription-canceled": { planName: string; until: string; reactivateUrl: string };
  "weekly-usage-report":   { reportsUsed: number; reportsLimit: number | null; weekStart: string };
}

export interface RenderedTemplate { subject: string; html: string; text: string }

const REGISTRY: { [K in TemplateName]: (locale: Locale, props: TemplateProps[K]) => RenderedTemplate } = {
  "magic-link-login":      magicLinkLogin,
  "magic-link-signup":     magicLinkSignup,
  "welcome-individual":    welcomeIndividual,
  "welcome-pro":           welcomePro,
  "trial-ending-soon":     trialEndingSoon,
  "trial-ended":           trialEnded,
  "payment-failed":        paymentFailed,
  "subscription-canceled": subscriptionCanceled,
  "weekly-usage-report":   weeklyUsageReport,
};

export async function renderTemplate<T extends TemplateName>(
  name: T,
  locale: Locale,
  props: TemplateProps[T],
  trackingId?: string,
): Promise<RenderedTemplate> {
  const r = REGISTRY[name](locale, props);
  if (!trackingId) return r;
  // Injection pixel tracker open (1×1 transparent)
  const pixel = `<img src="${process.env.NEXTAUTH_URL ?? ""}/api/email/track?t=${encodeURIComponent(trackingId)}" width="1" height="1" alt="" style="display:none" />`;
  return { ...r, html: r.html.replace(/<\/body>/i, `${pixel}</body>`) };
}

export type { Locale };
