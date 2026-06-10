// app/api/cron/assistant-weekly-recap/route.ts
// Cron hebdo (lundi 9h) — envoie aux admins Pro un récap usage assistant IA :
// helpful rate, top contextes utilisés, suggestions formation équipe.
//
// Sécurisé X-Cron-Secret. Best effort par org : un échec n'arrête pas les autres.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/send";

interface OrgRecap {
  organizationId: string;
  orgName: string;
  adminEmails: string[];
  totalConvs: number;
  totalMessages: number;
  helpfulYes: number;
  helpfulNo: number;
  helpfulRatePct: number;
  topContexts: Array<{ contextType: string; count: number }>;
  topFields: Array<{ contextRef: string; count: number }>;
  guardsSummary: Array<{ guard: string; count: number }>;
}

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SHARED_SECRET || secret !== process.env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  // Lister les orgs ayant eu de l'activité assistant cette semaine
  const orgsActive = await prisma.assistantConversation.groupBy({
    by: ["organizationId"],
    where: { createdAt: { gte: since }, deletedAt: null },
    _count: { _all: true },
  });

  const results: Array<{ orgId: string; sent: boolean; error?: string }> = [];

  for (const orgGroup of orgsActive) {
    const orgId = orgGroup.organizationId;
    try {
      const recap = await buildOrgRecap(orgId, since);
      if (recap.adminEmails.length === 0) {
        results.push({ orgId, sent: false, error: "no_admin_email" });
        continue;
      }
      await sendRecapEmail(recap);
      results.push({ orgId, sent: true });
    } catch (e) {
      results.push({ orgId, sent: false, error: (e as Error).message });
    }
  }

  console.log(JSON.stringify({
    event: "assistant_weekly_recap_completed",
    period: "7 days",
    orgsTargeted: orgsActive.length,
    sent: results.filter(r => r.sent).length,
    failed: results.filter(r => !r.sent).length,
    timestamp: new Date().toISOString(),
  }));

  return NextResponse.json({
    ok: true,
    orgsTargeted: orgsActive.length,
    results,
  });
}

async function buildOrgRecap(organizationId: string, since: Date): Promise<OrgRecap> {
  const [org, admins, convs, msgs, feedbacks] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, slug: true },
    }),
    prisma.membership.findMany({
      where: { organizationId, role: { in: ["OWNER", "ADMIN"] } },
      include: { user: { select: { email: true } } },
    }),
    prisma.assistantConversation.findMany({
      where: { organizationId, createdAt: { gte: since } },
      select: { contextType: true, contextRef: true },
    }),
    prisma.assistantMessage.findMany({
      where: { conversation: { organizationId }, role: "ASSISTANT", createdAt: { gte: since } },
      select: { guardsTriggered: true },
    }),
    prisma.assistantFeedback.findMany({
      where: { conversation: { organizationId }, createdAt: { gte: since } },
      select: { helpful: true },
    }),
  ]);

  const helpfulYes = feedbacks.filter(f => f.helpful === true).length;
  const helpfulNo = feedbacks.filter(f => f.helpful === false).length;
  const helpfulRatePct = helpfulYes + helpfulNo > 0
    ? (helpfulYes / (helpfulYes + helpfulNo)) * 100
    : 0;

  // Aggregate top contexts
  const ctxCount = new Map<string, number>();
  const fieldCount = new Map<string, number>();
  for (const c of convs) {
    ctxCount.set(c.contextType, (ctxCount.get(c.contextType) ?? 0) + 1);
    if (c.contextRef) {
      fieldCount.set(c.contextRef, (fieldCount.get(c.contextRef) ?? 0) + 1);
    }
  }
  const topContexts = [...ctxCount.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([contextType, count]) => ({ contextType, count }));
  const topFields = [...fieldCount.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([contextRef, count]) => ({ contextRef, count }));

  const guardCount = new Map<string, number>();
  for (const m of msgs) for (const g of m.guardsTriggered ?? []) {
    guardCount.set(g, (guardCount.get(g) ?? 0) + 1);
  }
  const guardsSummary = [...guardCount.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([guard, count]) => ({ guard, count }));

  return {
    organizationId,
    orgName: org?.name ?? "(inconnue)",
    adminEmails: admins.map(a => a.user.email).filter(Boolean),
    totalConvs: convs.length,
    totalMessages: msgs.length,
    helpfulYes,
    helpfulNo,
    helpfulRatePct,
    topContexts,
    topFields,
    guardsSummary,
  };
}

