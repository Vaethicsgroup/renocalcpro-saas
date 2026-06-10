// app/[locale]/o/tools/page.tsx — Outils & Calculs v2 (conforme maquette)
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Home,
  Activity,
  Coins,
  TrendingUp,
  Layers,
  Sun,
  Wind,
  Leaf,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

const TOOLS = [
  { id: "dpe", title: "Calcul DPE", description: "Estimez la performance énergétique", href: "/o/projects", Icon: Home },
  { id: "thermique", title: "Simulation thermique", description: "Analysez les déperditions", href: "/o/projects", Icon: Activity },
  { id: "aides", title: "Calcul aides", description: "Estimez les aides financières", href: "/o/projects", Icon: Coins },
  { id: "roi", title: "Calcul ROI", description: "Calculez le retour sur investissement", href: "/o/projects", Icon: TrendingUp },
  { id: "ponts", title: "Ponts thermiques", description: "Analysez les ponts thermiques", href: "/o/projects", Icon: Layers },
  { id: "confort-ete", title: "Confort d'été", description: "Évaluez le confort estival", href: "/o/projects", Icon: Sun },
  { id: "etancheite", title: "Étanchéité à l'air", description: "Calculez l'étanchéité", href: "/o/projects", Icon: Wind },
  { id: "acv", title: "ACV bâtiment", description: "Analyse du cycle de vie", href: "/o/projects", Icon: Leaf },
] as const;

export default function ToolsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fr";

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Outils & Calculs
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Accédez à l&apos;ensemble de nos outils de calcul et d&apos;aide à la décision.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOOLS.map((tool) => {
          const Icon = tool.Icon;
          return (
            <Card key={tool.id} className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-forest-100 text-forest-700">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <h3 className="font-serif text-lg font-bold text-forest-900">{tool.title}</h3>
                <p className="mt-1 text-xs text-stone-600">{tool.description}</p>
                <Link
                  href={`/${locale}${tool.href}`}
                  className="mt-3 inline-flex items-center gap-1 rounded-md border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 hover:border-forest-300 hover:bg-cream-50"
                >
                  Accéder
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm font-medium text-stone-600">
        Des outils puissants pour des décisions éclairées.
      </p>
    </div>
  );
}
