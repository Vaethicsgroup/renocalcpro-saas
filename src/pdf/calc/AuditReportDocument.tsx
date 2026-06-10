// src/pdf/calc/AuditReportDocument.tsx — v5.0 (fix définitif React #31)
//
// Causes possibles de React error #31 dans @react-pdf/renderer et fix appliqué :
//
//  1. Style array contenant false/null/undefined
//     → helper mergeStyles() qui filtre strictement (typeof === "object" && truthy).
//
//  2. Composant React (View) rendu en enfant de <Text>
//     → toutes les valeurs interpolées dans <Text> sont des STRINGS via
//       String() ou template literal pré-calculé dans une const.
//     → AUCUN composant (DpeBadgeView, Bar, Kpi) n'apparaît dans un <Text>.
//
//  3. <Text render={fn}> retournant un élément React
//     → on n'utilise pas la prop `render`. Footer = <Text> avec children string.
//
//  4. .map() sur tableau potentiellement undefined
//     → toutes les sources de .map() sont (x ?? []).
//
//  5. Propriétés texte (fontSize, color, fontStyle) sur un <View>
//     → disclaimerBox (View) ne porte plus que du layout. Le texte porte
//       disclaimerText.
//
//  6. Valeur dynamique non-string en enfant direct
//     → toutes les valeurs sont passées par String() ou format helper.

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ProjectResultRich } from "@/lib/calc/result/consolidate-rich";
import { styles, COLORS, DPE_COLORS, formatEur, formatNum } from "./theme";

// ─────────────────── HELPERS ───────────────────

type StyleInput = Style | false | null | undefined;
function mergeStyles(...parts: StyleInput[]): Style[] {
  const out: Style[] = [];
  for (const p of parts) {
    if (p && typeof p === "object") out.push(p as Style);
  }
  return out;
}

function safeStr(x: unknown): string {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number" || typeof x === "boolean") return String(x);
  return String(x);
}

function safeArr<T>(x: T[] | null | undefined): T[] {
  return Array.isArray(x) ? x : [];
}

function safeDpe(label: unknown): "A"|"B"|"C"|"D"|"E"|"F"|"G" {
  const v = safeStr(label).toUpperCase();
  if (v === "A" || v === "B" || v === "C" || v === "D" || v === "E" || v === "F" || v === "G") return v;
  return "G";
}

// ─────────────────── PRIMITIVES (toutes retournent View, jamais Text-children) ───────────────────

function DpeBadgeView({ label }: { label: "A"|"B"|"C"|"D"|"E"|"F"|"G" }) {
  const bgStyle: Style = { backgroundColor: DPE_COLORS[label] };
  return (
    <View style={mergeStyles(styles.dpeBadge, bgStyle)}>
      <Text style={styles.dpeBadgeText}>{safeStr(label)}</Text>
    </View>
  );
}

function PageFooter({ projectName, computedAt }: { projectName: string; computedAt: string }) {
  const dateStr = (() => {
    try { return new Date(computedAt).toLocaleDateString("fr-FR"); }
    catch { return ""; }
  })();
  const leftStr = `RENOCALCPRO · ${safeStr(projectName)} · ${dateStr}`;
  return (
    <View style={styles.pageFooter} fixed>
      <Text style={styles.pageFooterText}>{leftStr}</Text>
      <Text style={styles.pageFooterText}>{"www.renocalcpro.fr"}</Text>
    </View>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const labelStr = safeStr(label);
  const valueStr = safeStr(value);
  const hintStr = hint == null ? "" : safeStr(hint);
  if (hintStr === "") {
    return (
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>{labelStr}</Text>
        <Text style={styles.kpiValue}>{valueStr}</Text>
      </View>
    );
  }
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{labelStr}</Text>
      <Text style={styles.kpiValue}>{valueStr}</Text>
      <Text style={styles.kpiHint}>{hintStr}</Text>
    </View>
  );
}

function Bar({ ratio, color }: { ratio: number; color: string }) {
  const r = typeof ratio === "number" && Number.isFinite(ratio) ? ratio : 0;
  const pct = Math.max(0, Math.min(100, r * 100));
  const outer: Style = { width: "100%", backgroundColor: COLORS.cream100, height: 8, borderRadius: 2 };
  const inner: Style = { width: `${pct}%`, backgroundColor: color, height: 8, borderRadius: 2 };
  return (
    <View style={outer}>
      <View style={inner} />
    </View>
  );
}

// ─────────────────── PAGE 1 : COVER ───────────────────