async function sendRecapEmail(recap: OrgRecap): Promise<void> {
  const helpfulEmoji = recap.helpfulRatePct >= 70 ? "✅" : recap.helpfulRatePct >= 50 ? "⚠️" : "🚨";
  const subject = `📊 Récap hebdo Assistant IA — ${recap.orgName}`;

  const html = `
<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: system-ui, sans-serif; color: #292524; max-width: 640px; margin: 24px auto; padding: 0 16px;">
  <h1 style="font-size: 22px; color: #115e59;">📊 Récap Assistant IA — semaine écoulée</h1>
  <p>Bonjour, voici le récap d'usage de l'assistant IA métier pour <strong>${escapeHtml(recap.orgName)}</strong> sur les 7 derniers jours.</p>

  <h2 style="font-size: 16px; margin-top: 24px;">Métriques clés</h2>
  <ul>
    <li><strong>${recap.totalConvs}</strong> conversations démarrées</li>
    <li><strong>${recap.totalMessages}</strong> réponses assistant générées</li>
    <li>${helpfulEmoji} <strong>${recap.helpfulRatePct.toFixed(0)}%</strong> helpful rate (${recap.helpfulYes} 👍 vs ${recap.helpfulNo} 👎)</li>
  </ul>

  ${recap.topContexts.length > 0 ? `
  <h2 style="font-size: 16px; margin-top: 24px;">Top contextes utilisés</h2>
  <ul>${recap.topContexts.map(c => `<li><code>${escapeHtml(c.contextType)}</code> — ${c.count} fois</li>`).join("")}</ul>
  ` : ""}

  ${recap.topFields.length > 0 ? `
  <h2 style="font-size: 16px; margin-top: 24px;">Top champs/sections demandés</h2>
  <ul>${recap.topFields.map(f => `<li><code>${escapeHtml(f.contextRef)}</code> — ${f.count} demandes</li>`).join("")}</ul>
  ` : ""}

  ${recap.guardsSummary.length > 0 ? `
  <h2 style="font-size: 16px; margin-top: 24px;">Garde-fous déclenchés</h2>
  <ul>${recap.guardsSummary.map(g => `<li><code>${escapeHtml(g.guard)}</code> : ${g.count} fois</li>`).join("")}</ul>
  ` : ""}

  <h2 style="font-size: 16px; margin-top: 24px;">Suggestions</h2>
  <ul>
    ${recap.helpfulRatePct < 50 ? "<li>⚠️ Helpful rate faible — envisagez une formation équipe sur l'usage de l'assistant.</li>" : ""}
    ${recap.topFields.length > 0 ? `<li>Formez votre équipe sur le champ <code>${escapeHtml(recap.topFields[0].contextRef)}</code>, le plus consulté.</li>` : ""}
    <li>Consultez l'historique complet : <a href="https://renocalcpro.fr/fr/o/ai-assistant" style="color: #115e59;">renocalcpro.fr/fr/o/ai-assistant</a></li>
  </ul>

  <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;">
  <p style="font-size: 12px; color: #78716c;">
    Vous recevez cet email en tant qu'administrateur de l'organisation. Pour vous désabonner des récaps,
    rendez-vous dans <a href="https://renocalcpro.fr/fr/o/settings">Paramètres</a>.
  </p>
</body></html>
  `.trim();

  for (const email of recap.adminEmails) {
    await sendEmail({
      to: email,
      subject,
      html,
      tags: { type: "assistant_weekly_recap", orgId: recap.organizationId },
    }).catch(err => {
      console.error(`[recap] envoi à ${email} échoué:`, err);
    });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
}
