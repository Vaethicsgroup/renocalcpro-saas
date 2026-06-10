// lib/email/templates/beta-weekly-digest.ts
// Email hebdomadaire envoyé aux beta testers : feature de la semaine + question feedback.

import type { EmailTemplate } from "../types";

export interface BetaWeeklyDigestProps {
  fullName: string;
  weekNumber: number;
  featureTitle: string;
  featureDescription: string;
  featureUrl: string;
  feedbackQuestion: string;
  feedbackUrl: string;
  unsubscribeUrl: string;
}

const T = {
  fr: {
    subject: (p: BetaWeeklyDigestProps) => `📬 Beta Réno·Calc Pro — Semaine ${p.weekNumber} : ${p.featureTitle}`,
    body: (p: BetaWeeklyDigestProps) => `Bonjour ${p.fullName},

🆕 Nouvelle feature beta cette semaine :
─────────────────────────
${p.featureTitle}

${p.featureDescription}

👉 Tester maintenant : ${p.featureUrl}

💬 Question de la semaine
─────────────────────────
${p.feedbackQuestion}

Donner mon avis (2 min) : ${p.feedbackUrl}

Vos retours façonnent la roadmap. Merci !

L'équipe Réno·Calc Pro
contact@renocalcpro.fr

---
Se désabonner du digest hebdo : ${p.unsubscribeUrl}`,
  },
  en: {
    subject: (p: BetaWeeklyDigestProps) => `📬 Réno·Calc Pro Beta — Week ${p.weekNumber}: ${p.featureTitle}`,
    body: (p: BetaWeeklyDigestProps) => `Hello ${p.fullName},

🆕 New beta feature this week:
─────────────────────────
${p.featureTitle}

${p.featureDescription}

👉 Try it now: ${p.featureUrl}

💬 Question of the week
─────────────────────────
${p.feedbackQuestion}

Share your feedback (2 min): ${p.feedbackUrl}

Your feedback shapes the roadmap. Thank you!

The Réno·Calc Pro team
contact@renocalcpro.fr

---
Unsubscribe from weekly digest: ${p.unsubscribeUrl}`,
  },
  es: {
    subject: (p: BetaWeeklyDigestProps) => `📬 Beta Réno·Calc Pro — Semana ${p.weekNumber}: ${p.featureTitle}`,
    body: (p: BetaWeeklyDigestProps) => `Hola ${p.fullName},

🆕 Nueva funcionalidad beta esta semana:
─────────────────────────
${p.featureTitle}

${p.featureDescription}

👉 Probarla ahora: ${p.featureUrl}

💬 Pregunta de la semana
─────────────────────────
${p.feedbackQuestion}

Dar su opinión (2 min): ${p.feedbackUrl}

Sus comentarios dan forma a la hoja de ruta. ¡Gracias!

El equipo Réno·Calc Pro

---
Cancelar la suscripción al resumen semanal: ${p.unsubscribeUrl}`,
  },
  de: {
    subject: (p: BetaWeeklyDigestProps) => `📬 Réno·Calc Pro Beta — Woche ${p.weekNumber}: ${p.featureTitle}`,
    body: (p: BetaWeeklyDigestProps) => `Hallo ${p.fullName},

🆕 Neue Beta-Funktion diese Woche:
─────────────────────────
${p.featureTitle}

${p.featureDescription}

👉 Jetzt testen: ${p.featureUrl}

💬 Frage der Woche
─────────────────────────
${p.feedbackQuestion}

Feedback geben (2 Min): ${p.feedbackUrl}

Ihr Feedback prägt die Roadmap. Vielen Dank!

Das Réno·Calc Pro Team

---
Wöchentlichen Digest abbestellen: ${p.unsubscribeUrl}`,
  },
  pt: {
    subject: (p: BetaWeeklyDigestProps) => `📬 Beta Réno·Calc Pro — Semana ${p.weekNumber}: ${p.featureTitle}`,
    body: (p: BetaWeeklyDigestProps) => `Olá ${p.fullName},

🆕 Nova funcionalidade beta esta semana:
─────────────────────────
${p.featureTitle}

${p.featureDescription}

👉 Experimentar agora: ${p.featureUrl}

💬 Pergunta da semana
─────────────────────────
${p.feedbackQuestion}

Dar a sua opinião (2 min): ${p.feedbackUrl}

O seu feedback molda o roadmap. Obrigado!

A equipa Réno·Calc Pro

---
Cancelar a subscrição do resumo semanal: ${p.unsubscribeUrl}`,
  },
};

export const betaWeeklyDigestTemplate: EmailTemplate<BetaWeeklyDigestProps> = {
  id: "beta-weekly-digest",
  category: "engagement",
  render(props, locale = "fr") {
    const t = T[(locale as keyof typeof T)] ?? T.fr;
    const subject = t.subject(props);
    const text = t.body(props);
    const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:32px 16px; color:#1c1917;">
  <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 14px;">${text.replace(/</g, "&lt;")}</pre>
  <p style="text-align:center; margin: 24px 0;">
    <a href="${props.featureUrl}" style="background:#0d9488; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin-right:8px;">Tester la feature</a>
    <a href="${props.feedbackUrl}" style="background:#7c3aed; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Donner mon avis</a>
  </p>
</body>
</html>
    `.trim();
    return { subject, html, text };
  },
};
