// src/pdf/calc/theme.ts — Styles partagés PDF v1.1
// v1.1: disclaimerBox nettoyé — séparation stricte View (layout) vs Text (typographie).

import { StyleSheet } from "@react-pdf/renderer";

export const COLORS = {
  forest900: "#0E2D1B",
  forest800: "#13422A",
  forest700: "#2D5A3E",
  forest500: "#5BA13F",
  forest100: "#E1ECDF",
  cream50:   "#FAF6EC",
  cream100:  "#F4ECD5",
  cream300:  "#D8CFB3",
  amber500:  "#F5AB35",
  rose500:   "#E11D48",
  emerald600:"#059669",
  slate900:  "#0F172A",
  slate600:  "#475569",
  slate400:  "#94A3B8",
  white:     "#FFFFFF",
} as const;

/** Couleurs DPE A-G (arrêté DPE 2021). */
export const DPE_COLORS: Record<"A"|"B"|"C"|"D"|"E"|"F"|"G", string> = {
  A: "#2D7A3E",
  B: "#5BA13F",
  C: "#A9C440",
  D: "#F4D03F",
  E: "#F5AB35",
  F: "#E8763F",
  G: "#C7402E",
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.slate900,
    lineHeight: 1.5,
  },
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pageFooterText: {
    fontSize: 8,
    color: COLORS.slate400,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.forest900,
    marginTop: 20,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.forest700,
  },
  sectionEyebrow: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.forest700,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  h3: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.forest900,
    marginTop: 10,
    marginBottom: 6,
  },
  para: {
    fontSize: 10,
    marginBottom: 6,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 10,
  },
  kpiCard: {
    flexBasis: "31%",
    backgroundColor: COLORS.cream50,
    borderRadius: 4,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.forest700,
  },
  kpiLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORS.slate600,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.forest900,
  },
  kpiHint: {
    fontSize: 7,
    color: COLORS.slate400,
    marginTop: 2,
  },
  table: {
    width: "100%",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.cream300,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.cream100,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cream300,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.forest900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cream300,
  },
  tableRowAlt: {
    backgroundColor: COLORS.cream50,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.slate900,
  },
  dpeBadge: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  dpeBadgeText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber500,
    padding: 10,
    marginBottom: 6,
  },
  warningCode: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#92400E",
    marginBottom: 2,
  },
  warningText: {
    fontSize: 9,
    color: "#78350F",
  },
  disclaimerBox: {
    backgroundColor: COLORS.cream50,
    borderWidth: 1,
    borderColor: COLORS.cream300,
    borderRadius: 4,
    padding: 10,
    marginTop: 10,
  },
  disclaimerText: {
    fontSize: 8,
    color: COLORS.slate600,
    fontStyle: "italic",
  },
  positive: { color: COLORS.emerald600, fontFamily: "Helvetica-Bold" },
  negative: { color: COLORS.rose500, fontFamily: "Helvetica-Bold" },
});

export function formatEur(n: unknown): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return `${Math.round(v).toLocaleString("fr-FR")} €`;
}

export function formatNum(n: unknown, digits = 0): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: digits });
}
