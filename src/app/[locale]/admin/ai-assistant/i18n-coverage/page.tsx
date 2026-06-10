// app/[locale]/admin/ai-assistant/i18n-coverage/page.tsx
// Matrice de couverture i18n du knowledge AI assistant.
// Pour chaque locale (FR/EN/ES/DE/PT) : % traduit + alerte si gap.

import { getI18nCoverage } from "@/lib/ai/assistant/knowledge/i18n";
import { FIELD_HELP } from "@/lib/ai/assistant/knowledge/field-help";
import { AIDS_HELP } from "@/lib/ai/assistant/knowledge/aids-help";

export const dynamic = "force-dynamic";

const LOCALES = ["fr", "en", "es", "de", "pt"] as const;
type Locale = (typeof LOCALES)[number];

const LOCALE_LABELS: Record<Locale, string> = {
  fr: "🇫🇷 Français",
  en: "🇬🇧 English",
  es: "🇪🇸 Español",
  de: "🇩🇪 Deutsch",
  pt: "🇵🇹 Português",
};

export default function I18nCoveragePage() {
  const coverage = getI18nCoverage();
  const totalFields = Object.keys(FIELD_HELP).length;
  const totalAids = Object.keys(AIDS_HELP).length;

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Assistant IA · i18n</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Couverture i18n du knowledge AI
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Total à traduire : {totalFields} champs FIELD_HELP + {totalAids} aides AIDS_HELP = {totalFields + totalAids} entrées par langue.
        </p>
      </header>

      {/* Matrice principale */}
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50">
            <tr className="border-b border-stone-200">
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Langue</th>
              <th className="px-4 py-3 text-right font-semibold text-stone-700">FIELD_HELP</th>
              <th className="px-4 py-3 text-right font-semibold text-stone-700">AIDS_HELP</th>
              <th className="px-4 py-3 text-right font-semibold text-stone-700">Total</th>
              <th className="px-4 py-3 text-right font-semibold text-stone-700">% Couverture</th>
              <th className="px-4 py-3 text-left font-semibold text-stone-700">Statut</th>
            </tr>
          </thead>
          <tbody>
            {LOCALES.map(loc => {
              const c = coverage[loc];
              const status = statusFor(c.pct);
              return (
                <tr key={loc} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-900">{LOCALE_LABELS[loc]}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{c.fields} / {totalFields}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{c.aids} / {totalAids}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{c.total} / {totalFields + totalAids}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-stone-200">
                        <div className={`h-full ${status.barColor}`} style={{ width: `${c.pct}%` }} />
                      </div>
                      <span className="w-10 text-right font-semibold text-stone-900">{c.pct}%</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold ${status.textColor}`}>{status.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Lecture */}
      <section className="mt-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>📋 Lecture</strong>
        <ul className="mt-2 space-y-1 text-xs">
          <li>• FR = source de vérité (100 % par construction).</li>
          <li>• Seuils : ≥ 80 % = production-ready, 30-80 % = MVP partiel (fallback FR), &lt; 30 % = chantier prioritaire.</li>
          <li>• En cas de gap, l'API retourne automatiquement la version FR — l'utilisateur n'est jamais bloqué.</li>
          <li>• Pour ajouter une traduction : éditer <code>lib/ai/assistant/knowledge/i18n.ts</code> et relancer les tests.</li>
        </ul>
      </section>

      {/* Champs critiques manquants */}
      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">Priorités de traduction (impact résultat élevé)</h2>
        <p className="mt-1 text-xs text-stone-600">
          Les champs marqués <code>impactOnResult: "high"</code> doivent être traduits en priorité — ils influencent
          fortement le calcul DPE / coût / aides.
        </p>
        <ul className="mt-3 space-y-1 text-xs">
          {Object.values(FIELD_HELP)
            .filter(f => f.impactOnResult === "high")
            .map(f => (
              <li key={f.ref} className="font-mono text-stone-600">
                <span className="font-semibold text-stone-900">{f.ref}</span> — {f.label}
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

function statusFor(pct: number): { label: string; barColor: string; textColor: string } {
  if (pct >= 80) return { label: "Production-ready", barColor: "bg-emerald-500", textColor: "text-emerald-700" };
  if (pct >= 30) return { label: "MVP partiel", barColor: "bg-amber-500", textColor: "text-amber-700" };
  if (pct > 0) return { label: "Démarrage", barColor: "bg-orange-500", textColor: "text-orange-700" };
  return { label: "À faire", barColor: "bg-stone-300", textColor: "text-stone-500" };
}
