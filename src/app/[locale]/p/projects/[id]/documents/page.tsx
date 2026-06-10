// app/[locale]/p/projects/[id]/documents/page.tsx — Onglet Documents/Rapports v2.0
"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Doc {
  id: string;
  titleKey: string;
  kind: "audit" | "scenario" | "aids" | "devis";
  version: string;
  dateKey: string;
  sizeKb: number;
  status: "ready" | "generating" | "outdated";
}

const DOCS: Doc[] = [
  { id: "d1", titleKey: "doc1Title", kind: "audit",    version: "v3", dateKey: "doc1Date", sizeKb: 2_340, status: "ready" },
  { id: "d2", titleKey: "doc2Title", kind: "scenario", version: "v2", dateKey: "doc2Date", sizeKb: 1_120, status: "ready" },
  { id: "d3", titleKey: "doc3Title", kind: "aids",     version: "v1", dateKey: "doc3Date", sizeKb: 480,   status: "ready" },
  { id: "d4", titleKey: "doc1Title", kind: "audit",    version: "v2", dateKey: "doc4Date", sizeKb: 2_180, status: "outdated" },
];

const KIND_BADGE_KEYS = {
  audit:    { labelKey: "kindAudit",    color: "bg-teal-100 text-teal-800" },
  scenario: { labelKey: "kindScenario", color: "bg-amber-100 text-amber-800" },
  aids:     { labelKey: "kindAids",     color: "bg-success-100 text-success-800" },
  devis:    { labelKey: "kindDevis",    color: "bg-info-100 text-info-700" },
};

export default function DocumentsPage() {
  const t = useTranslations("pDocs");
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{t("eyebrowDeliverables")}</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-forest-900 sm:text-3xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
            {t("title")}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-forest-900/65">
            {t("subtitle")}
          </p>
        </div>
        <Button variant="primary" size="md">{t("btnGenerate")}</Button>
      </header>

      {/* Preview du dernier rapport */}
      <Card variant="featured">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Vignette PDF */}
          <div aria-hidden className="flex h-64 w-48 shrink-0 items-center justify-center self-center rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 to-white shadow-elevated lg:self-start">
            <div className="text-center">
              <p className="text-3xl">📄</p>
              <p className="mt-2 font-serif text-base font-bold text-forest-900">{t("thumbTitle")}</p>
              <p className="text-2xs text-forest-900/55">{t("thumbDesc")}</p>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-2xs font-semibold uppercase tracking-wider text-forest-700">{t("lastReportEyebrow")}</p>
            <h3 className="mt-1.5 font-serif text-2xl font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              {t("lastReportTitle")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-forest-900/70">
              {t("lastReportDesc")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" size="md">{t("btnDownloadPdf")}</Button>
              <Button variant="secondary" size="md">{t("btnShareLink")}</Button>
              <Button variant="ghost" size="md">{t("btnRegen")}</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Liste historique */}
      <Card>
        <CardHeader>
          <CardTitle>{t("historyTitle")}</CardTitle>
          <CardDescription>{t("historyDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-stone-100">
            {DOCS.map(d => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                <span aria-hidden className="text-2xl">📄</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">{t(d.titleKey)}</p>
                    <span className={["rounded-full px-2 py-0.5 text-2xs font-semibold", KIND_BADGE_KEYS[d.kind].color].join(" ")}>
                      {t(KIND_BADGE_KEYS[d.kind].labelKey)}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-2xs font-mono text-stone-600">{d.version}</span>
                    {d.status === "outdated" && <Badge>{t("obsoleteLabel")}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{t(d.dateKey)} · {(d.sizeKb / 1024).toFixed(1)} Mo</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="secondary" size="sm">{t("btnDownload")}</Button>
                  <Button variant="ghost" size="sm" aria-label={t("ariaMore")}>⋯</Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Note RGPD */}
      <p className="text-center text-xs text-stone-500">
        {t("rgpdNote")}
      </p>
    </div>
  );
}
