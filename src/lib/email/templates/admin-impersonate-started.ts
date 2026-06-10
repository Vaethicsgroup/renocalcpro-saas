// lib/email/templates/admin-impersonate-started.ts
// Notification au user quand un admin Réno·Calc commence une session d'impersonification.
// Renforce la confiance : transparence totale + audit immédiat.

import type { EmailTemplate } from "../types";

export interface AdminImpersonateStartedProps {
  userName: string;
  adminEmail: string;
  startedAt: Date;
  ipAddress: string | null;
  expiresAt: Date;
  reason: string;
  reportAbuseUrl: string;
}

const T = {
  fr: {
    subject: "🎭 Une session de support a démarré sur votre compte",
    body: (p: AdminImpersonateStartedProps) => `Bonjour ${p.userName},

Pour des raisons de **transparence et de conformité RGPD**, nous vous informons qu'un membre de l'équipe support Réno·Calc Pro a démarré une session sur votre compte à votre demande ou pour résoudre un problème technique.

📋 Détails de la session
─────────────────────────
• Membre support : ${p.adminEmail}
• Démarrée le : ${p.startedAt.toLocaleString("fr-FR")}
• IP du support : ${p.ipAddress ?? "non disponible"}
• Expire automatiquement le : ${p.expiresAt.toLocaleString("fr-FR")}
• Motif : "${p.reason}"

🔒 Garanties
• Toutes les actions sont auditées et tracées dans nos logs internes
• Aucune action irréversible (suppression, paiement, etc.) ne sera effectuée
• La session expire automatiquement après 1 heure
• Un email vous sera envoyé à la fin de la session

⚠ Vous n'avez pas demandé cette session ? Signalez immédiatement :
${p.reportAbuseUrl}

L'équipe Réno·Calc Pro
contact@renocalcpro.fr`,
  },
  en: {
    subject: "🎭 A support session has started on your account",
    body: (p: AdminImpersonateStartedProps) => `Hello ${p.userName},

For **transparency and GDPR compliance**, we inform you that a Réno·Calc Pro support team member has started a session on your account at your request or to resolve a technical issue.

📋 Session details
─────────────────────────
• Support member: ${p.adminEmail}
• Started at: ${p.startedAt.toLocaleString("en-GB")}
• Support IP: ${p.ipAddress ?? "not available"}
• Auto-expires at: ${p.expiresAt.toLocaleString("en-GB")}
• Reason: "${p.reason}"

🔒 Guarantees
• All actions are audited and tracked in our internal logs
• No irreversible actions (deletion, payment, etc.) will be performed
• The session auto-expires after 1 hour
• You will receive an email when the session ends

⚠ Did you NOT request this session? Report immediately:
${p.reportAbuseUrl}

The Réno·Calc Pro team
contact@renocalcpro.fr`,
  },
  es: {
    subject: "🎭 Una sesión de soporte ha comenzado en su cuenta",
    body: (p: AdminImpersonateStartedProps) => `Hola ${p.userName},

Por motivos de **transparencia y cumplimiento RGPD**, le informamos que un miembro del equipo de soporte de Réno·Calc Pro ha iniciado una sesión en su cuenta a petición suya o para resolver un problema técnico.

📋 Detalles de la sesión
─────────────────────────
• Miembro de soporte: ${p.adminEmail}
• Iniciada el: ${p.startedAt.toLocaleString("es-ES")}
• IP del soporte: ${p.ipAddress ?? "no disponible"}
• Expira automáticamente el: ${p.expiresAt.toLocaleString("es-ES")}
• Motivo: "${p.reason}"

🔒 Garantías
• Todas las acciones se auditan y rastrean en nuestros registros internos
• No se realizará ninguna acción irreversible
• La sesión expira automáticamente después de 1 hora
• Recibirá un correo al final de la sesión

⚠ ¿No solicitó esta sesión? Repórtelo inmediatamente:
${p.reportAbuseUrl}

El equipo de Réno·Calc Pro
contact@renocalcpro.fr`,
  },
  de: {
    subject: "🎭 Eine Support-Sitzung wurde auf Ihrem Konto gestartet",
    body: (p: AdminImpersonateStartedProps) => `Hallo ${p.userName},

Zur **Transparenz und DSGVO-Konformität** informieren wir Sie, dass ein Mitglied des Réno·Calc Pro Support-Teams auf Ihre Anfrage oder zur Lösung eines technischen Problems eine Sitzung auf Ihrem Konto gestartet hat.

📋 Sitzungsdetails
─────────────────────────
• Support-Mitglied: ${p.adminEmail}
• Gestartet am: ${p.startedAt.toLocaleString("de-DE")}
• Support-IP: ${p.ipAddress ?? "nicht verfügbar"}
• Läuft automatisch ab am: ${p.expiresAt.toLocaleString("de-DE")}
• Grund: "${p.reason}"

🔒 Garantien
• Alle Aktionen werden in unseren internen Protokollen geprüft und verfolgt
• Keine irreversiblen Aktionen werden ausgeführt
• Die Sitzung läuft automatisch nach 1 Stunde ab
• Sie erhalten eine E-Mail am Ende der Sitzung

⚠ Haben Sie diese Sitzung NICHT angefordert? Melden Sie es sofort:
${p.reportAbuseUrl}

Das Réno·Calc Pro Team
contact@renocalcpro.fr`,
  },
  pt: {
    subject: "🎭 Uma sessão de suporte foi iniciada na sua conta",
    body: (p: AdminImpersonateStartedProps) => `Olá ${p.userName},

Por motivos de **transparência e conformidade RGPD**, informamos que um membro da equipa de suporte Réno·Calc Pro iniciou uma sessão na sua conta a seu pedido ou para resolver um problema técnico.

📋 Detalhes da sessão
─────────────────────────
• Membro do suporte: ${p.adminEmail}
• Iniciada em: ${p.startedAt.toLocaleString("pt-PT")}
• IP do suporte: ${p.ipAddress ?? "não disponível"}
• Expira automaticamente em: ${p.expiresAt.toLocaleString("pt-PT")}
• Motivo: "${p.reason}"

🔒 Garantias
• Todas as ações são auditadas e rastreadas nos nossos registos internos
• Nenhuma ação irreversível será executada
• A sessão expira automaticamente após 1 hora
• Receberá um e-mail no final da sessão

⚠ Não solicitou esta sessão? Reporte imediatamente:
${p.reportAbuseUrl}

A equipa Réno·Calc Pro
contact@renocalcpro.fr`,
  },
};

export const adminImpersonateStartedTemplate: EmailTemplate<AdminImpersonateStartedProps> = {
  id: "admin-impersonate-started",
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
