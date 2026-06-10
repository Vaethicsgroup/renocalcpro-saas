// app/[locale]/admin/beta/page.tsx
// Page admin : table des candidatures beta avec actions accept/reject.

import { prisma } from "@/lib/db/client";
import { BetaActionButtons } from "@/components/admin/BetaActionButtons";
import { getBetaCounters } from "@/server/actions/beta";
import { getTranslations } from "next-intl/server";

interface Props { searchParams: Promise<{ status?: string; segment?: string }>; params: Promise<{ locale: string }> }

export default async function BetaAdminPage({ searchParams, params }: Props) {
  const sp = await searchParams;
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminBeta" });
  const counters = await getBetaCounters();

  const where = {
    ...(sp.status ? { status: sp.status as "PENDING" | "ACCEPTED" | "REJECTED" } : {}),
    ...(sp.segment ? { segment: sp.segment as "AUDITEUR" | "DIAGNOSTIQUEUR" | "SYNDIC" | "COPROPRIETAIRE" | "PARTICULIER" | "AUTRE" } : {}),
  };

  const apps = await prisma.betaApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">{t("eyebrow")}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle", { accepted: counters.accepted, quota: counters.quota, pending: counters.pending })}</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI value={counters.pending}  label={t("kpiPending")}   color="text-amber-700" />
        <KPI value={counters.accepted} label={t("kpiAccepted")}  color="text-emerald-700" />
        <KPI value={counters.rejected} label={t("kpiRejected")}  color="text-rose-700" />
        <KPI value={counters.remaining} label={t("kpiRemaining")} color="text-teal-700" />
      </div>

      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border border-stone-300 px-2 py-1 text-sm">
          <option value="">{t("filterAllStatus")}</option>
          <option value="PENDING">{t("statusPending")}</option>
          <option value="ACCEPTED">{t("statusAccepted")}</option>
          <option value="REJECTED">{t("statusRejected")}</option>
        </select>
        <select name="segment" defaultValue={sp.segment ?? ""} className="rounded border border-stone-300 px-2 py-1 text-sm">
          <option value="">{t("filterAllSegments")}</option>
          <option value="AUDITEUR">{t("segAud")}</option>
          <option value="DIAGNOSTIQUEUR">{t("segDiag")}</option>
          <option value="SYNDIC">{t("segSyn")}</option>
          <option value="COPROPRIETAIRE">{t("segCopro")}</option>
          <option value="PARTICULIER">{t("segPart")}</option>
          <option value="AUTRE">{t("segOther")}</option>
        </select>
        <button type="submit" className="rounded bg-rose-700 px-3 py-1 text-xs font-semibold text-white">{t("btnFilter")}</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-700">
            <tr>
              <th className="px-3 py-2.5">{t("thDate")}</th>
              <th className="px-3 py-2.5">{t("thEmail")}</th>
              <th className="px-3 py-2.5">{t("thName")}</th>
              <th className="px-3 py-2.5">{t("thSegment")}</th>
              <th className="px-3 py-2.5">{t("thStatus")}</th>
              <th className="px-3 py-2.5">{t("thExpectations")}</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {apps.map(a => (
              <tr key={a.id}>
                <td className="px-3 py-2 text-xs text-stone-600">{a.createdAt.toLocaleDateString(locale)}</td>
                <td className="px-3 py-2 text-xs">{a.email}</td>
                <td className="px-3 py-2 text-xs">{a.fullName}</td>
                <td className="px-3 py-2 text-xs"><span className="rounded bg-stone-100 px-2 py-0.5">{a.segment}</span></td>
                <td className="px-3 py-2 text-xs">
                  <span className={`rounded px-2 py-0.5 font-semibold ${
                    a.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-900" :
                    a.status === "REJECTED" ? "bg-rose-100 text-rose-900" :
                    "bg-amber-100 text-amber-900"
                  }`}>{a.status}</span>
                </td>
                <td className="px-3 py-2 max-w-md truncate text-xs text-stone-700" title={a.expectations}>{a.expectations}</td>
                <td className="px-3 py-2 text-right">
                  {a.status === "PENDING" && <BetaActionButtons applicationId={a.id} />}
                </td>
              </tr>
            ))}
            {apps.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-stone-500">{t("emptyState")}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPI({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-stone-600">{label}</div>
    </div>
  );
}
