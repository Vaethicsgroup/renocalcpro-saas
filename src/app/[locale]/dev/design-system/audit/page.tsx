// app/[locale]/dev/design-system/audit/page.tsx
// Page d'audit harmonisation v2.0
// Liste les composants présents dans le design system + couleurs employées + écarts détectés.

export const dynamic = "force-static";

const COMPONENTS_INVENTORY = [
  // Layout
  { category: "Layout",      name: "HeaderPremium",       path: "marketing/HeaderPremium",      status: "✅", spaces: ["public"] },
  { category: "Layout",      name: "FooterPremium",       path: "marketing/FooterPremium",      status: "✅", spaces: ["public"] },
  { category: "Layout",      name: "SidebarParticulier",  path: "layout/SidebarParticulier",    status: "✅", spaces: ["particulier"] },
  { category: "Layout",      name: "SidebarPro",          path: "layout/SidebarPro",            status: "✅", spaces: ["pro"] },
  { category: "Layout",      name: "SidebarAdmin",        path: "layout/SidebarAdmin",          status: "✅", spaces: ["admin"] },
  { category: "Layout",      name: "AuthLayout",          path: "auth/AuthLayout",              status: "✅", spaces: ["auth"] },
  // Forms
  { category: "Forms",       name: "Button",              path: "ui/Button",                    status: "✅", spaces: ["all"] },
  { category: "Forms",       name: "Input",               path: "ui/Input",                     status: "✅", spaces: ["all"] },
  { category: "Forms",       name: "Textarea",            path: "ui/Input",                     status: "✅", spaces: ["all"] },
  { category: "Forms",       name: "Select",              path: "ui/Input",                     status: "✅", spaces: ["all"] },
  { category: "Forms",       name: "FormField",           path: "ui/Input",                     status: "✅", spaces: ["all"] },
  // Display
  { category: "Display",     name: "Card",                path: "ui/Card",                      status: "✅", spaces: ["all"] },
  { category: "Display",     name: "Badge / StatusBadge", path: "ui/Badge",                     status: "✅", spaces: ["all"] },
  { category: "Display",     name: "PlanBadge",           path: "ui/Badge",                     status: "✅", spaces: ["public", "particulier", "pro"] },
  { category: "Display",     name: "RoleBadge",           path: "ui/Badge",                     status: "✅", spaces: ["pro", "admin"] },
  { category: "Display",     name: "EmptyState",          path: "ui/EmptyState",                status: "✅", spaces: ["all"] },
  { category: "Display",     name: "KpiCard",             path: "ui/KpiCard",                   status: "✅", spaces: ["pro", "admin", "particulier"] },
  // Marketing
  { category: "Marketing",   name: "HeroPremium",         path: "marketing/HeroPremium",        status: "✅", spaces: ["public"] },
  { category: "Marketing",   name: "PricingPremium",      path: "pricing/PricingPremium",       status: "✅", spaces: ["public"] },
  { category: "Marketing",   name: "SegmentSelector",     path: "landing/SegmentSelector",      status: "🔄", spaces: ["public"] },
  // Results métier
  { category: "Results",     name: "DPELabel",            path: "results/DPELabel",             status: "✅", spaces: ["particulier", "pro"] },
  { category: "Results",     name: "ComfortGauge",        path: "results/ComfortGauge",         status: "✅", spaces: ["particulier", "pro"] },
  { category: "Results",     name: "AidsBreakdown",       path: "results/AidsBreakdown",        status: "✅", spaces: ["particulier", "pro"] },
  // Particulier
  { category: "Particulier", name: "DashboardHero",       path: "p/DashboardHero",              status: "✅", spaces: ["particulier"] },
  // Auth & Onboarding
  { category: "Auth",        name: "SignupFormPremium",   path: "auth/SignupFormPremium",       status: "✅", spaces: ["auth"] },
  { category: "Auth",        name: "OnboardingStepper",   path: "onboarding/OnboardingStepper", status: "✅", spaces: ["auth"] },
  // AI Assistant (Sprint 25-29)
  { category: "AI",          name: "AssistantPanel",      path: "ai-assistant/AssistantPanel",  status: "🔄", spaces: ["pro", "particulier"] },
  { category: "AI",          name: "AssistantFloater",    path: "ai-assistant/AssistantFloater", status: "🔄", spaces: ["pro", "particulier"] },
  { category: "AI",          name: "FieldHelper",         path: "ai-assistant/FieldHelper",     status: "🔄", spaces: ["pro", "particulier"] },
];

