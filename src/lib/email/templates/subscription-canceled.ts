import { type Locale, t, emailLayout, ctaButton, htmlToText } from "./types";

export function subscriptionCanceled(locale: Locale, props: { planName: string; until: string; reactivateUrl: string }) {
  const subject = t({
    fr:"Confirmation de résiliation",
    en:"Subscription cancellation confirmation",
    es:"Confirmación de cancelación",
    de:"Kündigungsbestätigung",
    pt:"Confirmação de cancelamento",
  }, locale);
  const intro = t({
    fr:`Votre plan ${props.planName} est résilié. Vous gardez l'accès complet jusqu'au ${props.until}. Vous pouvez réactiver à tout moment d'ici là.`,
    en:`Your ${props.planName} plan is canceled. Full access until ${props.until}. Reactivate anytime.`,
    es:`Su plan ${props.planName} está cancelado. Acceso hasta ${props.until}.`,
    de:`Ihr ${props.planName}-Plan ist gekündigt. Zugriff bis ${props.until}.`,
    pt:`O seu plano ${props.planName} está cancelado. Acesso até ${props.until}.`,
  }, locale);
  const cta = t({
    fr:"Réactiver mon plan", en:"Reactivate plan", es:"Reactivar plan", de:"Plan reaktivieren", pt:"Reativar plano",
  }, locale);
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#115e59;">${t({fr:"Résiliation enregistrée",en:"Cancellation recorded",es:"Cancelación registrada",de:"Kündigung erfasst",pt:"Cancelamento registado"},locale)}</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">${intro}</p>
    ${ctaButton(cta, props.reactivateUrl)}
  `;
  const html = emailLayout({ locale, preheader: intro, bodyHtml: body });
  return { subject, html, text: htmlToText(html) };
}