function CoverPage({ r }: { r: ProjectResultRich }) {
  const projectId = safeStr(r.building?.id ?? "Projet");
  const subtitle = `${labelBuildingType(safeStr(r.building?.type))} · ${safeStr(r.building?.surface_habitable_m2)} m² · Zone ${safeStr(r.building?.climate_zone)} · ${labelPeriod(safeStr(r.building?.construction_period))}`;
  const dpeLabel = safeDpe(r.baseline?.dpe_label);
  const cepLine = `${formatNum(r.baseline?.cep_kWh_m2_year)} kWh/m²·an`;
  const facture = `Facture annuelle estimée : ${formatEur(r.baseline?.annual_cost_eur)}`;
  const confidenceLine = `${safeStr(r.confidence?.score)}/100   ${safeStr(r.confidence?.level)}   (${safeStr(r.confidence?.saisi_count)} valeurs saisies · ${safeStr(r.confidence?.deduit_count)} déduites)`;
  const computedDate = (() => {
    try { return new Date(r.computed_at).toLocaleDateString("fr-FR"); }
    catch { return ""; }
  })();
  const metaLine = `Document généré le ${computedDate} · Engine v${safeStr(r.engine_version)} · Paramètres v${safeStr(r.parameters_version)} · Conformité ${safeStr(r.compliance?.global?.version)}`;
  const statusLine = `Statut global moteur : ${safeStr(r.compliance?.global?.globalStatus)} — Calcul simplifié pré-audit, pas une certification DPE 3CL réglementaire.`;

  const pageStyle = mergeStyles(styles.page, { backgroundColor: COLORS.forest900 });
  const dpeBoxStyle: Style = {
    backgroundColor: DPE_COLORS[dpeLabel],
    padding: 16, borderRadius: 6, alignItems: "center", minWidth: 80,
  };
  const headerWrap: Style = { marginTop: 80 };
  const eyebrow: Style = { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.cream100, letterSpacing: 2 };
  const title: Style = { fontSize: 32, fontFamily: "Helvetica-Bold", color: COLORS.white, marginTop: 18, lineHeight: 1.1 };
  const sub: Style = { fontSize: 14, color: COLORS.cream100, marginTop: 8 };
  const heroRow: Style = { marginTop: 50, flexDirection: "row", gap: 16 };
  const heroBoxLabel: Style = { fontSize: 8, color: COLORS.white, fontFamily: "Helvetica-Bold" };
  const heroBoxVal: Style = { fontSize: 32, fontFamily: "Helvetica-Bold", color: COLORS.white };
  const heroRight: Style = { flex: 1 };
  const heroHint: Style = { fontSize: 10, color: COLORS.cream100, marginBottom: 4 };
  const heroBig: Style = { fontSize: 24, fontFamily: "Helvetica-Bold", color: COLORS.white };
  const heroSmall: Style = { fontSize: 9, color: COLORS.cream100, marginTop: 4 };
  const confBox: Style = { marginTop: 30, padding: 12, backgroundColor: COLORS.forest800, borderRadius: 4 };
  const confEyebrow: Style = { fontSize: 8, color: COLORS.cream100, fontFamily: "Helvetica-Bold", letterSpacing: 1 };
  const confText: Style = { fontSize: 14, color: COLORS.white, marginTop: 4 };
  const footWrap: Style = { position: "absolute", bottom: 32, left: 32, right: 32 };
  const footInner: Style = { borderTopWidth: 1, borderTopColor: COLORS.forest700, paddingTop: 12 };
  const footMeta: Style = { fontSize: 8, color: COLORS.cream100 };
  const footStatus: Style = { fontSize: 7, color: COLORS.cream100, marginTop: 4 };

  return (
    <Page size="A4" style={pageStyle}>
      <View style={headerWrap}>
        <Text style={eyebrow}>{"RÉNO·CALC PRO · RAPPORT D'AUDIT ÉNERGÉTIQUE PRÉ-DPE"}</Text>
        <Text style={title}>{projectId}</Text>
        <Text style={sub}>{subtitle}</Text>
      </View>

      <View style={heroRow}>
        <View style={dpeBoxStyle}>
          <Text style={heroBoxLabel}>{"DPE"}</Text>
          <Text style={heroBoxVal}>{dpeLabel}</Text>
        </View>
        <View style={heroRight}>
          <Text style={heroHint}>{"Consommation primaire actuelle"}</Text>
          <Text style={heroBig}>{cepLine}</Text>
          <Text style={heroSmall}>{facture}</Text>
        </View>
      </View>

      <View style={confBox}>
        <Text style={confEyebrow}>{"NIVEAU DE FIABILITÉ DU DOSSIER"}</Text>
        <Text style={confText}>{confidenceLine}</Text>
      </View>

      <View style={footWrap}>
        <View style={footInner}>
          <Text style={footMeta}>{metaLine}</Text>
          <Text style={footStatus}>{statusLine}</Text>
        </View>
      </View>
    </Page>
  );
}

// ─────────────────── PAGE 2 : SUMMARY + BASELINE ───────────────────

