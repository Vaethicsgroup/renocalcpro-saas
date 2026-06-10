// app/[locale]/admin/feature-flags/page.tsx
// Pilotage runtime des feature flags techniques (rollout progressif).

import { listFlags } from "@/lib/featureFlags/runtime";
import { FlagControlForm } from "@/components/admin/FlagControlForm";

export default async function FeatureFlagsAdminPage() {
  const flags = listFlags();

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Ops · Rollout</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Feature flags runtime
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Rollout progressif des features techniques (cohort par hash orgId).
          ⚠ En mémoire process actuellement — multi-instance, basculer sur Redis.
        </p>
      </header>

      <div className="space-y-4">
        {flags.map(f => (
          <article key={f.key} className="rounded-xl border border-stone-200 bg-white p-5">
            <header className="flex items-baseline justify-between">
              <div>
                <h2 className="font-mono text-base font-semibold text-stone-900">{f.key}</h2>
                <p className="mt-1 text-sm text-stone-600">{f.description}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${f.enabled ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-600"}`}>
                  {f.enabled ? "ENABLED" : "DISABLED"}
                </div>
                <div className="mt-1 text-xs text-stone-500">Rollout : <strong>{f.rolloutPercent}%</strong></div>
              </div>
            </header>

            {/* Barre rollout */}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className={f.enabled ? "h-full bg-teal-600" : "h-full bg-stone-300"}
                style={{ width: `${f.rolloutPercent}%` }}
              />
            </div>

            {f.envOverride && (
              <p className="mt-2 text-xs text-stone-500">
                Override env : <code className="rounded bg-stone-100 px-1.5 py-0.5">{f.envOverride}</code>
                {process.env[f.envOverride] != null && (
                  <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 font-semibold text-amber-900">Active : {process.env[f.envOverride]}</span>
                )}
              </p>
            )}

            <FlagControlForm flagKey={f.key} currentEnabled={f.enabled} currentRollout={f.rolloutPercent} />
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>📐 Stratégie de rollout</strong>
        <ul className="mt-2 space-y-1 text-xs">
          <li>1. Désactivé partout → tester en staging avec env override <code>FLAG_X=true</code></li>
          <li>2. Rollout 5 % → orgs internes + amis (cohort déterministe par hash orgId)</li>
          <li>3. Rollout 25 % → ¼ de la base, surveillance Sentry 24h</li>
          <li>4. Rollout 50 % → ½ base, A/B comparison KPI</li>
          <li>5. Rollout 100 % → tous + cleanup du flag dans le code après 30j</li>
        </ul>
      </div>
    </div>
  );
}
