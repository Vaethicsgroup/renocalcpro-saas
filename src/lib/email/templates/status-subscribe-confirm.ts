// lib/email/templates/status-subscribe-confirm.ts
// Email envoyé après inscription au status email pour confirmer l'adresse (double opt-in RGPD).

import type { EmailTemplate } from "../types";

export interface StatusSubscribeConfirmProps {
  email: string;
  confirmUrl: string;
  unsubscribeUrl: string;
}

const T = {
  fr: {
    subject: "✅ Confirmez votre abonnement aux notifications Réno·Calc Pro",
    body: (p: StatusSubscribeConfirmProps) => `Bonjour,

Vous avez demandé à recevoir les notifications d'incidents et de maintenance pour Réno·Calc Pro.

Pour confirmer votre abonnement (RGPD double opt-in obligatoire), cliquez sur le lien ci-dessous :

${p.confirmUrl}

Le lien est valable 7 jours.

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message — votre adresse ne sera pas ajoutée.

Pour vous désabonner à tout moment :
${p.unsubscribeUrl}

L'équipe Réno·Calc Pro
status.renocalcpro.fr`,
  },
  en: {
    subject: "✅ Confirm your Réno·Calc Pro status notifications subscription",
    body: (p: StatusSubscribeConfirmProps) => `Hello,

You requested to receive incident and maintenance notifications for Réno·Calc Pro.

To confirm your subscription (GDPR double opt-in required), click the link below:

${p.confirmUrl}

The link is valid for 7 days.

If you didn't request this, please ignore this message — your address will not be added.

To unsubscribe at any time:
${p.unsubscribeUrl}

The Réno·Calc Pro team
status.renocalcpro.fr`,
  },
  es: {
    subject: "✅ Confirme su suscripción a las notificaciones de Réno·Calc Pro",
    body: (p: StatusSubscribeConfirmProps) => `Hola,

Ha solicitado recibir notificaciones de incidentes y mantenimiento de Réno·Calc Pro.

Para confirmar su suscripción (RGPD doble opt-in obligatorio), haga clic en el enlace:

${p.confirmUrl}

El enlace es válido durante 7 días.

Si no realizó esta solicitud, ignore este mensaje — su dirección no se añadirá.

Para darse de baja en cualquier momento:
${p.unsubscribeUrl}

El equipo Réno·Calc Pro`,
  },
  de: {
    subject: "✅ Bestätigen Sie Ihr Abonnement der Réno·Calc Pro-Benachrichtigungen",
    body: (p: StatusSubscribeConfirmProps) => `Hallo,

Sie haben angefragt, Benachrichtigungen über Vorfälle und Wartungen von Réno·Calc Pro zu erhalten.

Um Ihr Abonnement zu bestätigen (DSGVO Double Opt-In erforderlich), klicken Sie auf den Link:

${p.confirmUrl}

Der Link ist 7 Tage gültig.

Falls Sie dies nicht angefragt haben, ignorieren Sie diese Nachricht — Ihre Adresse wird nicht hinzugefügt.

Jederzeit abmelden:
${p.unsubscribeUrl}

Das Réno·Calc Pro Team`,
  },
  pt: {
    subject: "✅ Confirme a sua subscrição às notificações Réno·Calc Pro",
    body: (p: StatusSubscribeConfirmProps) => `Olá,

Solicitou receber notificações de incidentes e manutenção do Réno·Calc Pro.

Para confirmar a sua subscrição (RGPD double opt-in obrigatório), clique no link:

${p.confirmUrl}

O link é válido durante 7 dias.

Se não solicitou isto, ignore esta mensagem — o seu endereço não será adicionado.

Para se desinscrever a qualquer momento:
${p.unsubscribeUrl}

A equipa Réno·Calc Pro`,
  },
};

export const statusSubscribeConfirmTemplate: EmailTemplate<StatusSubscribeConfirmProps> = {
  id: "status-subscribe-confirm",
  category: "engagement",
  render(props, locale = "fr") {
    const t = T[(locale as keyof typeof T)] ?? T.fr;
    const text = t.body(props);
    const subject = t.subject;
    const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; padding:32px 16px; color:#1c1917;">
  <pre style="white-space: pre-wrap; word-wrap: break-word; font-family: inherit;">${text.replace(/</g, "&lt;")}</pre>
  <p style="text-align:center; margin:24px 0;">
    <a href="${props.confirmUrl}" style="background:#0d9488; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Confirmer mon abonnement</a>
  </p>
</body>
</html>
    `.trim();
    return { subject, html, text };
  },
};