function SummaryAndBaselinePage({ r }: { r: ProjectResultRich }) {
  const dpeLabel = safeDpe(r.baseline?.dpe_label);
  const gesLabel = safeDpe(r.baseline?.ges_label);
  const dpeNarrative = `Étiquette énergie ${dpeLabel} à ${formatNum(r.baseline?.cep_kWh_m2_year)} kWh EP/m²·an. Facture annuelle évaluée à ${formatEur(r.baseline?.annual_cost_eur)}.`;

  const sysRows: { post: string; equip: string; energy: string }[] = [];
  for (const h of safeArr(r.building?.heating)) {
    sysRows.push({ post: "Chauffage", equip: labelHeating(safeStr(h.kind)), energy: labelCarrier(safeStr(h.carrier)) });
  }
  for (const d of safeArr(r.building?.dhw)) {
    sysRows.push({ post: "ECS", equip: labelDhw(safeStr(d.kind)), energy: labelCarrier(safeStr(d.carrier)) });
  }
  sysRows.push({
    post: "Ventilation",
    equip: labelVentil(safeStr(r.building?.ventilation?.kind)),
    energy: "—",
  });

  const dpeColCell: Style = { flex: 2 };
  const dpeColEquip: Style = { flex: 3 };
  const dpeColEnergy: Style = { flex: 2 };
  const heroBlockRow: Style = { flexDirection: "row", gap: 16, marginVertical: 12, alignItems: "center" };
  const heroBlockCenter: Style = { alignItems: "center" };
  const heroBlockNarrative: Style = { flex: 1, marginLeft: 12 };
  const heroBlockLabel: Style = { fontSize: 7, color: COLORS.slate600, marginBottom: 4 };
  const heroBlockUnit: Style = { fontSize: 8, color: COLORS.slate600, marginTop: 4 };

  const projectName = safeStr(r.building?.id ?? "Projet");

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>{"1. Résumé du projet"}</Text>
      <Text style={styles.sectionTitle}>{"Caractéristiques du bâtiment"}</Text>

      <View style={styles.kpiGrid}>
        <Kpi label="Type" value={labelBuildingType(safeStr(r.building?.type))} />
        <Kpi label="Surface habitable" value={`${safeStr(r.building?.surface_habitable_m2)} m²`} />
        <Kpi label="Année / période" value={labelPeriod(safeStr(r.building?.construction_period))} />
        <Kpi label="Zone climatique" value={safeStr(r.building?.climate_zone)} hint={`Altitude ${safeStr(r.building?.altitude_m)} m`} />
        <Kpi label="Hauteur sous plafond" value={`${safeStr(r.building?.hauteur_sous_plafond_m)} m`} />
        <Kpi label="Niveaux" value={safeStr(r.building?.niveau_count)} />
      </View>

      <Text style={styles.h3}>{"Systèmes existants"}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={mergeStyles(styles.tableHeaderCell, dpeColCell)}>{"Poste"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, dpeColEquip)}>{"Équipement"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, dpeColEnergy)}>{"Énergie"}</Text>
        </View>
        {sysRows.map((row, i) => {
          const rowStyle = i % 2 === 1 ? mergeStyles(styles.tableRow, styles.tableRowAlt) : mergeStyles(styles.tableRow);
          return (
            <View key={`sys-${i}`} style={rowStyle}>
              <Text style={mergeStyles(styles.tableCell, dpeColCell)}>{safeStr(row.post)}</Text>
              <Text style={mergeStyles(styles.tableCell, dpeColEquip)}>{safeStr(row.equip)}</Text>
              <Text style={mergeStyles(styles.tableCell, dpeColEnergy)}>{safeStr(row.energy)}</Text>
            </View>
          );
        })}
      </View>

      <Text style={mergeStyles(styles.sectionEyebrow, { marginTop: 20 })}>{"2. État initial — Synthèse énergétique"}</Text>
      <Text style={styles.sectionTitle}>{"Performance avant travaux"}</Text>

      <View style={heroBlockRow}>
        <View style={heroBlockCenter}>
          <Text style={heroBlockLabel}>{"DPE Énergie"}</Text>
          <DpeBadgeView label={dpeLabel} />
          <Text style={heroBlockUnit}>{`${formatNum(r.baseline?.cep_kWh_m2_year)} kWh EP/m²·an`}</Text>
        </View>
        <View style={heroBlockCenter}>
          <Text style={heroBlockLabel}>{"DPE Climat"}</Text>
          <DpeBadgeView label={gesLabel} />
          <Text style={heroBlockUnit}>{`${formatNum(r.baseline?.ges_kgCO2_m2_year)} kgCO₂/m²·an`}</Text>
        </View>
        <View style={heroBlockNarrative}>
          <Text style={styles.para}>{dpeNarrative}</Text>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        <Kpi label="UA Global" value={`${formatNum(r.baseline?.UA_W_K)} W/K`} hint="Déperdition totale" />
        <Kpi label="Besoin chauffage" value={`${formatNum(r.baseline?.heating_needs_kWh_year)} kWh/an`} hint="Énergie utile" />
        <Kpi label="Besoin ECS" value={`${formatNum(r.baseline?.dhw_needs_kWh_year)} kWh/an`} />
        <Kpi label="Émissions" value={`${formatNum(r.baseline?.emissions_kgCO2_year)} kgCO₂/an`} />
        <Kpi label="Coût annuel" value={formatEur(r.baseline?.annual_cost_eur)} />
        <Kpi label="CEP spécifique" value={`${formatNum(r.baseline?.cep_kWh_m2_year)} kWh/m²`} hint="Base étiquette DPE" />
      </View>

      <PageFooter projectName={projectName} computedAt={safeStr(r.computed_at)} />
    </Page>
  );
}

