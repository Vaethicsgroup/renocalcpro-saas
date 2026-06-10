import { type Locale, t, emailLayout, ctaButton, htmlToText } from "./types";

export function paymentFailed(locale: Locale, props: { amount: string; updatePaymentUrl: string }) {
  const subject = t({
    fr:"Échec du paiement — action requise",
    en:"Payment failed — action required",
    es:"Pago fallido — acción requerida",
    de:"Zahlung fehlgeschlagen — Aktion erforderlich",
    pt:"Pagamento falhou — ação necessária",
  }, locale);
  const intro = t({
    fr:`Le prélèvement de ${props.amount} a échoué. Pour éviter une interruption de service, mettez à jour votre moyen de paiement dans les 5 prochains jours.`,
    en:`Payment of ${props.amount} failed. Update your payment method within 5 days to avoid interruption.`,
    es:`El pago de ${props.amount} falló. Actualice su método en 5 días.`,
    de:`Zahlung über ${props.amount} fehlgeschlagen. Aktualisieren Sie binnen 5 Tagen.`,
    pt:`Pagamento de ${props.amount} falhou. Atualize em 5 dias.`,
  }, locale);
  const cta = t({
    fr:"Mettre à jour le paiement", en:"Update payment", es:"Actualizar pago", de:"Zahlung aktualisieren", pt:"Atualizar pagamento",
  }, locale);
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#dc2626;">${t({fr:"Paiement échoué",en:"Payment failed",es:"Pago fallido",de:"Zahlung fehlgeschlagen",pt:"Pagamento falhou"},locale)}</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">${intro}</p>
    ${ctaButton(cta, props.updatePaymentUrl)}
  `;
  const html = emailLayout({ locale, preheader: intro, bodyHtml: body });
  return { subject, html, text: htmlToText(html) };
}
