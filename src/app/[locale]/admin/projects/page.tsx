// app/[locale]/admin/projects/page.tsx — Table projets globale admin
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { DPELabel } from "@/components/results/DPELabel";

const PROJECTS = [
  { id: "p1", name: "Maison Martin",  org: "Cabinet Dupont", surface: 132, dpe: "D" as const, status: "info" as const, statusLabel: "En cours", created: "2 mai 2026" },
  { id: "p2", name: "Copro Tilleuls", org: "Cabinet Dupont", surface: 2_800, dpe: "F" as const, status: "warning" as const, statusLabel: "À relire", created: "28 avr 2026" },
  { id: "p3", name: "Bureau ABC",     org: "BE Thermique 33", surface: 480, dpe: "E" as const, status: "info" as const, statusLabel: "En cours", created: "1 mai 2026" },
];

export default function ProjectsAdminPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-stone-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>Projets (vue globale)</h1>
        <p className="mt-1 text-sm text-stone-600">3 287 projets total · {PROJECTS.length} récents affichés</p>
      </header>

      <Card padded={false} className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-2xs uppercase tracking-wider text-stone-600">
            <tr>
              <th className="px-4 py-2.5 text-left">DPE</th>
              <th className="px-4 py-2.5 text-left">Projet</th>
              <th className="px-4 py-2.5 text-left">Organisation</th>
              <th className="px-4 py-2.5 text-right">Surface</th>
              <th className="px-4 py-2.5 text-left">Statut</th>
              <th className="px-4 py-2.5 text-right">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {PROJECTS.map(p => (
              <tr key={p.id} className="hover:bg-stone-50/50">
                <td className="px-4 py-3"><DPELabel classification={p.dpe} size="sm" /></td>
                <td className="px-4 py-3 font-semibold">{p.name}</td>
                <td className="px-4 py-3 text-stone-600">{p.org}</td>
                <td className="px-4 py-3 text-right tabular-nums">{p.surface.toLocaleString("fr-FR")} m²</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} size="sm">{p.statusLabel}</StatusBadge></td>
                <td className="px-4 py-3 text-right text-xs text-stone-500">{p.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
