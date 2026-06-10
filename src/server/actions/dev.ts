// server/actions/dev.ts — Server actions dev only.
"use server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { sendEmail, EMAIL_MOCK } from "@/lib/email";
import { renderTemplate, type TemplateName, type Locale } from "@/lib/email/templates";

const SAMPLE_PROPS = {
  "magic-link-login":      { url: "https://renocalcpro.fr/auth/callback?token=test", userEmail: "demo@example.com" },
  "magic-link-signup":     { url: "https://renocalcpro.fr/auth/callback?token=test", userEmail: "demo@example.com" },
  "welcome-individual":    { firstName: "Test", dashboardUrl: "https://renocalcpro.fr/p/dashboard" },
  "welcome-pro":           { firstName: "Test", companyName: "Cabinet Test", dashboardUrl: "https://renocalcpro.fr/o/dashboard" },
  "trial-ending-soon":     { daysLeft: 3, planName: "Pro", upgradeUrl: "https://renocalcpro.fr/billing" },
  "trial-ended":           { planName: "Pro", pricingUrl: "https://renocalcpro.fr/pricing" },
  "payment-failed":        { amount: "149,00 €", updatePaymentUrl: "https://renocalcpro.fr/billing/payment" },
  "subscription-canceled": { planName: "Pro", until: "30 juin 2026", reactivateUrl: "https://renocalcpro.fr/billing" },
  "weekly-usage-report":   { reportsUsed: 23, reportsLimit: 100, weekStart: "5 mai 2026" },
};

export async function sendTestEmailAction(
  template: TemplateName,
  locale: Locale,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { ok: false, error: "Connectez-vous pour envoyer un test." };

  // Garde dev-only en prod
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_USER_IDS?.includes(session.user.id)) {
    return { ok: false, error: "dev-only or admin required in production" };
  }

  const props = SAMPLE_PROPS[template];

  if (EMAIL_MOCK) {
    // Log dans la table EmailMockLog pour pouvoir requêter ensuite
    const r = await renderTemplate(template, locale, props as never);
    const logged = await prisma.emailMockLog.create({
      data: {
        toEmail:  email,
        template,
        locale,
        subject:  r.subject,
        html:     r.html,
        text:     r.text,
        sentByUserId: session.user.id,
      },
    }).catch((e) => { console.error("[sendTestEmailAction] DB error:", e); return null; });

    console.log(`[email-test-mock] → ${email} : ${template} (${locale}) — id=${logged?.id ?? "?"}`);
    return { ok: true, id: logged?.id ?? `console_${Date.now()}` };
  }

  // En prod réelle (Resend configuré) — envoi vrai
  const result = await sendEmail({ to: email, template, props: props as never, locale });
  return result.ok && result.id ? { ok: true, id: result.id } : { ok: false, error: result.error ?? "send failed" };
}
