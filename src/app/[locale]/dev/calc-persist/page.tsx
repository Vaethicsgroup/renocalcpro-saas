// app/[locale]/dev/calc-persist/page.tsx — Démo persistance moteur v1.0
// Exécute saveProjectCalcSnapshot sur l'échantillon, puis affiche le retour
// (snapshot persisté OU diagnostic clair si DB indisponible). Page server.

import { setRequestLocale } from "next-intl/server";
import {
  saveProjectCalcSnapshot, getLatestProjectCalcSnapshot, listProjectCalcSnapshots,
} from "@/server/actions/projectCalc";
import {
  SAMPLE_BUILDING, SAMPLE_HOUSEHOLD, SAMPLE_SCENARIOS,
} from "@/lib/calc/samples/maison-1975";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ locale: string }> }

const DEMO_ORG_ID = "demo-org";
const DEMO_PROJECT_ID = "demo-project-maison-1975";

export default async function CalcPersistDemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 1. Tente de persister un nouveau snapshot
  const saveRes = await saveProjectCalcSnapshot({
    organizationId: DEMO_ORG_ID,
    projectId: DEMO_PROJECT_ID,
    building: SAMPLE_BUILDING,
    household: SAMPLE_HOUSEHOLD,
    scenarios: SAMPLE_SCENARIOS,
    notes: "Demo automatique /dev/calc-persist",
  });

  // 2. Récupère le snapshot le plus récent
  const latestRes = await getLatestProjectCalcSnapshot(DEMO_PROJECT_ID);

  // 3. Liste paginée
  const listRes = await listProjectCalcSnapshots(DEMO_PROJECT_ID, { limit: 5 });

  const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  const eur = (n: number) => `${fmt(n)} €`;

  return (
    <main className="bg-cream-50 pb-20">
      <div className="mx-auto max-w-5xl px-5 pt-10 sm:px-6 sm:pt-14">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-forest-700">Démo persistance moteur</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-forest-900 sm:text-4xl"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            ProjectCalcSnapshot · Prisma
          </h1>
          <p className="mt-2 text-sm text-forest-900/65">
            Page de validation : calcule + persiste + relit. Affiche diagnostic clair si la DB n'est pas branchée.
          </p>
        </header>

        {/* Bloc 1 : résultat sauvegarde */}
        <Section title="1. Sauvegarde nouveau snapshot">
          {saveRes.ok ? (
            <Ok>
              <p><strong>Snapshot persisté :</strong> id <code className="rounded bg-forest-100 px-1.5 py-0.5">{saveRes.snapshotId}</code></p>
              <p className="mt-2">Engine : <code>{saveRes.result.engine_version}</code> · Params : <code>{saveRes.result.parameters_version}</code></p>
              <p className="mt-1">DPE baseline : <strong>{saveRes.result.baseline.dpe_label}</strong> · CEP {fmt(saveRes.result.baseline.cep_kWh_m2_year)} kWh/m²/an · Facture {eur(saveRes.result.baseline.annual_cost_eur)}</p>
              <p className="mt-1">{saveRes.result.scenarios.length} scénarios · {saveRes.result.warnings.length} warnings · recommandé : <code>{saveRes.result.recommended_scenario_id}</code></p>
            </Ok>
          ) : (
            <Err code={saveRes.code}>
              <p><strong>Erreur :</strong> {saveRes.error}</p>
              <p className="mt-2 text-xs">Code : <code>{saveRes.code}</code></p>
              {saveRes.code === "DB_UNAVAILABLE" && (
                <p className="mt-2 text-xs text-amber-800">
                  Normal en dev sans DATABASE_URL. Le moteur a bien calculé, mais aucun enregistrement n'a été créé.
                  Pour activer la persistance, configurez <code>.env.local</code> avec <code>DATABASE_URL</code>
                  pointant sur une PostgreSQL puis lancez <code>npx prisma migrate dev</code>.
                </p>
              )}
            </Err>
          )}
        </Section>

        {/* Bloc 2 : relecture latest */}
        <Section title="2. Relecture du snapshot le plus récent">
          {latestRes.ok ? (
            <Ok>
              <p><strong>Snapshot trouvé :</strong> {latestRes.summary.id}</p>
              <p className="mt-1 text-xs text-forest-900/70">Calculé le {new Date(latestRes.summary.computedAt).toLocaleString("fr-FR")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
                <KV label="DPE" value={latestRes.summary.baselineDpeLabel} />
                <KV label="GES" value={latestRes.summary.baselineGesLabel} />
                <KV label="CEP kWh/m²" value={fmt(latestRes.summary.baselineCepKwhM2)} />
                <KV label="Coût €/an" value={eur(latestRes.summary.baselineCostEur)} />
                <KV label="Scénarios" value={String(latestRes.summary.scenariosCount)} />
                <KV label="Warnings" value={String(latestRes.summary.warningsCount)} />
              </div>
            </Ok>
          ) : (
            <Err code="NOT_FOUND">
              <p>{latestRes.error}</p>
              <p className="mt-2 text-xs">Normal si bloc 1 ci-dessus a échoué (DB non branchée).</p>
            </Err>
          )}
        </Section>

        {/* Bloc 3 : liste */}
        <Section title="3. Historique des snapshots (5 derniers)">
          {listRes.ok ? (
            listRes.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-cream-100 text-left text-xs uppercase tracking-wider text-forest-700">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Engine</th>
                      <th className="px-3 py-2">DPE</th>
                      <th className="px-3 py-2">CEP</th>
                      <th className="px-3 py-2">Coût</th>
                      <th className="px-3 py-2">Scénarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listRes.items.map(s => (
                      <tr key={s.id} className="border-t border-cream-200">
                        <td className="px-3 py-2">{new Date(s.computedAt).toLocaleString("fr-FR")}</td>
                        <td className="px-3 py-2 tabular-nums">{s.engineVersion}</td>
                        <td className="px-3 py-2 font-bold">{s.baselineDpeLabel}</td>
                        <td className="px-3 py-2 tabular-nums">{fmt(s.baselineCepKwhM2)}</td>
                        <td className="px-3 py-2 tabular-nums">{eur(s.baselineCostEur)}</td>
                        <td className="px-3 py-2 tabular-nums">{s.scenariosCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-forest-900/55">Total en base : {listRes.total}</p>
              </div>
            ) : (
              <p className="text-sm text-forest-900/70">Aucun snapshot encore persisté. Configurez DATABASE_URL pour activer la persistance.</p>
            )
          ) : (
            <Err code="LIST_ERROR"><p>{listRes.error}</p></Err>
          )}
        </Section>

        {/* Footer */}
        <footer className="mt-10 rounded-2xl border border-dashed border-cream-400 bg-white p-5 text-xs text-forest-900/65">
          <strong>Note :</strong> cette page utilise <code>SAMPLE_BUILDING</code> (jeu de données statique).
          En production, les inputs viendront du formulaire utilisateur via les modèles Project/Building existants.
          La persistance est isolée du moteur (pure functions) : le moteur tourne toujours même si la DB est indisponible.
        </footer>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 rounded-2xl border border-cream-300 bg-white p-6 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-forest-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Ok({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{children}</div>;
}

function Err({ children, code }: { children: React.ReactNode; code: string }) {
  const tone = code === "DB_UNAVAILABLE" || code === "NOT_FOUND"
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : "border-rose-200 bg-rose-50 text-rose-900";
  return <div className={`rounded-xl border p-4 text-sm ${tone}`}>{children}</div>;
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-cream-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-forest-900/55">{label}</p>
      <p className="mt-0.5 font-semibold text-forest-900 tabular-nums">{value}</p>
    </div>
  );
}