const COLOR_USAGE = [
  { token: "teal-700",  hex: "#0f766e", usage: "CTA primaire, focus rings, liens marketing", contexts: ["Boutons primary", "Liens nav", "Iconographie active"] },
  { token: "teal-800",  hex: "#115e59", usage: "Fond sidebar pro, logo officiel", contexts: ["SidebarPro background", "Logo block"] },
  { token: "teal-900",  hex: "#134e4a", usage: "Variante sombre teal", contexts: ["SidebarPro alt", "AuthLayout illustration"] },
  { token: "amber-400", hex: "#fbbf24", usage: "Accent toit logo, badge populaire, active state pro", contexts: ["PricingCard popular", "SidebarPro active accent"] },
  { token: "copper-600", hex: "#a16207", usage: "Plan Entreprise, accent porte logo", contexts: ["PlanBadge enterprise"] },
  { token: "sage-100",  hex: "#e9ecdf", usage: "Fond espace particulier", contexts: ["SidebarParticulier background"] },
  { token: "stone-50",  hex: "#fafaf9", usage: "Fond app par défaut", contexts: ["Body background, layouts wrappers"] },
  { token: "stone-200", hex: "#e7e5e4", usage: "Bordures fines", contexts: ["Card borders, dividers, table rows"] },
  { token: "slate-900", hex: "#0f172a", usage: "Sidebar admin (différenciation forte)", contexts: ["SidebarAdmin background"] },
  { token: "rose-400",  hex: "#fb7185", usage: "Accent admin (différenciation forte)", contexts: ["SidebarAdmin active, badge admin"] },
  { token: "success-600", hex: "#16a34a", usage: "Validation, gain DPE", contexts: ["StatusBadge success, ComfortGauge winter haut"] },
  { token: "warning-500", hex: "#f59e0b", usage: "Attention, classes E/F", contexts: ["StatusBadge warning, DPELabel D-E"] },
  { token: "error-600", hex: "#dc2626", usage: "Erreur, classe G, destructive", contexts: ["Button destructive, StatusBadge error, DPELabel G"] },
];

const SPACE_DIFFERENTIATION = [
  { space: "Public",      bg: "bg-stone-50",   accent: "text-teal-700",  vibe: "Éditorial, conversion", checked: "✅" },
  { space: "Particulier", bg: "bg-sage-100",   accent: "text-teal-800",  vibe: "Chaleureux, pédagogique", checked: "✅" },
  { space: "Pro",         bg: "bg-teal-900",   accent: "text-amber-400", vibe: "Expert, dense, productif", checked: "✅" },
  { space: "Admin",       bg: "bg-slate-900",  accent: "text-rose-400",  vibe: "Analytique, supervision", checked: "✅" },
  { space: "Auth",        bg: "bg-gradient-teal", accent: "text-amber-300", vibe: "Confiance, rassurant", checked: "✅" },
];

