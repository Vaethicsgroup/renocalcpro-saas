// app/[locale]/dev/calc/page.tsx — Démo moteur de calcul v1.0
// Page server : exécute le moteur sur un échantillon réel et affiche les résultats.

import { setRequestLocale } from "next-intl/server";
import { consolidateProjectResult } from "@/lib/calc";
import { SAMPLE_BUILDING, SAMPLE_HOUSEHOLD, SAMPLE_SCENARIOS } from "@/lib/calc/samples/maison-1975";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ locale: string }> }

export default async function CalcDemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = consolidateProjectResult({
    project_id: "demo-maison-1975",
    building: SAMPLE_BUILDING,
    household: SAMPLE_HOUSEHOLD,
    scenarios: SAMPLE_SCENARIOS,
  });

  const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  const eur = (n: number) => `${fmt(n)} €`;

  return (
    <main className="bg-cream-50 pb-20">
      <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-6 sm:pt-14">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-forest-700">Démo moteur métier</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-forest-900 sm:text-4xl"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            Maison 1975 · 110 m² · zone H1a
          </h1>
          <p className="mt-2 text-sm text-forest-900/65">
            Engine v{result.engine_version} · Paramètres v{result.parameters_version} · Calculé {new Date(result.computed_at).toLocaleString("fr-FR")}
          </p>
        </header>

        {/* État initial */}
        <section className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl font-bold text-forest-900">État initial (baseline)</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Étiquette DPE" value={result.baseline.dpe_label} tone="primary" />
            <Kpi label="Étiquette GES" value={result.baseline.ges_label} tone="warning" />
            <Kpi label="UA (W/K)" value={fmt(result.baseline.UA_W_K)} />
            <Kpi label="CEP (kWh EP/m²/an)" value={fmt(result.baseline.cep_kWh_m2_year)} />
            <Kpi label="Besoin chauffage" value={`${fmt(result.baseline.heating_needs_kWh_year)} kWh/an`} />
            <Kpi label="Besoin ECS" value={`${fmt(result.baseline.dhw_needs_kWh_year)} kWh/an`} />
            <Kpi label="Émissions" value={`${fmt(result.baseline.emissions_kgCO2_year)} kgCO₂/an`} />
            <Kpi label="Facture annuelle" value={eur(result.baseline.annual_cost_eur)} tone="primary" />
          </div>
        </section>

        {/* Scénarios */}
        <section className="mt-10">
          <h2 className="font-serif text-xl font-bold text-forest-900">Scénarios calculés</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {result.scenarios.map(s => {
              const isReco = s.scenario_id === result.recommended_scenario_id;
              return (
                <article
                  key={s.scenario_id}
                  className={[
                    "relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
                    isReco ? "border-forest-600 ring-2 ring-forest-600/15" : "border-cream-300",
                  ].join(" ")}
                >
                  {isReco && (
                    <span className="absolute -top-3 left-5 rounded-full bg-forest-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cream-50">
                      ★ Recommandé
                    </span>
                  )}
                  <h3 className="font-serif text-lg font-bold text-forest-900">{s.scenario_name}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Stat label="DPE après" value={s.after.dpe_label} />
                    <Stat label="Gain DPE" value={`+${s.savings.dpe_steps_gained}`} />
                    <Stat label="CEP après" value={`${fmt(s.after.cep_kWh_m2_year)} kWh/m²`} />
                    <Stat label="Écon. annuelle" value={eur(s.savings.energy_eur_year)} positive />
                    <Stat label="Coût travaux" value={eur(s.works_cost_eur)} />
                    <Stat label="Aides MPR+CEE" value={eur(s.aids.total_subsidy_eur)} positive />
                    <Stat label="Reste à charge" value={eur(s.out_of_pocket_eur)} highlight />
                    <Stat label="Retour brut" value={s.payback_years ? `${s.payback_years} ans` : "—"} />
                  </div>
                  <details className="mt-4 text-xs text-forest-900/70">
                    <summary className="cursor-pointer font-semibold text-forest-700">Détail aides</summary>
                    <ul className="mt-2 space-y-1">
                      <li>MPR : {eur(s.aids.mpr_eur)}</li>
                      <li>CEE : {eur(s.aids.cee_eur)}</li>
                      <li>Éco-PTZ éligible : {eur(s.aids.eco_ptz_eligible_eur)}</li>
                    </ul>
                  </details>
                </article>
              );
            })}
          </div>
        </section>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-serif text-base font-bold text-amber-900">Points de vigilance</h2>
            <ul className="mt-3 space-y-2 text-sm text-amber-900/85">
              {result.warnings.map(w => (
                <li key={w.code} className="flex gap-2">
                  <span className="font-bold">[{w.severity}]</span>
                  <span>{w.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Disclaimer */}
        <footer className="mt-10 rounded-2xl border border-dashed border-cream-400 bg-white p-5 text-xs text-forest-900/65">
          <strong>Avertissement :</strong> {result.disclaimer}
        </footer>
      </div>
    </main>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: "primary" | "warning" }) {
  const color = tone === "primary" ? "text-forest-700" : tone === "warning" ? "text-amber-700" : "text-forest-900";
  return (
    <div className="rounded-xl border border-cream-200 bg-cream-50/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-forest-900/60">{label}</p>
      <p className={`mt-1 font-serif text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function Stat({ label, value, positive, highlight }: { label: string; value: string; positive?: boolean; highlight?: boolean }) {
  return (
    <div className={highlight ? "col-span-2 rounded-lg bg-forest-50 px-3 py-2" : ""}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-forest-900/55">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${positive ? "text-emerald-700" : "text-forest-900"}`}>
        {value}
      </p>
    </div>
  );
}
