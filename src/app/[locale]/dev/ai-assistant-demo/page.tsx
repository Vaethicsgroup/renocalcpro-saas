// app/[locale]/dev/ai-assistant-demo/page.tsx
// Page démo pour tester l'assistant IA en interne (équipe + QA).
// Montre les 3 patterns d'intégration : FieldHelper inline, ouverture programmatique, boutons section.

"use client";

import { AssistantProvider, AssistantPanel, AssistantFloater, FieldHelper, useAssistant } from "@/components/ai-assistant";

function DemoForm() {
  const { open } = useAssistant();
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <header>
        <h1 className="font-serif text-2xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Démo Assistant IA métier
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Cette page démontre les 3 patterns d'intégration de l'assistant : icône d'aide inline,
          ouverture programmatique sur une section, et raccourcis "Aide-moi à choisir".
        </p>
      </header>

      {/* Pattern 1 : FieldHelper inline */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">Pattern 1 — Icône d'aide inline (FORM_FIELD)</h2>
        <p className="mt-1 text-xs text-stone-600">
          Le composant <code>&lt;FieldHelper fieldRef="…"/&gt;</code> ajoute un petit "?" à côté du label.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-900">
              Surface habitable (m²)
              <FieldHelper fieldRef="project.surfaceM2" fieldLabel="Surface habitable" className="ml-2" />
            </label>
            <input type="number" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" placeholder="120" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900">
              Année de construction
              <FieldHelper fieldRef="project.constructionYear" fieldLabel="Année de construction" className="ml-2" />
            </label>
            <input type="number" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" placeholder="1975" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900">
              Matériau des murs extérieurs
              <FieldHelper fieldRef="envelope.walls.materialKey" fieldLabel="Matériau des murs" className="ml-2" />
            </label>
            <select className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm">
              <option>— Choisir —</option>
              <option>Pierre de taille</option>
              <option>Moellons</option>
              <option>Parpaing</option>
              <option>Brique creuse</option>
              <option>Brique pleine</option>
            </select>
          </div>
        </div>
      </section>

      {/* Pattern 2 : Section Help */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">Pattern 2 — Bouton sur section entière (FORM_SECTION)</h2>
        <p className="mt-1 text-xs text-stone-600">
          Ouvre l'assistant avec contexte = la section complète + checklist + pièges.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["project", "envelope", "systems", "scenarios", "aids"].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => open({ contextType: "FORM_SECTION", contextRef: s, contextLabel: labelForSection(s) })}
              className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100"
            >
              💡 Aide section "{labelForSection(s)}"
            </button>
          ))}
        </div>
      </section>

      {/* Pattern 3 : Choice help */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">Pattern 3 — Aide au choix (CHOICE_HELP)</h2>
        <p className="mt-1 text-xs text-stone-600">
          Comparateur structuré : avantages / inconvénients / coûts / aides par option.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => open({ contextType: "CHOICE_HELP", contextRef: "wall_insulation", contextLabel: "Quel isolant murs ?" })}
            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          >
            ⚖️ Quel isolant pour mes murs ?
          </button>
          <button
            type="button"
            onClick={() => open({ contextType: "CHOICE_HELP", contextRef: "heating_change_for_oil_house", contextLabel: "Remplacer ma chaudière fioul" })}
            className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          >
            ⚖️ Remplacer ma chaudière fioul
          </button>
        </div>
      </section>

      {/* Pattern 4 : Recognize */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">Pattern 4 — Aide reconnaissance (MATERIAL_RECOGNIZE)</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => open({ contextType: "MATERIAL_RECOGNIZE", contextRef: "wall:moellons", contextLabel: "Reconnaître moellons" })}
            className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            🔎 Comment reconnaître des moellons ?
          </button>
          <button
            type="button"
            onClick={() => open({ contextType: "SYSTEM_RECOGNIZE", contextRef: "heating:pac_air_eau", contextLabel: "PAC air-eau" })}
            className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            🔎 PAC air-eau ou clim réversible ?
          </button>
        </div>
      </section>

      {/* Pattern 5 : Aid explain */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">Pattern 5 — Comprendre une aide (AID_EXPLAIN)</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {["mpr_classique", "mpr_serenite", "cee_coup_pouce_chauffage", "eco_ptz", "tva_reduite"].map(a => (
            <button
              key={a}
              type="button"
              onClick={() => open({ contextType: "AID_EXPLAIN", contextRef: a, contextLabel: a })}
              className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
            >
              💶 {a.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function labelForSection(s: string): string {
  return ({
    project: "Identification",
    envelope: "Enveloppe",
    systems: "Systèmes",
    scenarios: "Scénarios",
    aids: "Aides",
    results: "Résultats",
  } as Record<string, string>)[s] ?? s;
}

export default function AiAssistantDemoPage() {
  return (
    <AssistantProvider initialPersona="INDIVIDUAL">
      <DemoForm />
      <AssistantPanel />
      <AssistantFloater />
    </AssistantProvider>
  );
}
