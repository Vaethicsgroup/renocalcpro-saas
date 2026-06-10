// magic-link-login.ts
import { type Locale, t, emailLayout, ctaButton, htmlToText } from "./types";

export function magicLinkLogin(locale: Locale, props: { url: string; userEmail: string }) {
  const subject = t({
    fr: "Votre lien de connexion à Réno·Calc Pro",
    en: "Your sign-in link to Réno·Calc Pro",
    es: "Tu enlace de inicio de sesión",
    de: "Ihr Anmelde-Link",
    pt: "O seu link de início de sessão",
  }, locale);
  const heading = t({ fr:"Connexion", en:"Sign in", es:"Iniciar sesión", de:"Anmeldung", pt:"Iniciar sessão" }, locale);
  const intro = t({
    fr:"Cliquez sur le bouton ci-dessous pour vous connecter à votre compte. Le lien est valide 15 minutes.",
    en:"Click the button below to sign in. Link valid for 15 minutes.",
    es:"Haga clic en el botón para iniciar sesión. Enlace válido 15 minutos.",
    de:"Klicken Sie auf den Button, um sich anzumelden. Link 15 Minuten gültig.",
    pt:"Clique no botão para iniciar sessão. Link válido 15 minutos.",
  }, locale);
  const cta = t({ fr:"Se connecter", en:"Sign in", es:"Iniciar sesión", de:"Anmelden", pt:"Iniciar sessão" }, locale);
  const safety = t({
    fr:"Si vous n'avez pas demandé cette connexion, ignorez cet email.",
    en:"If you didn't request this, ignore this email.",
    es:"Si no solicitó este inicio, ignore este correo.",
    de:"Falls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail.",
    pt:"Se não pediu este início de sessão, ignore este e-mail.",
  }, locale);

  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#115e59;">${heading}</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">${intro}</p>
    ${ctaButton(cta, props.url)}
    <p style="margin:16px 0 0;font-size:13px;color:#57534e;">${safety}</p>
    <p style="margin:24px 0 0;font-size:12px;color:#a8a29e;word-break:break-all;">${props.url}</p>
  `;
  const html = emailLayout({ locale, preheader: subject, bodyHtml: body });
  return { subject, html, text: htmlToText(html) };
}