export default function DesignSystemAuditPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-6 py-12">
      <header className="border-b border-stone-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">Design System Audit</p>
        <h1
          className="mt-2 font-serif text-4xl font-bold text-stone-900"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Audit harmonisation Premium v2.0
        </h1>
        <p className="mt-3 max-w-3xl text-stone-600">
          Vue d'ensemble des composants livrés, palette utilisée et différenciation des espaces.
          Rendu pour validation visuelle interne.
        </p>
      </header>

      {/* Espaces */}
      <section>
        <h2 className="mb-4 font-serif text-2xl font-semibold text-stone-900">Différenciation des espaces</h2>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr className="border-b border-stone-200">
                <th className="p-3 text-left font-semibold text-stone-700">Espace</th>
                <th className="p-3 text-left font-semibold text-stone-700">Fond dominant</th>
                <th className="p-3 text-left font-semibold text-stone-700">Accent actif</th>
                <th className="p-3 text-left font-semibold text-stone-700">Vibe attendue</th>
                <th className="p-3 text-center font-semibold text-stone-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {SPACE_DIFFERENTIATION.map(s => (
                <tr key={s.space} className="border-b border-stone-100 last:border-0">
                  <td className="p-3 font-semibold text-stone-900">{s.space}</td>
                  <td className="p-3"><code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">{s.bg}</code></td>
                  <td className="p-3"><code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">{s.accent}</code></td>
                  <td className="p-3 text-stone-600">{s.vibe}</td>
                  <td className="p-3 text-center text-xl">{s.checked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Composants */}
      <section>
        <h2 className="mb-4 font-serif text-2xl font-semibold text-stone-900">Inventaire des composants ({COMPONENTS_INVENTORY.length})</h2>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr className="border-b border-stone-200">
                <th className="p-3 text-left font-semibold text-stone-700">Catégorie</th>
                <th className="p-3 text-left font-semibold text-stone-700">Composant</th>
                <th className="p-3 text-left font-semibold text-stone-700">Path</th>
                <th className="p-3 text-left font-semibold text-stone-700">Espaces</th>
                <th className="p-3 text-center font-semibold text-stone-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {COMPONENTS_INVENTORY.map((c, i) => (
                <tr key={i} className="border-b border-stone-100 last:border-0">
                  <td className="p-3 text-stone-600">
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{c.category}</span>
                  </td>
                  <td className="p-3 font-semibold text-stone-900">{c.name}</td>
                  <td className="p-3"><code className="text-xs text-stone-500">components/{c.path}</code></td>
                  <td className="p-3 text-xs text-stone-600">{c.spaces.join(", ")}</td>
                  <td className="p-3 text-center">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-stone-500">
          ✅ refondu Premium v2.0 · 🔄 héritage automatique de la palette via Tailwind config (refresh fin Sprint suivant)
        </p>
      </section>

      {/* Palette */}
      <section>
        <h2 className="mb-4 font-serif text-2xl font-semibold text-stone-900">Palette employée par contexte</h2>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr className="border-b border-stone-200">
                <th className="p-3 text-left font-semibold text-stone-700">Token</th>
                <th className="p-3 text-left font-semibold text-stone-700">Hex</th>
                <th className="p-3 text-left font-semibold text-stone-700">Usage</th>
                <th className="p-3 text-left font-semibold text-stone-700">Contextes</th>
              </tr>
            </thead>
            <tbody>
              {COLOR_USAGE.map(c => (
                <tr key={c.token} className="border-b border-stone-100 last:border-0">
                  <td className="p-3"><code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">{c.token}</code></td>
                  <td className="p-3 flex items-center gap-2">
                    <span className="inline-block h-5 w-5 rounded border border-stone-200" style={{ backgroundColor: c.hex }} />
                    <code className="text-xs text-stone-500">{c.hex}</code>
                  </td>
                  <td className="p-3 text-sm text-stone-700">{c.usage}</td>
                  <td className="p-3 text-xs text-stone-500">{c.contexts.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recommandations */}
      <section>
        <h2 className="mb-4 font-serif text-2xl font-semibold text-stone-900">Recommandations d'harmonisation</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-sm font-semibold text-amber-900">⚠ À unifier (Sprint suivant)</h3>
            <ul className="mt-3 space-y-1.5 text-xs text-amber-800">
              <li>• `Hero` (ancien) à supprimer — remplacé par `HeroPremium`</li>
              <li>• `PublicHeader` / `PublicFooter` (anciens) à archiver</li>
              <li>• `SegmentSelector` à refresh avec composants ui/Card v2</li>
              <li>• `TrustBar`, `BenefitGrid`, `HowItWorks` : vérifier alignement ombres/rayons sur DS v2</li>
              <li>• `AssistantPanel` : harmoniser bordures + ombres</li>
            </ul>
          </div>
          <div className="rounded-xl border border-success-200 bg-success-50 p-5">
            <h3 className="text-sm font-semibold text-success-900">✅ Conformes DS v2.0</h3>
            <ul className="mt-3 space-y-1.5 text-xs text-success-800">
              <li>• Palette teal/sage/copper/stone correctement utilisée partout</li>
              <li>• Différenciation des 4 espaces visible et cohérente</li>
              <li>• Typographie Source Serif + Inter appliquée</li>
              <li>• Ombres soft/elevated/floating respectées</li>
              <li>• Rayons standardisés (rounded-md/lg/xl/2xl)</li>
              <li>• Focus rings cohérents teal-300</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 pt-6 text-center text-xs text-stone-500">
        Audit généré pour Sprint Redesign UX/UI Premium v2.0 ·{" "}
        <a href="design-system" className="text-teal-700 hover:underline">← Retour vitrine</a>
      </footer>
    </div>
  );
}
