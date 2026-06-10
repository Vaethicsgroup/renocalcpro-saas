// lib/email/templates/beta-accepted.ts
// Email envoyé à un candidat dont la candidature beta est acceptée.

import type { EmailTemplate } from "../types";

export interface BetaAcceptedProps {
  fullName: string;
  loginUrl: string;
  segment: string;
}

const T: Record<"fr" | "en" | "es" | "de" | "pt", { subject: string; greeting: string; intro: string; nda: string; perks: string[]; cta: string; signOff: string }> = {
  fr: {
    subject: "🎉 Bienvenue dans le programme Beta Réno·Calc Pro",
    greeting: "Bonjour",
    intro: "Excellente nouvelle ! Votre candidature au programme Beta tester a été acceptée. Vous bénéficiez maintenant d'un accès complet à Réno·Calc Pro Pro pendant 12 mois, ainsi qu'à toutes les fonctionnalités expérimentales.",
    nda: "En participant, vous vous engagez à ne pas partager publiquement les fonctionnalités non encore annoncées avant leur lancement officiel, et à donner du feedback honnête.",
    perks: [
      "Accès Pro complet 12 mois (valeur 1 549 €)",
      "Features bêta 2-3 semaines avant le public",
      "Statut Beta tester sur votre profil",
      "Crédit dans /changelog pour vos suggestions retenues",
    ],
    cta: "Activer mon compte beta",
    signOff: "L'équipe Réno·Calc Pro",
  },
  en: {
    subject: "🎉 Welcome to the Réno·Calc Pro Beta program",
    greeting: "Hello",
    intro: "Great news! Your application to the Beta tester program has been accepted. You now have full Pro access for 12 months and to all experimental features.",
    nda: "By participating, you commit to not publicly sharing unannounced features before their official launch, and to provide honest feedback.",
    perks: [
      "12 months full Pro access (€1,549 value)",
      "Beta features 2-3 weeks before public release",
      "Beta tester status on your profile",
      "Credit in /changelog for your retained suggestions",
    ],
    cta: "Activate my beta account",
    signOff: "The Réno·Calc Pro team",
  },
  es: {
    subject: "🎉 Bienvenido al programa Beta de Réno·Calc Pro",
    greeting: "Hola",
    intro: "¡Excelentes noticias! Su candidatura al programa Beta tester ha sido aceptada. Ahora dispone de acceso Pro completo durante 12 meses y a todas las funcionalidades experimentales.",
    nda: "Al participar, se compromete a no compartir públicamente las funcionalidades no anunciadas antes de su lanzamiento oficial, y a proporcionar comentarios honestos.",
    perks: [
      "12 meses de acceso Pro completo (valor 1 549 €)",
      "Funciones beta 2-3 semanas antes del lanzamiento público",
      "Estado de Beta tester en su perfil",
      "Crédito en /changelog para sus sugerencias retenidas",
    ],
    cta: "Activar mi cuenta beta",
    signOff: "El equipo de Réno·Calc Pro",
  },
  de: {
    subject: "🎉 Willkommen im Réno·Calc Pro Beta-Programm",
    greeting: "Hallo",
    intro: "Großartige Neuigkeiten! Ihre Bewerbung für das Beta-Tester-Programm wurde angenommen. Sie haben jetzt 12 Monate vollen Pro-Zugang und Zugriff auf alle experimentellen Funktionen.",
    nda: "Mit Ihrer Teilnahme verpflichten Sie sich, nicht angekündigte Funktionen vor ihrer offiziellen Veröffentlichung nicht öffentlich zu teilen und ehrliches Feedback zu geben.",
    perks: [
      "12 Monate voller Pro-Zugang (Wert 1 549 €)",
      "Beta-Funktionen 2-3 Wochen vor der öffentlichen Veröffentlichung",
      "Beta-Tester-Status in Ihrem Profil",
      "Erwähnung in /changelog für Ihre angenommenen Vorschläge",
    ],
    cta: "Mein Beta-Konto aktivieren",
    signOff: "Das Réno·Calc Pro Team",
  },
  pt: {
    subject: "🎉 Bem-vindo ao programa Beta Réno·Calc Pro",
    greeting: "Olá",
    intro: "Ótimas notícias! A sua candidatura ao programa Beta tester foi aceite. Agora tem acesso Pro completo durante 12 meses e a todas as funcionalidades experimentais.",
    nda: "Ao participar, compromete-se a não partilhar publicamente as funcionalidades ainda não anunciadas antes do seu lançamento oficial e a fornecer feedback honesto.",
    perks: [
      "12 meses de acesso Pro completo (valor 1 549 €)",
      "Funcionalidades beta 2-3 semanas antes do lançamento público",
      "Estatuto de Beta tester no seu perfil",
      "Crédito em /changelog para as suas sugestões retidas",
    ],
    cta: "Ativar a minha conta beta",
    signOff: "A equipa Réno·Calc Pro",
  },
};

export const betaAcceptedTemplate: EmailTemplate<BetaAcceptedProps> = {
  id: "beta-accepted",
  category: "engagement",
  render(props, locale = "fr") {
    const t = T[locale as keyof typeof T] ?? T.fr;
    const subject = t.subject;
    const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:32px 16px; color:#1c1917;">
  <h1 style="font-family: Georgia, serif; color:#0d9488; font-size:28px;">${t.subject}</h1>
  <p>${t.greeting} <strong>${props.fullName}</strong>,</p>
  <p>${t.intro}</p>
  <ul style="background:#f0fdfa; padding:16px 24px; border-radius:8px;">
    ${t.perks.map(p => `<li style="margin:6px 0;">${p}</li>`).join("")}
  </ul>
  <p style="background:#fef3c7; padding:12px; border-left:4px solid #f59e0b; font-size:14px;">${t.nda}</p>
  <p style="text-align:center; margin:32px 0;">
    <a href="${props.loginUrl}" style="background:#0d9488; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">${t.cta}</a>
  </p>
  <p style="color:#78716c; font-size:13px;">${t.signOff}<br>contact@renocalcpro.fr</p>
</body>
</html>
    `.trim();
    const text = `
${t.subject}

${t.greeting} ${props.fullName},

${t.intro}

${t.perks.map(p => `- ${p}`).join("\n")}

${t.nda}

${t.cta} : ${props.loginUrl}

${t.signOff}
contact@renocalcpro.fr
    `.trim();
    return { subject, html, text };
  },
};
