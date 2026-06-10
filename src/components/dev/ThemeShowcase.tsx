// components/dev/ThemeShowcase.tsx
// Vitrine du design system Réno·Calc Pro v2.0.
// Affiche tous les tokens : palette, typo, espacements, ombres, radii, composants.
// Accessible via /[locale]/dev/design-system pour QA visuel.

const PALETTES = {
  Teal: { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#042f2e" },
  Sage: { 50: "#f6f7f5", 100: "#e9ecdf", 200: "#d9dec6", 300: "#bdc7a3", 400: "#9faf80", 500: "#86916b", 600: "#6b7654", 700: "#5a6240", 800: "#454d31", 900: "#3a4029" },
  Stone: { 50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e", 500: "#78716c", 700: "#44403c", 900: "#1c1917" },
  Amber: { 50: "#fffbeb", 100: "#fef3c7", 400: "#fbbf24", 500: "#f59e0b", 700: "#b45309" },
  Copper: { 100: "#fde7d3", 600: "#a16207" },
  Success: { 50: "#f0fdf4", 600: "#16a34a", 700: "#15803d" },
  Warning: { 50: "#fffbeb", 500: "#f59e0b", 700: "#b45309" },
  Error: { 50: "#fef2f2", 600: "#dc2626", 700: "#b91c1c" },
  Info: { 50: "#eff6ff", 600: "#2563eb", 700: "#1d4ed8" },
} as const;

const TYPE_SCALE = [
  { name: "text-7xl", size: "72px", sample: "Hero principal" },
  { name: "text-6xl", size: "60px", sample: "Hero secondaire" },
  { name: "text-5xl", size: "48px", sample: "H1 marketing" },
  { name: "text-4xl", size: "36px", sample: "H1 dashboard" },
  { name: "text-3xl", size: "30px", sample: "H2" },
  { name: "text-2xl", size: "24px", sample: "H3" },
  { name: "text-xl",  size: "20px", sample: "H4 / sous-titre" },
  { name: "text-lg",  size: "18px", sample: "Lead paragraph" },
  { name: "text-base", size: "16px", sample: "Body marketing" },
  { name: "text-sm",  size: "14px", sample: "Body UI" },
  { name: "text-xs",  size: "12px", sample: "Notes, captions" },
];

const RADII = [
  { name: "rounded-none", value: "0px" },
  { name: "rounded-sm", value: "2px" },
  { name: "rounded", value: "6px" },
  { name: "rounded-md", value: "8px" },
  { name: "rounded-lg", value: "12px" },
  { name: "rounded-xl", value: "16px" },
  { name: "rounded-2xl", value: "20px" },
  { name: "rounded-3xl", value: "24px" },
];

const SHADOWS = [
  { name: "shadow-soft",     usage: "Cards par défaut" },
  { name: "shadow-elevated", usage: "Hover, dropdowns" },
  { name: "shadow-floating", usage: "Modals, panels" },
];

const SPACING = [
  { token: "1", px: 4 }, { token: "2", px: 8 }, { token: "3", px: 12 },
  { token: "4", px: 16 }, { token: "5", px: 20 }, { token: "6", px: 24 },
  { token: "8", px: 32 }, { token: "10", px: 40 }, { token: "12", px: 48 },
  { token: "16", px: 64 }, { token: "20", px: 80 }, { token: "24", px: 96 },
];

export function ThemeShowcase() {
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-6 py-12">
      <header className="border-b border-stone-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Design System</p>
        <h1 className="mt-2 font-serif text-5xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          Réno·Calc Pro — Premium v2.0
        </h1>
        <p className="mt-3 max-w-3xl text-lg text-stone-600">
          Vitrine complète du design system : palette, typographie, espacements, ombres, arrondis, composants.
          Toute modification doit passer par <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">docs/DESIGN-SYSTEM.md</code>.
        </p>
      </header>

      {/* Palette */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Palette</h2>
        <div className="space-y-8">
          {Object.entries(PALETTES).map(([name, shades]) => (
            <div key={name}>
              <h3 className="mb-3 text-sm font-semibold text-stone-700">{name}</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(shades).map(([weight, hex]) => (
                  <div key={weight} className="flex flex-col items-center text-xs">
                    <div
                      className="h-16 w-16 rounded-lg border border-stone-200 shadow-sm"
                      style={{ backgroundColor: hex }}
                      title={`${name.toLowerCase()}-${weight}`}
                    />
                    <span className="mt-1 font-mono text-2xs text-stone-600">{weight}</span>
                    <span className="font-mono text-2xs text-stone-400">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typographie */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Typographie</h2>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-stone-500">Famille titres</p>
            <p className="font-serif text-2xl text-stone-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
              Source Serif 4 — La rénovation énergétique sans approximation.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500">Famille UI</p>
            <p className="text-2xl text-stone-900">
              Inter — The quick brown fox jumps over the lazy dog. 0123456789
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {TYPE_SCALE.map(t => (
              <div key={t.name} className="flex items-baseline gap-4 border-b border-stone-100 pb-2 last:border-0">
                <span className="w-32 font-mono text-xs text-stone-500">{t.name}</span>
                <span className="w-16 font-mono text-xs text-stone-400">{t.size}</span>
                <span className={t.name + " text-stone-900"}>{t.sample}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Espacements */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Espacements (échelle 4px)</h2>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft">
          <div className="space-y-2">
            {SPACING.map(s => (
              <div key={s.token} className="flex items-center gap-4 text-sm">
                <span className="w-12 font-mono text-xs text-stone-500">{s.token}</span>
                <span className="w-12 font-mono text-xs text-stone-400">{s.px}px</span>
                <div className="h-6 rounded bg-teal-300" style={{ width: `${s.px}px` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arrondis */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Arrondis</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {RADII.map(r => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div
                className={`h-20 w-20 border border-stone-200 bg-teal-100 ${r.name}`}
                title={r.name}
              />
              <span className="font-mono text-xs text-stone-700">{r.name}</span>
              <span className="font-mono text-2xs text-stone-400">{r.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Ombres */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Ombres</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {SHADOWS.map(s => (
            <div key={s.name} className="flex flex-col items-center gap-3">
              <div className={`flex h-32 w-full items-center justify-center rounded-xl bg-white ${s.name}`}>
                <span className="font-mono text-xs text-stone-500">{s.name}</span>
              </div>
              <span className="text-xs text-stone-600">{s.usage}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Boutons */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Boutons</h2>
        <div className="space-y-6 rounded-xl border border-stone-200 bg-white p-6 shadow-soft">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-stone-700">Variants × Tailles</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs text-stone-500">Primary</p>
                <button className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2">Petite</button>
                <br />
                <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Moyenne</button>
                <br />
                <button className="rounded-md bg-teal-700 px-6 py-3 text-base font-semibold text-white hover:bg-teal-800">Grande</button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-stone-500">Secondary</p>
                <button className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">Petite</button>
                <br />
                <button className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">Moyenne</button>
                <br />
                <button className="rounded-md border border-stone-300 bg-white px-6 py-3 text-base font-semibold text-stone-700 hover:bg-stone-50">Grande</button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-stone-500">Ghost</p>
                <button className="rounded-md px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100">Petite</button>
                <br />
                <button className="rounded-md px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100">Moyenne</button>
                <br />
                <button className="rounded-md px-6 py-3 text-base font-semibold text-stone-700 hover:bg-stone-100">Grande</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Badges</h2>
        <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-soft">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">Status</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-semibold text-success-800">Validé</span>
              <span className="inline-flex items-center rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-semibold text-warning-700">Attention</span>
              <span className="inline-flex items-center rounded-full bg-error-100 px-2.5 py-0.5 text-xs font-semibold text-error-700">Erreur</span>
              <span className="inline-flex items-center rounded-full bg-info-100 px-2.5 py-0.5 text-xs font-semibold text-info-700">Info</span>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">Plans</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">Free</span>
              <span className="inline-flex items-center rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">Solo</span>
              <span className="inline-flex items-center rounded-full bg-teal-700 px-2.5 py-0.5 text-xs font-semibold text-white">Pro</span>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Équipe</span>
              <span className="inline-flex items-center rounded-full bg-copper-100 px-2.5 py-0.5 text-xs font-semibold text-copper-700">Entreprise</span>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">Confidence</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">● Observé</span>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">● Estimé</span>
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">● Supposé</span>
              <span className="inline-flex items-center rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">● Inconnu</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Cards</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-wider text-stone-500">Default</p>
            <h3 className="mt-2 font-serif text-xl font-semibold text-stone-900">Card par défaut</h3>
            <p className="mt-2 text-sm text-stone-600">Bordure stone-200, ombre soft, fond blanc. Pour la plupart des contenus.</p>
          </div>
          <div className="rounded-xl border border-teal-300 bg-gradient-to-br from-teal-50 to-white p-6 shadow-elevated">
            <p className="text-xs uppercase tracking-wider text-teal-700">Featured</p>
            <h3 className="mt-2 font-serif text-xl font-semibold text-stone-900">Card mise en avant</h3>
            <p className="mt-2 text-sm text-stone-600">Gradient teal léger, ombre élevée. Pour highlight.</p>
          </div>
          <button className="card-hover-lift cursor-pointer rounded-xl border border-stone-200 bg-white p-6 text-left shadow-soft transition hover:border-teal-300">
            <p className="text-xs uppercase tracking-wider text-stone-500">Interactive</p>
            <h3 className="mt-2 font-serif text-xl font-semibold text-stone-900">Card cliquable</h3>
            <p className="mt-2 text-sm text-stone-600">Hover lift + bordure qui s'illumine. Pour navigation.</p>
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">KPI Cards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "👥", label: "Utilisateurs actifs", value: "8 124", trend: "+12 %", color: "text-teal-700" },
            { icon: "📁", label: "Projets créés", value: "3 287", trend: "+18 %", color: "text-teal-700" },
            { icon: "📊", label: "Scénarios générés", value: "7 652", trend: "+15 %", color: "text-teal-700" },
            { icon: "🎯", label: "Taux conversion", value: "32,6 %", trend: "+3,4 pts", color: "text-amber-700" },
          ].map((k, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-xl">{k.icon}</span>
                <p className="text-xs uppercase tracking-wider text-stone-500">{k.label}</p>
              </div>
              <p className={`mt-3 font-serif text-4xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
              <p className="mt-1 text-xs text-success-700">↑ {k.trend} ce mois</p>
            </div>
          ))}
        </div>
      </section>

      {/* DPE Label */}
      <section>
        <h2 className="mb-6 font-serif text-3xl font-semibold text-stone-900">Étiquette DPE</h2>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-1 max-w-md">
            {[
              { letter: "A", color: "#319e3d", value: "≤ 50" },
              { letter: "B", color: "#52b047", value: "51-90" },
              { letter: "C", color: "#a3c63b", value: "91-150" },
              { letter: "D", color: "#f3e02e", value: "151-230" },
              { letter: "E", color: "#f5b400", value: "231-330" },
              { letter: "F", color: "#ed7c2a", value: "331-450" },
              { letter: "G", color: "#dc1f2c", value: "> 450" },
            ].map(d => (
              <div key={d.letter} className="flex items-center gap-3">
                <div
                  className="flex h-8 items-center justify-center rounded font-bold text-white"
                  style={{ backgroundColor: d.color, width: `${30 + ["A","B","C","D","E","F","G"].indexOf(d.letter) * 8}%` }}
                >
                  {d.letter}
                </div>
                <span className="text-xs text-stone-600">{d.value} kWh/m²/an</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 pt-8 text-center text-xs text-stone-500">
        Design System Réno·Calc Pro v2.0 · Documentation complète :
        <code className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 font-mono">docs/DESIGN-SYSTEM.md</code>
      </footer>
    </div>
  );
}
