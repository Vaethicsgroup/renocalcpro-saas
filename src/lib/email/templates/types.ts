// lib/email/templates/types.ts — Helpers communs aux templates email.

export type Locale = "fr" | "en" | "es" | "de" | "pt";

export interface I18nDict {
  fr: string; en: string; es: string; de: string; pt: string;
}

export function t(d: I18nDict, locale: Locale): string {
  return d[locale] || d.fr;
}

export interface BasePartials {
  preheader: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

const BRAND = {
  name: "Réno·Calc Pro",
  primary: "#115e59",
  accent: "#a16207",
  text: "#1c1917",
  muted: "#57534e",
  bg: "#fafaf9",
  cardBg: "#ffffff",
  border: "#e7e5e4",
};

/**
 * Layout HTML email responsive (table-based pour Gmail/Outlook).
 * Toutes les templates utilisent ce wrapper.
 */
export function emailLayout(opts: {
  locale: Locale;
  preheader: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const footerNote = opts.footerNote ?? footerLegal[opts.locale];
  return `<!DOCTYPE html>
<html lang="${opts.locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Réno·Calc Pro</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
<div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${opts.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
      <tr><td style="background:${BRAND.primary};padding:24px;color:#fff;">
        <span style="font-size:20px;font-weight:700;letter-spacing:-0.01em;">Réno·Calc Pro</span>
      </td></tr>
      <tr><td style="padding:32px 32px 24px;">${opts.bodyHtml}</td></tr>
      <tr><td style="padding:24px 32px;background:${BRAND.bg};border-top:1px solid ${BRAND.border};font-size:12px;color:${BRAND.muted};line-height:1.5;">
        ${footerNote}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const footerLegal: Record<Locale, string> = {
  fr: `Réno·Calc Pro — contact@renocalcpro.fr<br/>Vous recevez cet email parce que vous avez un compte sur Réno·Calc Pro.<br/>Pour vous désinscrire, gérez vos préférences depuis votre tableau de bord.`,
  en: `Réno·Calc Pro — contact@renocalcpro.fr<br/>You're receiving this email because you have an account on Réno·Calc Pro.<br/>To unsubscribe, manage preferences from your dashboard.`,
  es: `Réno·Calc Pro — contact@renocalcpro.fr<br/>Recibe este correo porque tiene una cuenta en Réno·Calc Pro.`,
  de: `Réno·Calc Pro — contact@renocalcpro.fr<br/>Sie erhalten diese E-Mail, weil Sie ein Konto bei Réno·Calc Pro haben.`,
  pt: `Réno·Calc Pro — contact@renocalcpro.fr<br/>Recebe este e-mail porque tem conta em Réno·Calc Pro.`,
};

export function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr><td style="border-radius:10px;background:${BRAND.primary};">
    <a href="${url}" style="display:inline-block;padding:14px 28px;color:#fff;text-decoration:none;font-weight:600;font-size:15px;border-radius:10px;">${label}</a>
  </td></tr>
</table>`;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
