import { type Locale, t, emailLayout, ctaButton, htmlToText } from "./types";

export function welcomeIndividual(locale: Locale, props: { firstName?: string; dashboardUrl: string }) {
  const greet = props.firstName ? `, ${props.firstName}` : "";
  const subject = t({
    fr:"Bienvenue sur Réno·Calc Pro",
    en:"Welcome to Réno·Calc Pro",
    es:"Bienvenido a Réno·Calc Pro",
    de:"Willkommen bei Réno·Calc Pro",
    pt:"Bem-vindo à Réno·Calc Pro",
  }, locale);
  const heading = t({
    fr:`Bienvenue${greet} !`, en:`Welcome${greet}!`, es:`¡Bienvenido${greet}!`, de:`Willkommen${greet}!`, pt:`Bem-vindo${greet}!`,
  }, locale);
  const intro = t({
    fr:"Votre espace est prêt. Vous pouvez démarrer votre premier dossier en moins de 4 minutes : adresse, surface, isolation, et le calculateur identifie automatiquement vos aides.",
    en:"Your space is ready. Start your first case in under 4 min : address, surface, insulation — the calculator finds all your subsidies.",
    es:"Su espacio está listo. Empiece su primer expediente en menos de 4 min.",
    de:"Ihr Bereich ist bereit. Starten Sie Ihr erstes Dossier in weniger als 4 Min.",
    pt:"O seu espaço está pronto. Comece o primeiro processo em menos de 4 min.",
  }, locale);
  const cta = t({ fr:"Accéder à mon espace", en:"Open my dashboard", es:"Abrir mi panel", de:"Dashboard öffnen", pt:"Abrir painel" }, locale);
  const body = `
    <h1 style="font-size:24px;margin:0 0 16px;color:#115e59;">${heading}</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">${intro}</p>
    ${ctaButton(cta, props.dashboardUrl)}
  `;
  const html = emailLayout({ locale, preheader: intro, bodyHtml: body });
  return { subject, html, text: htmlToText(html) };
}
