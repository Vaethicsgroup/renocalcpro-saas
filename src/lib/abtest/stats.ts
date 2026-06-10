// lib/abtest/stats.ts
// Calcul de significativité statistique pour A/B test (proportion test, two-sided z-test).

export interface VariantStats {
  variant: string;
  visitors: number;
  conversions: number;
  conversionRate: number;        // 0..1
  conversionRatePct: number;     // 0..100
}

export interface AbTestComparison {
  testName: string;
  variants: VariantStats[];
  winner: string | null;
  /** Différence relative en % (B vs A : (B-A)/A × 100) */
  liftPct: number | null;
  /** P-value du z-test deux variantes — utile pour > 1000 visiteurs/variante */
  pValue: number | null;
  /** True si p < 0.05 ET échantillon ≥ 100 par variant */
  statisticallySignificant: boolean;
}

/**
 * Z-test pour différence de proportions (two-sided).
 * Retourne la p-value approximative.
 */
function zTestProportions(p1: number, n1: number, p2: number, n2: number): number {
  if (n1 === 0 || n2 === 0) return 1;
  const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return 1;
  const z = (p2 - p1) / se;
  // Approximation cumulative normale (Abramowitz)
  return 2 * (1 - normalCdf(Math.abs(z)));
}

function normalCdf(z: number): number {
  // Erf approximation (Abramowitz & Stegun 7.1.26)
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * z);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
  return 0.5 * (1 + sign * y);
}

export function compareVariants(testName: string, variants: VariantStats[]): AbTestComparison {
  if (variants.length < 2) {
    return { testName, variants, winner: null, liftPct: null, pValue: null, statisticallySignificant: false };
  }

  const sorted = [...variants].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const baseline = sorted[sorted.length - 1];

  if (best.visitors < 50 || baseline.visitors < 50) {
    return { testName, variants: sorted, winner: null, liftPct: null, pValue: null, statisticallySignificant: false };
  }

  const lift = baseline.conversionRate > 0
    ? ((best.conversionRate - baseline.conversionRate) / baseline.conversionRate) * 100
    : 0;

  const pValue = zTestProportions(
    baseline.conversionRate, baseline.visitors,
    best.conversionRate, best.visitors,
  );

  const significant = pValue < 0.05 && best.visitors >= 100 && baseline.visitors >= 100;

  return {
    testName,
    variants: sorted,
    winner: significant ? best.variant : null,
    liftPct: lift,
    pValue,
    statisticallySignificant: significant,
  };
}
