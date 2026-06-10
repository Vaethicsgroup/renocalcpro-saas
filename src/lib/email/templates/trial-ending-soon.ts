import { type Locale, t, emailLayout, ctaButton, htmlToText } from "./types";

export function trialEndingSoon(locale: Locale, props: { daysLeft: number; planName: string; upgradeUrl: string }) {
  const subject = t({
    fr:`Votre essai se termine dans ${props.daysLeft} jours`,
    en:`Your trial ends in ${props.daysLeft} days`,
    es:`Su prueba termina en ${props.daysLeft} días`,
    de:`Ihr Test endet in ${props.daysLeft} Tagen`,
    pt:`O seu teste termina em ${props.daysLeft} dias`,
  }, locale);
  const heading = t({
    fr:"Plus que quelques jours",en:"Just a few days left",es:"Pocos días restantes",de:"Nur noch wenige Tage",pt:"Poucos dias restantes",
  }, locale);
  const intro = t({
    fr:`Votre essai gratuit ${props.planName} se termine dans ${props.daysLeft} jours. Continuez à profiter de Réno·Calc Pro en activant votre abonnement.`,
    en:`Your ${props.planName} trial ends in ${props.daysLeft} days. Activate your subscription to keep going.`,
    es:`Su prueba ${props.planName} termina en ${props.daysLeft} días.`,
    de:`Ihr ${props.planName}-Test endet in ${props.daysLeft} Tagen.`,
    pt:`O seu teste ${props.planName} termina em ${props.daysLeft} dias.`,
  }, locale);
  const cta = t({ fr:"Choisir mon plan", en:"Pick my plan", es:"Elegir plan", de:"Plan wählen", pt:"Escolher plano" }, locale);
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#a16207;">${heading}</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">${intro}</p>
    ${ctaButton(cta, props.upgradeUrl)}
  `;
  const html = emailLayout({ locale, preheader: intro, bodyHtml: body });
  return { subject, html, text: htmlToText(html) };
}
