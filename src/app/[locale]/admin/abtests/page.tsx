// app/[locale]/admin/abtests/page.tsx
// Dashboard A/B tests : conversions par variant + signif stat.

import { prisma } from "@/lib/db/client";
import { compareVariants, type VariantStats } from "@/lib/abtest/stats";

const TESTS = [
  "landing_hero_auditeurs",
  "landing_hero_diagnostiqueurs",
  "landing_hero_copropriete",
  "landing_hero_particuliers",
];

export default async function AbtestsAdminPage() {
  // Pour chaque test, agrège visitors + conversions par variant sur 30 derniers jours
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const comparisons = await Promise.all(TESTS.map(async (testName) => {
    const events = await prisma.abTestEvent.groupBy({
      by: ["variant", "kind"],
      where: { testName, createdAt: { gte: since } },
      _count: { _all: true },
    });

    // Construire VariantStats par variant
    const byVariant = new Map<string, { visitors: number; conversions: number }>();
    for (const e of events) {
      const stats = byVariant.get(e.variant) ?? { visitors: 0, conversions: 0 };
      if (e.kind === "ASSIGNMENT") stats.visitors = e._count._all;
      else if (e.kind === "CONVERSION") stats.conversions = e._count._all;
      byVariant.set(e.variant, stats);
    }

    const variants: VariantStats[] = Array.from(byVariant.entries()).map(([variant, s]) => ({
      variant,
      visitors: s.visitors,
      conversions: s.conversions,
      conversionRate: s.visitors > 0 ? s.conversions / s.visitors : 0,
      conversionRatePct: s.visitors > 0 ? (s.conversions / s.visitors) * 100 : 0,
    }));

    return compareVariants(testName, variants);
  }));

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Ops · Marketing</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          A/B tests
        </h1>
        <p className="mt-1 text-sm text-stone-600">Conversions par variant sur les 30 derniers jours · z-test bilatéral, signif si p &lt; 0.05 + n ≥ 100/variant.</p>
      </header>

      <div className="space-y-6">
        {comparisons.map(c => (
          <article key={c.testName} className="rounded-xl border border-stone-200 bg-white p-5">
            <header className="flex items-baseline justify-between">
              <h2 className="font-mono text-base font-semibold text-stone-900">{c.testName}</h2>
              {c.winner && c.statisticallySignificant ? (
                <span className="rounded bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                  🏆 Winner : {c.winner} (lift {c.liftPct?.toFixed(1)} % · p={c.pValue?.toFixed(4)})
                </span>
              ) : c.variants.length >= 2 ? (
                <span className="rounded bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  Pas encore significatif (besoin n ≥ 100/variant)
                </span>
              ) : (
                <span className="rounded bg-stone-100 px-3 py-1 text-xs text-stone-600">Pas de données</span>
              )}
            </header>

            {c.variants.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">Aucun event collecté sur les 30 derniers jours.</p>
            ) : (
              <table className="mt-4 w-full text-sm">
                <thead className="border-b border-stone-200 text-left text-xs uppercase tracking-wider text-stone-700">
                  <tr>
                    <th className="py-2">Variant</th>
                    <th className="py-2 text-right">Visitors</th>
                    <th className="py-2 text-right">Conversions</th>
                    <th className="py-2 text-right">Conv. rate</th>
                    <th className="py-2">Comparaison</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {c.variants.map((v, i) => {
                    const pct = v.conversionRatePct;
                    const isWinner = c.winner === v.variant;
                    return (
                      <tr key={v.variant} className={isWinner ? "bg-emerald-50/40" : ""}>
                        <td className="py-2 font-mono font-bold">{v.variant}{isWinner && " 🏆"}</td>
                        <td className="py-2 text-right">{v.visitors}</td>
                        <td className="py-2 text-right">{v.conversions}</td>
                        <td className="py-2 text-right font-semibold">
                          <span className={isWinner ? "text-emerald-700" : "text-stone-900"}>{pct.toFixed(2)} %</span>
                        </td>
                        <td className="py-2">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                            <div className={isWinner ? "h-full bg-emerald-600" : "h-full bg-stone-400"}
                                 style={{ width: `${Math.min(100, pct * 5)}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-xs text-amber-900">
        <strong>📊 Méthodo</strong>
        <ul className="mt-2 space-y-1">
          <li>• <strong>Visitors</strong> = nb d'events ASSIGNMENT (chaque visite enregistre 1 fois par cookie)</li>
          <li>• <strong>Conversions</strong> = nb d'events CONVERSION (CTA principal click)</li>
          <li>• <strong>Conv. rate</strong> = conversions / visitors</li>
          <li>• <strong>Z-test bilatéral</strong> sur deux proportions, statistiquement significatif si p &lt; 0.05 ET n ≥ 100 par variant</li>
          <li>• <strong>Lift</strong> = différence relative best vs baseline ((B-A) / A × 100)</li>
        </ul>
      </div>
    </div>
  );
}
