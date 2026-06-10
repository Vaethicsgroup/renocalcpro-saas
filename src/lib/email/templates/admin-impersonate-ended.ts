// lib/email/templates/admin-impersonate-ended.ts
// Notification au user à la fin d'une session d'impersonification.

import type { EmailTemplate } from "../types";

export interface AdminImpersonateEndedProps {
  userName: string;
  adminEmail: string;
  startedAt: Date;
  endedAt: Date;
  durationMin: number;
  actionsCount: number;
  auditLogUrl: string;
  reportAbuseUrl: string;
}

const T = {
  fr: {
    subject: "🎭 Session de support terminée",
    body: (p: AdminImpersonateEndedProps) => `Bonjour ${p.userName},

La session de support de ${p.adminEmail} s'est terminée.

📋 Récapitulatif
─────────────────────────
• Démarrée : ${p.startedAt.toLocaleString("fr-FR")}
• Terminée : ${p.endedAt.toLocaleString("fr-FR")}
• Durée : ${p.durationMin} minute(s)
• Actions effectuées : ${p.actionsCount}

📜 Consulter le détail des actions :
${p.auditLogUrl}

⚠ Constatez-vous une anomalie ? Signalez :
${p.reportAbuseUrl}

L'équipe Réno·Calc Pro`,
  },
  en: {
    subject: "🎭 Support session ended",
    body: (p: AdminImpersonateEndedProps) => `Hello ${p.userName},

The support session by ${p.adminEmail} has ended.

📋 Summary
─────────────────────────
• Started: ${p.startedAt.toLocaleString("en-GB")}
• Ended: ${p.endedAt.toLocaleString("en-GB")}
• Duration: ${p.durationMin} minute(s)
• Actions performed: ${p.actionsCount}

📜 View action details:
${p.auditLogUrl}

⚠ Notice anything wrong? Report:
${p.reportAbuseUrl}

The Réno·Calc Pro team`,
  },
  es: {
    subject: "🎭 Sesión de soporte finalizada",
    body: (p: AdminImpersonateEndedProps) => `Hola ${p.userName},

La sesión de soporte de ${p.adminEmail} ha finalizado.

📋 Resumen
─────────────────────────
• Iniciada: ${p.startedAt.toLocaleString("es-ES")}
• Finalizada: ${p.endedAt.toLocaleString("es-ES")}
• Duración: ${p.durationMin} minuto(s)
• Acciones realizadas: ${p.actionsCount}

📜 Ver el detalle de las acciones:
${p.auditLogUrl}

⚠ ¿Observa alguna anomalía? Repórtela:
${p.reportAbuseUrl}

El equipo de Réno·Calc Pro`,
  },
  de: {
    subject: "🎭 Support-Sitzung beendet",
    body: (p: AdminImpersonateEndedProps) => `Hallo ${p.userName},

Die Support-Sitzung von ${p.adminEmail} ist beendet.

📋 Zusammenfassung
─────────────────────────
• Gestartet: ${p.startedAt.toLocaleString("de-DE")}
• Beendet: ${p.endedAt.toLocaleString("de-DE")}
• Dauer: ${p.durationMin} Minute(n)
• Durchgeführte Aktionen: ${p.actionsCount}

📜 Detail der Aktionen einsehen:
${p.auditLogUrl}

⚠ Bemerken Sie eine Anomalie? Melden:
${p.reportAbuseUrl}

Das Réno·Calc Pro Team`,
  },
  pt: {
    subject: "🎭 Sessão de suporte terminada",
    body: (p: AdminImpersonateEndedProps) => `Olá ${p.userName},

A sessão de suporte de ${p.adminEmail} terminou.

📋 Resumo
─────────────────────────
• Iniciada: ${p.startedAt.toLocaleString("pt-PT")}
• Terminada: ${p.endedAt.toLocaleString("pt-PT")}
• Duração: ${p.durationMin} minuto(s)
• Ações realizadas: ${p.actionsCount}

📜 Ver o detalhe das ações:
${p.auditLogUrl}

⚠ Constata alguma anomalia? Reporte:
${p.reportAbuseUrl}

A equipa Réno·Calc Pro`,
  },
};

export const adminImpersonateEndedTemplate: EmailTemplate<AdminImpersonateEndedProps> = {
  id: "admin-impersonate-ended",
  category: "auth",
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
</body>
</html>
    `.trim();
    return { subject, html, text };
  },
};
