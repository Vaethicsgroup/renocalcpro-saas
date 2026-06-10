// app/[locale]/dev/components/page.tsx — Design system showcase.
// Accessible uniquement si NODE_ENV=development OU utilisateur admin.

import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PatternHexagons, PatternWaves, PatternDots } from "@/components/ui/Patterns";
import { KpiCard } from "@/components/admin/KpiCard";

interface Props { params: Promise<{ locale: string }> }

export default async function ComponentsShowcase({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Garde : dev OR admin
  if (process.env.NODE_ENV !== "development") {
    const session = await auth();
    if (!isAdmin(session?.user?.id)) notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-12">
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900">DEV / ADMIN ONLY</span>
        <h1 className="mt-3 font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Design System
        </h1>
        <p className="mt-2 text-stone-600">Tous les composants UI clés et leurs variantes — référence visuelle.</p>
      </header>

      {/* Boutons */}
      <Section title="Buttons">
        <div className="grid gap-4 sm:grid-cols-3">
          {(["sm","md","lg"] as const).map(size => (
            <div key={size} className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-stone-500">{size}</p>
              <button className={`block w-full rounded-lg bg-teal-800 px-4 py-${size === "sm" ? "1.5" : size === "md" ? "2" : "3"} font-semibold text-white hover:bg-teal-700`}>Primary</button>
              <button className={`block w-full rounded-lg border-2 border-teal-800 px-4 py-${size === "sm" ? "1.5" : size === "md" ? "2" : "3"} font-semibold text-teal-800 hover:bg-teal-50`}>Secondary</button>
              <button className={`block w-full rounded-lg px-4 py-${size === "sm" ? "1.5" : size === "md" ? "2" : "3"} font-semibold text-teal-800 hover:bg-teal-50`}>Ghost</button>
              <button className={`block w-full rounded-lg bg-rose-700 px-4 py-${size === "sm" ? "1.5" : size === "md" ? "2" : "3"} font-semibold text-white hover:bg-rose-600`}>Destructive</button>
              <button className={`block w-full rounded-lg bg-teal-800/40 px-4 py-${size === "sm" ? "1.5" : size === "md" ? "2" : "3"} font-semibold text-white cursor-not-allowed`} disabled>Disabled</button>
            </div>
          ))}
        </div>
      </Section>

      {/* Form inputs */}
      <Section title="Form inputs">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Default</span>
            <input type="text" placeholder="Saisir…" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Email</span>
            <input type="email" placeholder="email@example.com" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-rose-700">Error</span>
            <input type="text" defaultValue="invalid" aria-invalid="true" className="mt-1 w-full rounded-lg border-2 border-rose-500 px-3 py-2 text-sm" />
            <span className="mt-1 block text-xs text-rose-700">Champ obligatoire</span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Disabled</span>
            <input type="text" defaultValue="readonly" disabled className="mt-1 w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Select</span>
            <select className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm">
              <option>Option 1</option><option>Option 2</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Textarea</span>
            <textarea rows={3} placeholder="Description…" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </label>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Default</h3>
            <p className="mt-2 text-sm text-stone-600">Carte standard avec border 0.5px.</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-teal-500">
            <h3 className="font-semibold">Hoverable</h3>
            <p className="mt-2 text-sm text-stone-600">Border + shadow au hover.</p>
          </div>
          <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white p-6 shadow-sm ring-2 ring-amber-400/40">
            <span className="inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-teal-950">Featured</span>
            <h3 className="mt-3 font-semibold">Mise en avant</h3>
          </div>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">Active</span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900">Trialing</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">Past Due</span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-900">Canceled</span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">Owner</span>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">Admin</span>
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-900">Pro</span>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-900">Enterprise</span>
        </div>
      </Section>

      {/* Energy Label A→G */}
      <Section title="EnergyLabel (DPE)">
        <div className="flex flex-col gap-1">
          {(["A","B","C","D","E","F","G"] as const).map(letter => (
            <div key={letter} className="flex items-center gap-3">
              <span style={{ display: "inline-block", width: 80, padding: "4px 10px", borderRadius: 6, color: "white", fontWeight: 700, textAlign: "center", background: { A:"#009B4E", B:"#52B84B", C:"#A2C945", D:"#F3E03B", E:"#F0A830", F:"#EB602B", G:"#D42027" }[letter] }}>{letter}</span>
              <span className="text-sm text-stone-600">Classe {letter}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* GHG Label */}
      <Section title="GHGLabel (GES)">
        <div className="flex flex-col gap-1">
          {(["A","B","C","D","E","F","G"] as const).map(letter => (
            <div key={letter} className="flex items-center gap-3">
              <span style={{ display: "inline-block", width: 80, padding: "4px 10px", borderRadius: 6, color: "white", fontWeight: 700, textAlign: "center", background: { A:"#E8D5F5", B:"#D4B0EC", C:"#B87FDB", D:"#9B58CD", E:"#7E35BF", F:"#601BA1", G:"#400080" }[letter] }}>
                <span style={{ color: ["A","B","C"].includes(letter) ? "#400080" : "white" }}>{letter}</span>
              </span>
              <span className="text-sm text-stone-600">Classe GES {letter}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ConfidencePill */}
      <Section title="ConfidencePill">
        <div className="flex flex-wrap gap-3">
          {(["verified","auto","estimated","inferred","manual","pending"] as const).map(level => (
            <span key={level} className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${ {
              verified: "bg-emerald-100 text-emerald-900",
              auto:     "bg-teal-100 text-teal-900",
              estimated: "bg-amber-100 text-amber-900",
              inferred: "bg-orange-100 text-orange-900",
              manual:   "bg-blue-100 text-blue-900",
              pending:  "bg-stone-100 text-stone-700",
            }[level]}`}>{level}</span>
          ))}
        </div>
      </Section>

      {/* Empty States */}
      <Section title="EmptyStates">
        <div className="grid gap-6 lg:grid-cols-3">
          <EmptyState type="projects" />
          <EmptyState type="photos" />
          <EmptyState type="reports" />
        </div>
      </Section>

      {/* Spinners */}
      <Section title="LoadingSpinner">
        <div className="flex items-center gap-6">
          <div className="text-center"><LoadingSpinner size={24} branded={false} /><p className="mt-2 text-xs text-stone-500">Plain 24</p></div>
          <div className="text-center"><LoadingSpinner size={48} /><p className="mt-2 text-xs text-stone-500">Branded 48</p></div>
          <div className="text-center"><LoadingSpinner size={80} /><p className="mt-2 text-xs text-stone-500">Branded 80</p></div>
        </div>
      </Section>

      {/* KPI Cards */}
      <Section title="KpiCard (admin)">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="MRR"             value="2 470 €" delta="+12%" positive hint="vs mois -1" />
          <KpiCard label="Conversion"      value="8,4 %"   delta="+0.6 pt" positive />
          <KpiCard label="Trials"          value={47} />
          <KpiCard label="Churn"           value="2,1 %"   delta="−0.3 pt" positive />
        </div>
      </Section>

      {/* Patterns */}
      <Section title="Patterns SVG décoratifs">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative h-48 overflow-hidden rounded-xl bg-teal-900 p-6 text-white">
            <PatternHexagons opacity={0.15} />
            <span className="relative">Hexagons</span>
          </div>
          <div className="relative h-48 overflow-hidden rounded-xl bg-amber-700 p-6 text-white">
            <PatternWaves opacity={0.18} />
            <span className="relative">Waves</span>
          </div>
          <div className="relative h-48 overflow-hidden rounded-xl bg-stone-900 p-6 text-white">
            <PatternDots opacity={0.20} />
            <span className="relative">Dots</span>
          </div>
        </div>
      </Section>

      {/* Modals (mock visual, pas interactif) */}
      <Section title="Modals">
        <div className="rounded-xl bg-stone-100 p-8">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-serif text-xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>Modal title</h3>
            <p className="mt-3 text-sm text-stone-700">Description du modal.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">Cancel</button>
              <button className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Confirm</button>
            </div>
          </div>
        </div>
      </Section>

      {/* UpgradeCard (paywall) */}
      <Section title="UpgradeCard (paywall)">
        <div className="rounded-xl border-2 border-dashed border-amber-500/40 bg-gradient-to-br from-amber-50 to-amber-100/40 p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20 text-2xl">✦</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900">Cette fonctionnalité demande un plan supérieur</h3>
              <p className="mt-1 text-sm text-amber-800/80">Cette fonctionnalité n'est pas incluse dans votre plan actuel.</p>
              <p className="mt-3 text-sm text-amber-900">Le plan Pro débloque cette fonctionnalité.</p>
              <div className="mt-4 flex gap-3">
                <button className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">Voir les plans</button>
                <button className="rounded-lg border border-amber-600/30 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100">En savoir plus</button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 font-serif text-2xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
