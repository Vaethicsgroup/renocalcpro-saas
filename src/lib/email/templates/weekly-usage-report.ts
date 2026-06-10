import { type Locale, t, emailLayout, ctaButton, htmlToText } from "./types";

export function weeklyUsageReport(locale: Locale, props: { reportsUsed: number; reportsLimit: number | null; weekStart: string }) {
  const limit = props.reportsLimit == null ? "∞" : String(props.reportsLimit);
  const subject = t({
    fr:`Votre activité semaine du ${props.weekStart}`,
    en:`Your activity — week of ${props.weekStart}`,
    es:`Su actividad — semana del ${props.weekStart}`,
    de:`Ihre Aktivität — Woche ${props.weekStart}`,
    pt:`A sua atividade — semana de ${props.weekStart}`,
  }, locale);
  const heading = t({
    fr:"Récap hebdo", en:"Weekly recap", es:"Resumen semanal", de:"Wochenübersicht", pt:"Resumo semanal",
  }, locale);
  const intro = t({
    fr:`Voici votre activité cette semaine : ${props.reportsUsed} rapport(s) générés sur ${limit} disponibles.`,
    en:`This week : ${props.reportsUsed} report(s) generated of ${limit} available.`,
    es:`Esta semana : ${props.reportsUsed} informes de ${limit} disponibles.`,
    de:`Diese Woche : ${props.reportsUsed} Berichte von ${limit} verfügbaren.`,
    pt:`Esta semana : ${props.reportsUsed} relatórios de ${limit} disponíveis.`,
  }, locale);
  const cta = t({ fr:"Voir le détail", en:"See details", es:"Ver detalle", de:"Details ansehen", pt:"Ver detalhe" }, locale);
  const body = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#115e59;">${heading}</h1>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">${intro}</p>
    <table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="background:#f5f5f4;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:32px;font-weight:700;color:#115e59;">${props.reportsUsed}</div>
          <div style="font-size:12px;color:#57534e;">${t({fr:"Rapports",en:"Reports",es:"Informes",de:"Berichte",pt:"Relatórios"},locale)}</div>
        </td>
      </tr>
    </table>
    ${ctaButton(cta, "/o/dashboard")}
  `;
  const html = emailLayout({ locale, preheader: intro, bodyHtml: body });
  return { subject, html, text: htmlToText(html) };
}
