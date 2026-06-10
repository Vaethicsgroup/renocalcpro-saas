// app/api/cron/assistant-monthly-admin-recap/route.ts
// Cron mensuel (1er du mois 09:00) — envoie aux admins systèmes (Réno·Calc Pro)
// un récap d'usage GLOBAL cross-org : tendances, alertes, top orgs, comparaison vs M-1.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/send";

const ADMIN_EMAILS = (process.env.ASSISTANT_GLOBAL_ADMIN_EMAILS ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export async function GET(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (ADMIN_EMAILS.length === 0) {
    return NextResponse.json({ error: "no_admin_emails_configured", env: "ASSISTANT_GLOBAL_ADMIN_EMAILS" }, { status: 400 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prevMonthEnd = monthStart;

  // Stats mois N-1
  const [convsM, msgsM, fbM, topOrgs, guardsM] = await Promise.all([
    prisma.assistantConversation.count({ where: { createdAt: { gte: monthStart, lt: monthEnd }, deletedAt: null } }),
    prisma.assistantMessage.count({ where: { createdAt: { gte: monthStart, lt: monthEnd }, role: "ASSISTANT" } }),
    prisma.assistantFeedback.findMany({ where: { createdAt: { gte: monthStart, lt: monthEnd } }, select: { helpful: true } }),
    prisma.assistantConversation.groupBy({
      by: ["organizationId"],
      where: { createdAt: { gte: monthStart, lt: monthEnd }, deletedAt: null },
      _count: { _all: true },
      orderBy: { _count: { organizationId: "desc" } },
      take: 5,
    }),
    prisma.assistantMessage.findMany({
      where: { createdAt: { gte: monthStart, lt: monthEnd }, role: "ASSISTANT" },
      select: { guardsTriggered: true, tokensUsed: true },
    }),
  ]);

  // Stats mois N-2 pour comparaison
  const [convsPrev, msgsPrev, fbPrev] = await Promise.all([
    prisma.assistantConversation.count({ where: { createdAt: { gte: prevMonthStart, lt: prevMonthEnd }, deletedAt: null } }),
    prisma.assistantMessage.count({ where: { createdAt: { gte: prevMonthStart, lt: prevMonthEnd }, role: "ASSISTANT" } }),
    prisma.assistantFeedback.findMany({ where: { createdAt: { gte: prevMonthStart, lt: prevMonthEnd } }, select: { helpful: true } }),
  ]);

  const helpfulYes = fbM.filter(f => f.helpful === true).length;
  const helpfulNo = fbM.filter(f => f.helpful === false).length;
  const helpfulRate = helpfulYes + helpfulNo > 0 ? (helpfulYes / (helpfulYes + helpfulNo)) * 100 : 0;
  const prevHelpfulYes = fbPrev.filter(f => f.helpful === true).length;
  const prevHelpfulNo = fbPrev.filter(f => f.helpful === false).length;
  const prevHelpfulRate = prevHelpfulYes + prevHelpfulNo > 0 ? (prevHelpfulYes / (prevHelpfulYes + prevHelpfulNo)) * 100 : 0;

  const totalTokens = guardsM.reduce((s, m) => s + (m.tokensUsed ?? 0), 0);
  const guardCount = new Map<string, number>();
  for (const m of guardsM) for (const g of m.guardsTriggered ?? []) {
    guardCount.set(g, (guardCount.get(g) ?? 0) + 1);
  }
  const topGuards = [...guardCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Récupérer noms des top orgs
  const orgNames = await prisma.organization.findMany({
    where: { id: { in: topOrgs.map(o => o.organizationId) } },
    select: { id: true, name: true, slug: true },
  });
  const nameMap = Object.fromEntries(orgNames.map(o => [o.id, o.name]));

  // Alertes
  const alerts: string[] = [];
  if (helpfulRate < 50) alerts.push(`🚨 Helpful rate global faible (${helpfulRate.toFixed(0)} %) — investiguer prompts ou knowledge`);
  if (helpfulRate < prevHelpfulRate - 10) alerts.push(`📉 Helpful rate en chute vs M-1 (${prevHelpfulRate.toFixed(0)} % → ${helpfulRate.toFixed(0)} %)`);
  const degradedCount = guardCount.get("degraded_mode_no_llm") ?? 0;
  if (degradedCount > 50) alerts.push(`⚠ Mode dégradé déclenché ${degradedCount} fois — vérifier disponibilité LLM`);

  const monthLabel = monthStart.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const subject = `📊 Récap MENSUEL Assistant IA — ${monthLabel}`;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: system-ui, sans-serif; color: #292524; max-width: 720px; margin: 24px auto; padding: 0 16px;">
  <h1 style="font-size: 22px; color: #115e59;">📊 Récap mensuel Assistant IA — ${monthLabel}</h1>
  <p>Vue d'ensemble cross-organisations.</p>

  ${alerts.length > 0 ? `
  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0;">
    <strong style="color: #991b1b;">Alertes :</strong>
    <ul style="margin: 8px 0 0 0;">
      ${alerts.map(a => `<li>${a}</li>`).join("")}
    </ul>
  </div>` : ""}

  <h2 style="font-size: 16px; margin-top: 24px;">Volume global</h2>
  <table style="border-collapse: collapse; width: 100%;">
    <tr style="background: #f5f5f4;">
      <th style="text-align: left; padding: 8px; border: 1px solid #e7e5e4;">Métrique</th>
      <th style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">Mois N-1</th>
      <th style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">Mois N-2</th>
      <th style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">Évolution</th>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e7e5e4;">Conversations</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${convsM}</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${convsPrev}</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${formatDelta(convsM - convsPrev)}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e7e5e4;">Messages assistant</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${msgsM}</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${msgsPrev}</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${formatDelta(msgsM - msgsPrev)}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e7e5e4;">Helpful rate</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${helpfulRate.toFixed(0)} %</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${prevHelpfulRate.toFixed(0)} %</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${formatDelta(helpfulRate - prevHelpfulRate, true)}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #e7e5e4;">Tokens consommés</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">${totalTokens.toLocaleString("fr-FR")}</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">—</td>
      <td style="text-align: right; padding: 8px; border: 1px solid #e7e5e4;">—</td>
    </tr>
  </table>

  <h2 style="font-size: 16px; margin-top: 24px;">Top organisations utilisatrices</h2>
  <ol>
    ${topOrgs.map(o => `<li>${escapeHtml(nameMap[o.organizationId] ?? "(inconnue)")} — <strong>${o._count._all}</strong> conversations</li>`).join("")}
  </ol>

  ${topGuards.length > 0 ? `
  <h2 style="font-size: 16px; margin-top: 24px;">Top garde-fous déclenchés</h2>
  <ul>${topGuards.map(([g, c]) => `<li><code>${escapeHtml(g)}</code> : ${c} fois</li>`).join("")}</ul>
  ` : ""}

  <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 32px 0;">
  <p style="font-size: 12px; color: #78716c;">
    Récap envoyé aux administrateurs systèmes Réno·Calc Pro. Configuration : <code>ASSISTANT_GLOBAL_ADMIN_EMAILS</code>.
    Dashboard temps réel : <a href="https://renocalcpro.fr/fr/admin/ai-assistant" style="color: #115e59;">/admin/ai-assistant</a>.
  </p>
</body></html>`;

  const results = [];
  for (const email of ADMIN_EMAILS) {
    try {
      await sendEmail({ to: email, subject, html, tags: { type: "assistant_monthly_admin_recap" } });
      results.push({ email, sent: true });
    } catch (e) {
      results.push({ email, sent: false, error: (e as Error).message });
    }
  }

  console.log(JSON.stringify({
    event: "assistant_monthly_admin_recap_sent",
    monthLabel,
    convsM, msgsM, helpfulRate, alertsCount: alerts.length,
    sentCount: results.filter(r => r.sent).length,
  }));

  return NextResponse.json({ ok: true, period: monthLabel, results, alerts });
}

function formatDelta(delta: number, isPercent = false): string {
  if (delta === 0) return "→ 0";
  const sign = delta > 0 ? "↑ +" : "↓ ";
  const value = isPercent ? `${delta.toFixed(0)} pts` : delta.toLocaleString("fr-FR");
  const color = delta > 0 ? "#15803d" : "#b91c1c";
  return `<span style="color: ${color}; font-weight: 600;">${sign}${value}</span>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
}
