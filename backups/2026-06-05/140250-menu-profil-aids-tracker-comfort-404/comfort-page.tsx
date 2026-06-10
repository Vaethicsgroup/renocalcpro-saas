// app/[locale]/p/projects/[id]/comfort/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Onglet Confort thermique repensé (v2.4) : présentation plus claire et
// professionnelle via le composant ComfortScoreCard (jauge SVG semi-circulaire,
// banding 0-5, causes + recommandations par saison).
// ════════════════════════════════════════════════════════════════════════════

import { Card, CardContent } from "@/components/ui/Card";
import { ComfortScoreCard } from "@/components/results/ComfortScoreCard";
import { Flame, AlertTriangle } from "lucide-react";

const WINTER_SCORES = {
  current: 3.2,
  after: 4.6,
  causesFr: [
    "Paroi froide (murs non isolés)",
    "Plancher bas en contact direct avec cave",
    "Ponts thermiques en jonction mur/plancher",
  ],
  recommendationsFr: [
    "ITE murs avec R ≥ 4,4 m²·K/W",
    "Isoler le plancher bas (R ≥ 3,5 m²·K/W)",
    "Traiter les ponts thermiques périphériques",
  ],
};

const SUMMER_SCORES = {
  current: 2.8,
  after: 4.1,
  causesFr: [
    "Inertie thermique faible",
    "Pas de protection solaire sur baies sud/ouest",
    "Ventilation nocturne insuffisante",
  ],
  recommendationsFr: [
    "Isolant biosourcé à fort déphasage (fibre bois 35cm)",
    "Brise-soleil ou volets sur fenêtres ensoleillées",
    "VMC double flux avec by-pass été",
  ],
};

const DEPERDITIONS = [
  { label: "Toiture", value: 30, level: "high" as const },
  { label: "Murs", value: 30, level: "high" as const },
  { label: "Fenêtres", value: 20, level: "medium" as const },
  { label: "Ponts thermiques", value: 10, level: "medium" as const },
  { label: "Plancher bas", value: 10, level: "medium" as const },
];

export default function ComfortPage() {
  return (
    <div className="space-y-6">
      <ComfortScoreCard winter={WINTER_SCORES} summer={SUMMER_SCORES} />

      <Card>
        <CardContent>
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-forest-900">
                Bilan des déperditions thermiques
              </p>
              <p className="text-xs text-stone-600">
                Répartition des pertes de chaleur par paroi avant travaux.
                Permet de prioriser les postes d&apos;isolation.
              </p>
            </div>
          </div>

          <ul className="space-y-3.5">
            {DEPERDITIONS.map((d) => (
              <li key={d.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-forest-900">{d.label}</span>
                  <span className="font-bold tabular-nums text-stone-900">
                    {d.value} %
                  </span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-cream-200">
                  <div
                    className={[
                      "h-full transition-all",
                      d.level === "high" ? "bg-red-500" : "bg-amber-500",
                    ].join(" ")}
                    style={{ width: `${d.value * 3}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-lg border-l-4 border-forest-500 bg-forest-50/60 p-3.5 text-xs leading-relaxed text-forest-900">
            <strong>Astuce :</strong> isoler la toiture en priorité permet
            généralement de gagner 1 à 1,5 point de confort hiver très
            rapidement, à coût modéré (1500-3500 €).
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50/60 p-3 text-xs text-amber-900">
        <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5 text-amber-600" />
        Scores de confort calculés à partir du Cep, GES, inertie et ponts
        thermiques modélisés. Confort réel ressenti peut varier selon
        l&apos;hygrométrie, l&apos;orientation et les usages.
      </div>
    </div>
  );
}
