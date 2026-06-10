// lib/email/index.ts — Abstraction email transactionnel.
// EMAIL_MOCK=true → log dans la console au lieu d'envoyer.

import { renderTemplate, type TemplateName, type TemplateProps } from "./templates";
import { logAudit } from "@/lib/security/auditLog";

export const EMAIL_MOCK = process.env.EMAIL_MOCK === "true" || !process.env.RESEND_API_KEY;

interface SendEmailOpts<T extends TemplateName> {
  to: string;
  template: T;
  props: TemplateProps[T];
  locale?: "fr" | "en" | "es" | "de" | "pt";
  organizationId?: string;
  trackingId?: string;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
  mock?: boolean;
}

export async function sendEmail<T extends TemplateName>(opts: SendEmailOpts<T>): Promise<SendResult> {
  const locale = opts.locale ?? "fr";
  const { subject, html, text } = await renderTemplate(opts.template, locale, opts.props, opts.trackingId);
  const fromName = "Réno·Calc Pro";
  const from = process.env.EMAIL_FROM ?? `${fromName} <noreply@renocalcpro.fr>`;

  if (EMAIL_MOCK) {
    console.log(`[email-mock] → ${opts.to}\n  subject: ${subject}\n  template: ${opts.template} (${locale})`);
    await logAudit({
      organizationId: opts.organizationId ?? null,
      action: `EMAIL_SENT_MOCK:${opts.template}`,
      payloadJson: { to: opts.to, locale },
    });
    return { ok: true, mock: true, id: `mock_${Date.now()}` };
  }

  // Resend
  const apiKey = process.env.RESEND_API_KEY!;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject,
      html,
      text,
      reply_to: process.env.EMAIL_REPLY_TO,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err };
  }

  const json = (await res.json()) as { id: string };
  await logAudit({
    organizationId: opts.organizationId ?? null,
    action: `EMAIL_SENT:${opts.template}`,
    payloadJson: { to: opts.to, locale, providerId: json.id },
  });

  return { ok: true, id: json.id };
}