// ─────────────────── PAGE 3 : HEAT LOSS + SUMMER COMFORT ───────────────────

function HeatLossAndComfortPage({ r }: { r: ProjectResultRich }) {
  const bd = r.heat_loss_breakdown;
  const sc = r.summer_comfort;
  const introLine = bd?.envelope_dominated
    ? `Coefficient de déperdition global ${formatNum(bd?.ua_total_W_K)} W/K. L'enveloppe opaque représente plus de 70% des pertes : priorité à l'isolation.`
    : `Coefficient de déperdition global ${formatNum(bd?.ua_total_W_K)} W/K.`;
  const top = bd?.top_contributor;
  const topRecoLine = top
    ? `${safeStr(top.label)} (${Math.round((top.share ?? 0) * 100)}% du UA) : cibler ce poste en premier maximisera le gain.`
    : "";
  const inertia = safeStr(r.building?.inertia ?? "moyenne");
  const summerNarrative = `Inertie thermique : ${inertia} (amortissement ${Math.round((sc?.factors?.inertia_contribution ?? 0) * 100)}%) · Zone climatique : sévérité été ×${safeStr(sc?.factors?.climate_contribution)} · Vitrage S/SO/O : ${formatNum(sc?.factors?.south_west_exposure_m2, 1)} m².`;

  const bdItems = safeArr(bd?.items);
  const scRecos = safeArr(sc?.recommendations);
  const projectName = safeStr(r.building?.id ?? "Projet");

  const eyebrowMt: Style = { marginTop: 20 };
  const lineRow: Style = { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 };
  const lineLabelStyle: Style = { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.forest900 };
  const lineStatsStyle: Style = { fontSize: 9, color: COLORS.slate600 };
  const priorityBox: Style = { marginTop: 12, padding: 10, backgroundColor: COLORS.cream50, borderLeftWidth: 3, borderLeftColor: COLORS.forest700 };
  const priorityEyebrow: Style = { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.forest700 };
  const priorityText: Style = { fontSize: 10, color: COLORS.forest900, marginTop: 2 };
  const recoIndent: Style = { marginLeft: 8 };

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>{"3. Décomposition des déperditions thermiques"}</Text>
      <Text style={styles.sectionTitle}>{"Où se perd la chaleur"}</Text>
      <Text style={styles.para}>{introLine}</Text>

      <View style={{ marginTop: 10 }}>
        {bdItems.map((it, i) => {
          const lineLabel = `${i + 1}. ${safeStr(it.label)}`;
          const lineStats = `${formatNum(it.ua_W_K, 1)} W/K · ${Math.round((it.share ?? 0) * 100)}% · ${formatNum(it.heating_share_kWh_year)} kWh/an   [${safeStr(it.priority)}]`;
          const barColor = it.priority === "HAUTE" ? COLORS.rose500 : it.priority === "MOYENNE" ? COLORS.amber500 : COLORS.forest500;
          const key = `bd-${safeStr(it.code) || i}`;
          return (
            <View key={key} style={{ marginBottom: 8 }}>
              <View style={lineRow}>
                <Text style={lineLabelStyle}>{lineLabel}</Text>
                <Text style={lineStatsStyle}>{lineStats}</Text>
              </View>
              <Bar ratio={it.share ?? 0} color={barColor} />
            </View>
          );
        })}
      </View>

      {topRecoLine !== "" && (
        <View style={priorityBox}>
          <Text style={priorityEyebrow}>{"POSTE PRIORITAIRE"}</Text>
          <Text style={priorityText}>{topRecoLine}</Text>
        </View>
      )}

      <Text style={mergeStyles(styles.sectionEyebrow, eyebrowMt)}>{"4. Confort d'été"}</Text>
      <Text style={styles.sectionTitle}>{"Risque de surchauffe estimé"}</Text>

      <View style={styles.kpiGrid}>
        <Kpi label="Niveau" value={safeStr(sc?.level)} hint={`Score ${safeStr(sc?.score)}/5`} />
        <Kpi label="Tic estimé" value={`${safeStr(sc?.tic_estimated_C)}°C`} hint="Indicatif (pas RE2020)" />
        <Kpi label="Risque surchauffe" value={`${Math.round((sc?.overheating_risk ?? 0) * 100)}%`} />
      </View>

      <Text style={styles.h3}>{"Facteurs analysés"}</Text>
      <Text style={styles.para}>{summerNarrative}</Text>

      <Text style={styles.h3}>{"Recommandations"}</Text>
      {scRecos.map((rec, i) => (
        <Text key={`rec-${i}`} style={mergeStyles(styles.para, recoIndent)}>{`· ${safeStr(rec)}`}</Text>
      ))}

      <PageFooter projectName={projectName} computedAt={safeStr(r.computed_at)} />
    </Page>
  );
}

