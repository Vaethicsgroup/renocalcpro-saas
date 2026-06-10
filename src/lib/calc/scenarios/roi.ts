// src/lib/calc/scenarios/roi.ts
// ════════════════════════════════════════════════════════════════════════════
// Calcul ROI multi-horizon basé sur :
//   - les factures réelles saisies par l'utilisateur (€/an, kWh/an, L/an)
//   - les économies modélisées après travaux
//   - le coût net (RAC HT) après aides
//
// Pure functions, pas de side-effect. Le composant UI consomme ces helpers
// pour afficher payback + cumul sur 5/10/15/20 ans.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Factures actuelles saisies par l'utilisateur. Permet de calibrer la
 * baseline réelle (vs baseline modélisée), avec inflation énergie annuelle.
 */
export interface UserBills {
  electricity_eur_year?: number;
  electricity_kWh_year?: number;
  gas_eur_year?: number;
  gas_kWh_year?: number;
  fuel_oil_eur_year?: number;
  fuel_oil_L_year?: number;
  wood_eur_year?: number;
  wood_steres_year?: number;
  district_heat_eur_year?: number;
}

/** Hypothèses pour projection ROI. */
export interface RoiAssumptions {
  /** Inflation annuelle des prix de l'énergie (%/an). Défaut : 4 %. */
  energyInflationPctYear: number;
  /** Horizons d'analyse (années). Défaut : [5, 10, 15, 20]. */
  horizons: ReadonlyArray<number>;
}

export const DEFAULT_ROI_ASSUMPTIONS: RoiAssumptions = {
  energyInflationPctYear: 4,
  horizons: [5, 10, 15, 20],
};

/** Coût annuel total des factures utilisateur (€/an). */
export function totalCurrentBills(bills: UserBills): number {
  return (
    (bills.electricity_eur_year ?? 0) +
    (bills.gas_eur_year ?? 0) +
    (bills.fuel_oil_eur_year ?? 0) +
    (bills.wood_eur_year ?? 0) +
    (bills.district_heat_eur_year ?? 0)
  );
}

/** Consommation finale équivalente (kWh EF/an) si l'utilisateur a saisi
 * les volumes. PCI : fioul 9.8 kWh/L, bois bûche 1800 kWh/stère. */
export function totalCurrentConsumption_kWh(bills: UserBills): number {
  const fuelKwh = (bills.fuel_oil_L_year ?? 0) * 9.8;
  const woodKwh = (bills.wood_steres_year ?? 0) * 1800;
  return (
    (bills.electricity_kWh_year ?? 0) +
    (bills.gas_kWh_year ?? 0) +
    fuelKwh +
    woodKwh
  );
}

export interface RoiHorizonItem {
  horizonYears: number;
  /** Économies cumulées sur la durée (inflation incluse, €). */
  cumulativeSavings_eur: number;
  /** Bilan net : économies − coût travaux (€). Positif = rentable. */
  netBalance_eur: number;
  /** Indique si l'horizon dépasse le seuil de rentabilité. */
  isProfitable: boolean;
}

/**
 * Projette les économies annuelles avec inflation composée, et compare au RAC.
 *
 * @param annualSavings_eur économie annuelle estimée (€/an, base T0)
 * @param netCostAfterAids_eur reste à charge HT après aides (€)
 * @param assumptions hypothèses (inflation, horizons)
 */
export function projectRoi(
  annualSavings_eur: number,
  netCostAfterAids_eur: number,
  assumptions: RoiAssumptions = DEFAULT_ROI_ASSUMPTIONS,
): {
  paybackYears: number | null;
  horizons: ReadonlyArray<RoiHorizonItem>;
} {
  const r = assumptions.energyInflationPctYear / 100;

  // Payback exact : on cherche l'année n telle que somme cumulée >= coût
  let payback: number | null = null;
  let cum = 0;
  for (let y = 1; y <= 50; y++) {
    cum += annualSavings_eur * Math.pow(1 + r, y - 1);
    if (cum >= netCostAfterAids_eur && payback === null) {
      // Interpolation linéaire pour précision sub-annuelle
      const cumPrev = cum - annualSavings_eur * Math.pow(1 + r, y - 1);
      const fraction =
        cumPrev >= netCostAfterAids_eur
          ? 0
          : (netCostAfterAids_eur - cumPrev) /
            (annualSavings_eur * Math.pow(1 + r, y - 1));
      payback = y - 1 + fraction;
      break;
    }
  }

  const horizons: RoiHorizonItem[] = assumptions.horizons.map((h) => {
    // Somme géométrique : S = a × ((1+r)^n − 1) / r si r > 0
    const cumSav =
      r === 0
        ? annualSavings_eur * h
        : (annualSavings_eur * (Math.pow(1 + r, h) - 1)) / r;
    return {
      horizonYears: h,
      cumulativeSavings_eur: cumSav,
      netBalance_eur: cumSav - netCostAfterAids_eur,
      isProfitable: cumSav >= netCostAfterAids_eur,
    };
  });

  return { paybackYears: payback, horizons };
}

/**
 * Calcule les économies annuelles réelles basées sur les factures saisies
 * par l'utilisateur + le taux de réduction de consommation modélisé.
 *
 * @param currentBills_eur factures actuelles totales (€/an)
 * @param consumptionReductionRatio taux de réduction (0..1, ex : 0.6 = -60 %)
 */
export function estimateRealAnnualSavings(
  currentBills_eur: number,
  consumptionReductionRatio: number,
): number {
  return currentBills_eur * consumptionReductionRatio;
}
