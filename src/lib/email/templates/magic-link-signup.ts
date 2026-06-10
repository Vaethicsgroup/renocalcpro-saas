import { type Locale, t, emailLayout, ctaButton, htmlToText } from "./types";

export function magicLinkSignup(locale: Locale, props: { url: string; userEmail: string }) {
  const subject = t({
    fr:"Confirmez votre inscription Réno·Calc Pro",
    en:"Confirm your Réno·Calc Pro signup",
    es:"Confirme su registro",
    de:"Bestätigen Sie Ihre Registrierung",
    pt:"Confirme o seu registo",
  }, locale);
  const heading = t({ fr:"Bienvenue !", en:"Welcome!", es:"¡Bienvenido!", de:"Willkommen!", pt:"Bem-vindo!" }, locale);
  const intro = t({
    fr:"Pour finaliser la création de votre compte, cliquez sur le bouton ci-dessous (lien valable 15 minutes).",
    en:"To finalize your account, click the button below (link valid 15 min).",
    es:"Para finalizar su cuenta, haga clic abajo (enlace 15 min).",
    de:"Klicken Sie zur Bestätigung auf den Button (15 Min. gültig).",
    pt:"Para finalizar a conta, clique abaixo (link 15 min).",
  }, locale);
  const cta = t({ fr:"Créer mon compte", en:"Create my account", es:"Crear mi cuenta", de:"Konto erstellen", pt:"Criar conta" }, locale);
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#115e59;">${heading}</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">${intro}</p>
    ${ctaButton(cta, props.url)}
  `;
  const html = emailLayout({ locale, preheader: subject, bodyHtml: body });
  return { subject, html, text: htmlToText(html) };
}
