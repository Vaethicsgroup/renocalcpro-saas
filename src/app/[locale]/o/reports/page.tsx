// app/[locale]/o/reports/page.tsx — Bibliothèque rapports générés pro
"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const REPORTS = [
  { id: "r1", project: "Maison Martin",  templateKey: "tplAuditPart", date: new Date("2026-05-08"), pages: 28, sizeMb: 2.3 },
  { id: "r2", project: "Copro Tilleuls", templateKey: "tplDpeCol",    date: new Date("2026-05-05"), pages: 36, sizeMb: 4.1 },
  { id: "r3", project: "Bureau ABC",     templateKey: "tplAuditTert", date: new Date("2026-05-03"), pages: 32, sizeMb: 3.5 },
  { id: "r4", project: "Maison Dubois",  templateKey: "tplAuditPart", date: new Date("2026-04-28"), pages: 26, sizeMb: 2.1 },
];

export default function ReportsLibPage() {
  const t = useTranslations("oReports");
  const locale = useLocale();
  const totalSize = REPORTS.reduce((s, r) => s + r.sizeMb, 0).toFixed(1);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>{t("title")}</h1>
          <p className="mt-1 text-sm text-stone-600">{t("headerCount", { count: REPORTS.length, sizeMb: totalSize })}</p>
        </div>
        <Button variant="secondary" size="md">{t("btnExportZip")}</Button>
      </header>

      <Card padded={false} className="overflow-hidden">
        <div className="border-b border-stone-200 p-4">
          <input type="search" placeholder={t("searchPh")} className="h-9 w-full max-w-sm rounded-md border border-stone-300 px-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200/40" />
        </div>
        <ul className="divide-y divide-stone-100">
          {REPORTS.map(r => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 p-4 hover:bg-stone-50/50">
              <span aria-hidden className="text-2xl">📄</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-stone-900">{r.project}</p>
                  <Badge size="sm">{t(r.templateKey)}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">{t("metaInfo", { date: fmtDate(r.date), pages: r.pages, sizeMb: r.sizeMb })}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="secondary" size="sm">{t("btnDownload")}</Button>
                <Button variant="ghost" size="sm">{t("btnPreview")}</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