// ─────────────────── PAGE 4 : SCENARIOS ───────────────────

function ScenariosPage({ r }: { r: ProjectResultRich }) {
  const scenarios = safeArr(r.scenarios);
  const recoId = r.recommended_scenario_id;
  const reco = recoId ? (scenarios.find(s => s.scenario_id === recoId) ?? null) : null;
  const recoNarrative = reco
    ? `Passage de l'étiquette ${safeDpe(r.baseline?.dpe_label)} à ${safeDpe(reco.after?.dpe_label)} (+${safeStr(reco.savings?.dpe_steps_gained)} classes).`
    : "";
  const recoWorks = reco ? safeArr(reco.works_detail) : [];
  const projectName = safeStr(r.building?.id ?? "Projet");

  const colScen: Style = { flex: 3 };
  const colDpe: Style = { flex: 1, textAlign: "center" };
  const colEco: Style = { flex: 1.5, textAlign: "right" };
  const colCost: Style = { flex: 1.5, textAlign: "right" };
  const colRac: Style = { flex: 1.5, textAlign: "right" };
  const colRet: Style = { flex: 1, textAlign: "right" };

  const wColG: Style = { flex: 3 };
  const wColC: Style = { flex: 1.5, textAlign: "right" };
  const wColA: Style = { flex: 1.5, textAlign: "right" };

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>{"5. Scénarios de rénovation"}</Text>
      <Text style={styles.sectionTitle}>{"Comparaison des scénarios"}</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={mergeStyles(styles.tableHeaderCell, colScen)}>{"Scénario"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, colDpe)}>{"DPE"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, colEco)}>{"Éco. €/an"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, colCost)}>{"Coût"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, colRac)}>{"RAC"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, colRet)}>{"Retour"}</Text>
        </View>
        {scenarios.map((s, i) => {
          const isReco = s.scenario_id === recoId;
          const altStyle: StyleInput = i % 2 === 1 ? styles.tableRowAlt : null;
          const recoStyle: StyleInput = isReco ? { backgroundColor: COLORS.forest100 } : null;
          const rowStyle = mergeStyles(styles.tableRow, altStyle, recoStyle);
          const sName = safeStr(s.scenario_name);
          const nameText = isReco ? `★ ${sName}` : sName;
          const payback = s.payback_years != null ? `${safeStr(s.payback_years)} ans` : "—";
          const dpeAfter = safeDpe(s.after?.dpe_label);
          const nameFont: Style = { flex: 3, fontFamily: isReco ? "Helvetica-Bold" : "Helvetica" };
          const dpeStyle: Style = { flex: 1, textAlign: "center", color: DPE_COLORS[dpeAfter], fontFamily: "Helvetica-Bold" };
          const racBold: Style = { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold" };
          return (
            <View key={`sc-${safeStr(s.scenario_id) || i}`} style={rowStyle}>
              <Text style={mergeStyles(styles.tableCell, nameFont)}>{nameText}</Text>
              <Text style={mergeStyles(styles.tableCell, dpeStyle)}>{dpeAfter}</Text>
              <Text style={mergeStyles(styles.tableCell, colEco, styles.positive)}>{formatEur(s.savings?.energy_eur_year)}</Text>
              <Text style={mergeStyles(styles.tableCell, colCost)}>{formatEur(s.works_cost_eur)}</Text>
              <Text style={mergeStyles(styles.tableCell, racBold)}>{formatEur(s.out_of_pocket_eur)}</Text>
              <Text style={mergeStyles(styles.tableCell, colRet)}>{payback}</Text>
            </View>
          );
        })}
      </View>

      {reco !== null && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.h3}>{`Scénario recommandé : ${safeStr(reco.scenario_name)}`}</Text>
          <Text style={styles.para}>{recoNarrative}</Text>
          <Text style={styles.h3}>{"Détail des travaux"}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={mergeStyles(styles.tableHeaderCell, wColG)}>{"Geste"}</Text>
              <Text style={mergeStyles(styles.tableHeaderCell, wColC)}>{"Coût TTC"}</Text>
              <Text style={mergeStyles(styles.tableHeaderCell, wColA)}>{"Aides"}</Text>
            </View>
            {recoWorks.map((w, i) => {
              const rowStyle = i % 2 === 1 ? mergeStyles(styles.tableRow, styles.tableRowAlt) : mergeStyles(styles.tableRow);
              return (
                <View key={`wd-${safeStr(w.work_id) || i}`} style={rowStyle}>
                  <Text style={mergeStyles(styles.tableCell, wColG)}>{labelWork(safeStr(w.kind))}</Text>
                  <Text style={mergeStyles(styles.tableCell, wColC)}>{formatEur(w.cost_eur)}</Text>
                  <Text style={mergeStyles(styles.tableCell, wColA, styles.positive)}>{formatEur(w.aids_eur)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <PageFooter projectName={projectName} computedAt={safeStr(r.computed_at)} />
    </Page>
  );
}

// ─────────────────── PAGE 5 : AIDS + BUDGET ───────────────────

function AidsAndBudgetPage({ r }: { r: ProjectResultRich }) {
  const scenarios = safeArr(r.scenarios);
  const projectName = safeStr(r.building?.id ?? "Projet");
  const noteStyle: Style = { fontSize: 7, color: COLORS.slate600, marginTop: 1 };

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>{"6. Aides, budget et reste à charge"}</Text>
      <Text style={styles.sectionTitle}>{"Financement par scénario"}</Text>

      {scenarios.map((s) => {
        const retourHint = s.payback_years != null ? `Retour ${safeStr(s.payback_years)} ans` : "";
        const notes = safeArr(s.aids?.notes);
        const key = `aid-${safeStr(s.scenario_id)}`;
        return (
          <View key={key} style={{ marginBottom: 14 }}>
            <Text style={styles.h3}>{safeStr(s.scenario_name)}</Text>
            <View style={styles.kpiGrid}>
              <Kpi label="Coût travaux TTC" value={formatEur(s.works_cost_eur)} />
              <Kpi label="MaPrimeRénov'" value={formatEur(s.aids?.mpr_eur)} hint="Forfaits par geste" />
              <Kpi label="CEE" value={formatEur(s.aids?.cee_eur)} hint="Bonus précarité inclus" />
              <Kpi label="Éco-PTZ éligible" value={formatEur(s.aids?.eco_ptz_eligible_eur)} hint="Prêt à 0%" />
              <Kpi label="Aides totales" value={formatEur(s.aids?.total_subsidy_eur)} />
              <Kpi label="Reste à charge" value={formatEur(s.out_of_pocket_eur)} hint={retourHint} />
            </View>
            {notes.map((n, i) => (
              <Text key={`note-${safeStr(s.scenario_id)}-${i}`} style={noteStyle}>{`· ${safeStr(n)}`}</Text>
            ))}
          </View>
        );
      })}

      <PageFooter projectName={projectName} computedAt={safeStr(r.computed_at)} />
    </Page>
  );
}

// ─────────────────── PAGE 6 : HYPOTHESES + COMPLIANCE ───────────────────

function HypothesesAndCompliancePage({ r }: { r: ProjectResultRich }) {
  const hyps = r.hypotheses;
  const entriesAll = safeArr(hyps?.entries);
  const counts = hyps?.counts ?? { SAISI: 0, DEDUIT_TABLE: 0, FORFAITAIRE: 0, ESTIMATION: 0 } as const;
  const summaryLine = `${entriesAll.length} hypothèses tracées · ${safeStr(counts.SAISI)} saisies · ${safeStr(counts.DEDUIT_TABLE)} déduites · ${safeStr(counts.FORFAITAIRE)} forfaitaires · ${safeStr(counts.ESTIMATION)} estimations`;
  const entries = entriesAll.slice(0, 18);
  const overflow = entriesAll.length > 18 ? entriesAll.length - 18 : 0;
  const projectName = safeStr(r.building?.id ?? "Projet");
  const summary = r.compliance?.summary;

  const colCat: Style = { flex: 2, fontSize: 8 };
  const colField: Style = { flex: 3, fontSize: 8 };
  const colValue: Style = { flex: 3, fontSize: 8 };
  const colSourceBase: Style = { flex: 1.5, fontSize: 7, fontFamily: "Helvetica-Bold" };

  const colCatH: Style = { flex: 2 };
  const colFieldH: Style = { flex: 3 };
  const colValueH: Style = { flex: 3 };
  const colSourceH: Style = { flex: 1.5 };
  const overflowStyle: Style = { flex: 9.5, fontSize: 7, color: COLORS.slate400 };
  const tableMt: Style = { marginTop: 8 };
  const noBottom: Style = { borderBottomWidth: 0 };

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>{"7. Traçabilité des hypothèses"}</Text>
      <Text style={styles.sectionTitle}>{"Journal complet des valeurs utilisées"}</Text>
      <Text style={styles.para}>{summaryLine}</Text>

      <View style={mergeStyles(styles.table, tableMt)}>
        <View style={styles.tableHeader}>
          <Text style={mergeStyles(styles.tableHeaderCell, colCatH)}>{"Catégorie"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, colFieldH)}>{"Champ"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, colValueH)}>{"Valeur"}</Text>
          <Text style={mergeStyles(styles.tableHeaderCell, colSourceH)}>{"Source"}</Text>
        </View>
        {entries.map((e, i) => {
          const src = safeStr(e.source);
          const sourceColor =
            src === "SAISI" ? COLORS.emerald600 :
            src === "FORFAITAIRE" ? COLORS.amber500 :
            src === "ESTIMATION" ? COLORS.rose500 : COLORS.slate600;
          const srcStyle: Style = { color: sourceColor };
          const rowStyle = i % 2 === 1 ? mergeStyles(styles.tableRow, styles.tableRowAlt) : mergeStyles(styles.tableRow);
          return (
            <View key={`hyp-${i}`} style={rowStyle}>
              <Text style={mergeStyles(styles.tableCell, colCat)}>{safeStr(e.category)}</Text>
              <Text style={mergeStyles(styles.tableCell, colField)}>{safeStr(e.field)}</Text>
              <Text style={mergeStyles(styles.tableCell, colValue)}>{safeStr(e.value)}</Text>
              <Text style={mergeStyles(styles.tableCell, colSourceBase, srcStyle)}>{src}</Text>
            </View>
          );
        })}
        {overflow > 0 && (
          <View style={mergeStyles(styles.tableRow, noBottom)}>
            <Text style={mergeStyles(styles.tableCell, overflowStyle)}>
              {`… et ${overflow} autres hypothèses (disponibles en export JSON)`}
            </Text>
          </View>
        )}
      </View>

      <Text style={mergeStyles(styles.sectionEyebrow, { marginTop: 16 })}>{"8. Conformité réglementaire des méthodes"}</Text>
      <Text style={styles.sectionTitle}>{"Statut par méthode de calcul"}</Text>

      <View style={styles.kpiGrid}>
        <Kpi label="Réglementaires" value={safeStr(summary?.reglementaires_count)} hint="Conformes aux textes" />
        <Kpi label="Préparatoires 3CL" value={safeStr(summary?.preparatoires_count)} hint="Structure compatible" />
        <Kpi label="Pré-audit" value={safeStr(summary?.indicatifs_count)} hint="Méthode simplifiée" />
        <Kpi label="Forfaitaires" value={safeStr(summary?.forfaitaires_count)} hint="Approximations" />
        <Kpi label="Non implémentées" value={safeStr(summary?.non_implementes_count)} />
      </View>

      <Text style={styles.h3}>{"Certifications revendiquées : aucune"}</Text>
      <Text style={styles.para}>
        {"DPE 3CL 2021 : non conforme · Audit réglementaire (décret 2022-780) : non conforme · DEET tertiaire : non conforme · RE2020 : hors scope."}
      </Text>

      <PageFooter projectName={projectName} computedAt={safeStr(r.computed_at)} />
    </Page>
  );
}

