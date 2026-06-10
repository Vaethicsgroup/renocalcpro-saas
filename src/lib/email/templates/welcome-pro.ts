import { type Locale, t, emailLayout, ctaButton, htmlToText } from "./types";

export function welcomePro(locale: Locale, props: { firstName?: string; companyName: string; dashboardUrl: string }) {
  const greet = props.firstName ? `, ${props.firstName}` : "";
  const subject = t({
    fr:`Bienvenue sur Réno·Calc Pro — ${props.companyName}`,
    en:`Welcome to Réno·Calc Pro — ${props.companyName}`,
    es:`Bienvenido — ${props.companyName}`,
    de:`Willkommen — ${props.companyName}`,
    pt:`Bem-vindo — ${props.companyName}`,
  }, locale);
  const heading = t({
    fr:`Bienvenue${greet}`, en:`Welcome${greet}`, es:`Bienvenido${greet}`, de:`Willkommen${greet}`, pt:`Bem-vindo${greet}`,
  }, locale);
  const intro = t({
    fr:"Votre espace pro est prêt. Vous pouvez personnaliser votre marque, inviter votre équipe et lancer votre premier audit.",
    en:"Your pro space is ready. Customize your brand, invite your team, run your first audit.",
    es:"Su espacio pro está listo. Personalice marca, invite equipo, lance auditoría.",
    de:"Ihr Pro-Bereich ist bereit. Passen Sie die Marke an, laden Sie Ihr Team ein.",
    pt:"O seu espaço pro está pronto. Personalize a marca, convide a equipa.",
  }, locale);
  const cta = t({ fr:"Ouvrir le tableau de bord", en:"Open dashboard", es:"Abrir panel", de:"Dashboard öffnen", pt:"Abrir painel" }, locale);
  const body = `
    <h1 style="font-size:24px;margin:0 0 16px;color:#115e59;">${heading}</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">${intro}</p>
    ${ctaButton(cta, props.dashboardUrl)}
    <ul style="font-size:14px;color:#57534e;line-height:1.8;padding-left:20px;">
      <li>${t({fr:"Personnalisez votre marque",en:"Customize brand",es:"Marca",de:"Marke",pt:"Marca"},locale)} → /o/branding</li>
      <li>${t({fr:"Invitez votre équipe",en:"Invite team",es:"Equipo",de:"Team",pt:"Equipa"},locale)} → /o/team</li>
      <li>${t({fr:"Configurez votre portail client",en:"Client portal",es:"Portal cliente",de:"Kundenportal",pt:"Portal cliente"},locale)} → /o/portal</li>
    </ul>
  `;
  const html = emailLayout({ locale, preheader: intro, bodyHtml: body });
  return { subject, html, text: htmlToText(html) };
}
