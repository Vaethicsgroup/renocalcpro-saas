import { type Locale, t, emailLayout, ctaButton, htmlToText } from "./types";

export function trialEnded(locale: Locale, props: { planName: string; pricingUrl: string }) {
  const subject = t({
    fr:"Votre essai gratuit est terminé",
    en:"Your free trial has ended",
    es:"Su prueba gratuita ha terminado",
    de:"Ihr kostenloser Test ist beendet",
    pt:"O seu teste gratuito terminou",
  }, locale);
  const intro = t({
    fr:`Votre essai ${props.planName} est arrivé à terme. Vos données sont conservées 30 jours. Choisissez un plan pour continuer.`,
    en:`Your ${props.planName} trial has ended. Data kept 30 days. Pick a plan to continue.`,
    es:`Su prueba ${props.planName} ha terminado.`,
    de:`Ihr ${props.planName}-Test ist beendet.`,
    pt:`O seu teste ${props.planName} terminou.`,
  }, locale);
  const cta = t({ fr:"Voir les plans", en:"See plans", es:"Ver planes", de:"Tarife", pt:"Ver planos" }, locale);
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#115e59;">${t({fr:"Essai terminé",en:"Trial ended",es:"Prueba terminada",de:"Test beendet",pt:"Teste terminado"},locale)}</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">${intro}</p>
    ${ctaButton(cta, props.pricingUrl)}
  `;
  const html = emailLayout({ locale, preheader: intro, bodyHtml: body });
  return { subject, html, text: htmlToText(html) };
}