// ─────────────────── PAGE 7 : WARNINGS + DISCLAIMER ───────────────────

function WarningsAndDisclaimerPage({ r }: { r: ProjectResultRich }) {
  const warnings = safeArr(r.warnings);
  const methodologyNotes = safeArr(r.methodology_notes);
  const projectName = safeStr(r.building?.id ?? "Projet");
  const disclaimer = safeStr(r.compliance?.global?.disclaimer);
  const noteIndent: Style = { marginLeft: 8 };

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionEyebrow}>{"9. Points de vigilance"}</Text>
      <Text style={styles.sectionTitle}>{"Avertissements détectés"}</Text>

      {warnings.length === 0 && (
        <Text style={styles.para}>{"Aucun point de vigilance particulier détecté sur ce dossier."}</Text>
      )}
      {warnings.length > 0 && warnings.map((w, i) => (
        <View key={`warn-${i}`} style={styles.warningBox}>
          <Text style={styles.warningCode}>{`[${safeStr(w.severity)}] ${safeStr(w.code)}`}</Text>
          <Text style={styles.warningText}>{safeStr(w.message)}</Text>
        </View>
      ))}

      <Text style={mergeStyles(styles.sectionEyebrow, { marginTop: 20 })}>{"10. Méthodologie et limites"}</Text>
      <Text style={styles.sectionTitle}>{"Note méthodologique"}</Text>

      {methodologyNotes.map((note, i) => (
        <Text key={`mn-${i}`} style={mergeStyles(styles.para, noteIndent)}>{`· ${safeStr(note)}`}</Text>
      ))}

      <Text style={styles.h3}>{"Sources et hypothèses globales"}</Text>
      <Text style={styles.para}>
        {"DJU Ademe · U-values RT par période 1948-2021+ · Rendements nominaux + correction âge · Facteurs émission Base Carbone Ademe · Coef EP arrêté 14/02/2020 · Seuils DPE 31/03/2021 · Barèmes MPR ANAH 2025 · CEE BAR-TH/EN moyenne marché 2024-2025."}
      </Text>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>{disclaimer}</Text>
      </View>

      <PageFooter projectName={projectName} computedAt={safeStr(r.computed_at)} />
    </Page>
  );
}

