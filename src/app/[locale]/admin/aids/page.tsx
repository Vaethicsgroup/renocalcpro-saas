// app/[locale]/admin/aids/page.tsx — Gestion CRUD dispositifs aides
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { getTranslations } from "next-intl/server";

interface Props { params: Promise<{ locale: string }> }

const AIDS = [
  { id: "mpr",  nameKey: "aidMpr",  scopeKey: "scopeNational", validUntil: "31/12/2026", active: true,  beneficiaries: 1_236 },
  { id: "cee",  nameKey: "aidCee",  scopeKey: "scopeNational", validUntil: "30/06/2027", active: true,  beneficiaries: 842 },
  { id: "ptz",  nameKey: "aidPtz",  scopeKey: "scopeNational", validUntil: "31/12/2027", active: true,  beneficiaries: 512 },
  { id: "tva",  nameKey: "aidTva",  scopeKey: "scopeNational", validUntil: "—", active: true,  beneficiaries: 2_180 },
  { id: "rgna", nameKey: "aidRgna", scopeKey: "scopeRegional", validUntil: "31/12/2026", active: true,  beneficiaries: 84 },
  { id: "old",  nameKey: "aidOld",  scopeKey: "scopeNational", validUntil: "31/12/2023", active: false, beneficiaries: 0 },
];

export default async function AidsAdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminAids" });
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-6 shadow-card md:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-amber-800">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t("eyebrow")}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>{t("title")}</h1>
          <p className="mt-1.5 text-sm text-forest-900/70">{t("subtitle", { active: AIDS.filter(a => a.active).length, total: AIDS.length })}</p>
        </div>
        <Button variant="primary" size="md">{t("btnNew")}</Button>
      </header>

      <Card padded={false} className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-2xs uppercase tracking-wider text-forest-700">
            <tr>
              <th className="px-4 py-2.5 text-left">{t("thName")}</th>
              <th className="px-4 py-2.5 text-left">{t("thScope")}</th>
              <th className="px-4 py-2.5 text-left">{t("thValidity")}</th>
              <th className="px-4 py-2.5 text-right">{t("thBeneficiaries")}</th>
              <th className="px-4 py-2.5 text-left">{t("thStatus")}</th>
              <th className="px-4 py-2.5 text-center">{t("thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {AIDS.map(a => (
              <tr key={a.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3 font-semibold">{t(a.nameKey)}</td>
                <td className="px-4 py-3 text-xs text-stone-600">{t(a.scopeKey)}</td>
                <td className="px-4 py-3 text-xs">{a.validUntil}</td>
                <td className="px-4 py-3 text-right tabular-nums">{a.beneficiaries.toLocaleString(locale)}</td>
                <td className="px-4 py-3"><StatusBadge status={a.active ? "success" : "neutral"} size="sm">{a.active ? t("statusActive") : t("statusArchived")}</StatusBadge></td>
                <td className="px-4 py-3 text-center"><Button variant="ghost" size="sm">{t("btnEdit")}</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
