// app/[locale]/admin/professionals/page.tsx — Pros + cabinets + segments
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getTranslations } from "next-intl/server";

interface Props { params: Promise<{ locale: string }> }

const PROS = [
  { id: "p1", name: "Cabinet Dupont",   segmentKey: "segAud",  certifs: ["OPQIBI 1905", "RGE Audit"], seats: 3, mrr: 588 },
  { id: "p2", name: "DPE Express",      segmentKey: "segDiag", certifs: ["AFNOR DPE"],                seats: 5, mrr: 1290 },
  { id: "p3", name: "BE Thermique 33",  segmentKey: "segBe",   certifs: ["OPQIBI 1905", "RGE Études"], seats: 8, mrr: 1290 },
  { id: "p4", name: "Foncia Sud",       segmentKey: "segSyn",  certifs: [],                          seats: 12, mrr: 2580 },
];

export default async function ProfessionalsAdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminPros" });
  const fmt = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-6 shadow-card md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-amber-800">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {t("eyebrow")}
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>{t("title")}</h1>
        <p className="mt-1.5 text-sm text-forest-900/70">{t("subtitle", { count: PROS.length })} <span className="font-semibold text-forest-700">{fmt.format(PROS.reduce((s, p) => s + p.mrr, 0))}</span></p>
      </header>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-2xs uppercase tracking-wider text-forest-700">
              <tr>
                <th className="px-4 py-2.5 text-left">{t("thFirm")}</th>
                <th className="px-4 py-2.5 text-left">{t("thSegment")}</th>
                <th className="px-4 py-2.5 text-left">{t("thCertifs")}</th>
                <th className="px-4 py-2.5 text-right">{t("thSeats")}</th>
                <th className="px-4 py-2.5 text-right">{t("thMrr")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {PROS.map(p => (
                <tr key={p.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3 font-semibold text-stone-900">{p.name}</td>
                  <td className="px-4 py-3 text-xs text-stone-600">{t(p.segmentKey)}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{p.certifs.map(c => <Badge key={c} size="sm">{c}</Badge>)}</div></td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.seats}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{fmt.format(p.mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