// ─────────────────── DOCUMENT PRINCIPAL ───────────────────

export interface AuditReportProps {
  result: ProjectResultRich;
}

export function AuditReportDocument({ result }: AuditReportProps): React.ReactElement {
  return (
    <Document
      title={`Rapport Réno·Calc Pro — ${safeStr(result?.building?.id)}`}
      author="Réno·Calc Pro"
      subject="Audit énergétique pré-rénovation"
      creator={`Réno·Calc Pro Engine v${safeStr(result?.engine_version)}`}
      producer="@react-pdf/renderer"
    >
      <CoverPage r={result} />
      <SummaryAndBaselinePage r={result} />
      <HeatLossAndComfortPage r={result} />
      <ScenariosPage r={result} />
      <AidsAndBudgetPage r={result} />
      <HypothesesAndCompliancePage r={result} />
      <WarningsAndDisclaimerPage r={result} />
    </Document>
  );
}

// ─────────────────── LABELS ───────────────────

function labelBuildingType(t: string): string {
  const m: Record<string, string> = {
    MAISON_INDIV: "Maison individuelle", APPARTEMENT: "Appartement",
    COPRO_PARTIES_COMMUNES: "Copropriété", TERTIAIRE_BUREAU: "Bureau", TERTIAIRE_COMMERCE: "Commerce",
  };
  return m[t] ?? t;
}
function labelPeriod(p: string): string {
  const m: Record<string, string> = {
    AVANT_1948: "Avant 1948", "1948_1974": "1948-1974",
    "1975_1981": "1975-1981 (1ère RT)", "1982_1988": "1982-1988", "1989_2000": "1989-2000",
    "2001_2005": "2001-2005", "2006_2012": "2006-2012 (RT2005)",
    "2013_2020": "2013-2020 (RT2012)", "2021_PLUS": "2021+ (RE2020)",
  };
  return m[p] ?? p;
}
function labelCarrier(c: string): string {
  const m: Record<string, string> = {
    ELEC: "Électricité", GAZ_NAT: "Gaz naturel", FIOUL: "Fioul",
    BOIS_BUCHE: "Bois bûche", BOIS_GRANUL: "Bois granulés",
    PROPANE: "Propane", RES_CH: "Réseau chaleur", SOLAIRE: "Solaire",
  };
  return m[c] ?? c;
}
function labelHeating(k: string): string {
  const m: Record<string, string> = {
    CHAUDIERE_GAZ_STD: "Chaudière gaz standard", CHAUDIERE_GAZ_COND: "Chaudière gaz condensation",
    CHAUDIERE_FIOUL: "Chaudière fioul", CHAUDIERE_BOIS_BUCHE: "Chaudière bois bûche",
    CHAUDIERE_BOIS_GRANUL: "Chaudière bois granulés", PAC_AIR_AIR: "PAC air/air",
    PAC_AIR_EAU: "PAC air/eau", PAC_GEO: "PAC géothermique",
    RADIATEUR_ELEC: "Radiateurs électriques", CONVECTEUR_ELEC_NG: "Convecteurs élec. NG",
    POELE_BOIS_BUCHE: "Poêle bûches", POELE_GRANUL: "Poêle granulés",
    RES_CHALEUR_URBAIN: "Réseau chaleur urbain", INSERT_CHEMINEE: "Insert cheminée",
  };
  return m[k] ?? k;
}
function labelDhw(k: string): string {
  const m: Record<string, string> = {
    BALLON_ELEC: "Ballon électrique", BALLON_THERMODYN: "Ballon thermodynamique",
    CHAUDIERE_INTEGREE: "ECS chaudière intégrée", SOLAIRE_THERM_APPOINT: "Solaire + appoint",
    GAZ_INSTANT: "Gaz instantané",
  };
  return m[k] ?? k;
}
function labelVentil(k: string): string {
  const m: Record<string, string> = {
    NATURELLE: "Naturelle", VMC_SF_AUTO: "VMC simple flux auto",
    VMC_SF_HYGRO_A: "VMC hygro A", VMC_SF_HYGRO_B: "VMC hygro B",
    VMC_DF: "VMC double flux", VMI: "VMI", ABSENTE: "Aucune",
  };
  return m[k] ?? k;
}
function labelWork(k: string): string {
  const m: Record<string, string> = {
    ISO_MURS_ITE: "Isolation murs extérieurs (ITE)", ISO_MURS_ITI: "Isolation murs intérieurs (ITI)",
    ISO_COMBLES_PERDUS: "Isolation combles perdus", ISO_COMBLES_AMENAGES: "Isolation combles aménagés",
    ISO_TOITURE: "Isolation toiture", ISO_PLANCHER_BAS: "Isolation plancher bas",
    MENUISERIES_DV: "Menuiseries double vitrage", MENUISERIES_TV: "Menuiseries triple vitrage",
    VMC_HYGRO_B: "VMC hygroréglable B", VMC_DF: "VMC double flux",
    REMPLACEMENT_CHAUDIERE_COND: "Chaudière gaz condensation", PAC_AIR_EAU: "PAC air/eau",
    PAC_AIR_AIR: "PAC air/air", POELE_GRANUL: "Poêle à granulés",
    CHAUFFE_EAU_THERMODYN: "Chauffe-eau thermodynamique", SOLAIRE_THERMIQUE_ECS: "Solaire thermique ECS",
    PHOTOVOLTAIQUE: "Photovoltaïque",
  };
  return m[k] ?? k;
}
