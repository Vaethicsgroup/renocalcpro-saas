// app/[locale]/o/projects/[id]/enveloppe/page.tsx — Historique v2
"use client";

import {
  Activity,
  User,
  FileText,
  CheckCircle2,
  Edit3,
  Upload,
  Send,
  Eye,
  Coins,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface ActivityEvent {
  id: string;
  ts: string;
  actor: string;
  initials: string;
  category: "EDIT" | "DOC" | "MILESTONE" | "SHARE" | "VIEW" | "AID";
  label: string;
  detail?: string;
}

const TIMELINE: ActivityEvent[] = [
  { id: "e1", ts: "2026-06-02 14:32", actor: "Jean Dupont", initials: "JD", category: "AID", label: "MaPrimeRénov' Anah accordée", detail: "Notification reçue · montant 18 500 €" },
  { id: "e2", ts: "2026-05-30 16:15", actor: "Marie Leroy", initials: "ML", category: "DOC", label: "Devis PAC Sud Énergie importé", detail: "FACT-2026-... · 14 200 € HT" },
  { id: "e3", ts: "2026-05-28 11:42", actor: "Pierre Martin (client)", initials: "PM", category: "VIEW", label: "Rapport audit consulté (5 min)", detail: "Via lien portail client" },
  { id: "e4", ts: "2026-05-25 09:30", actor: "Jean Dupont", initials: "JD", category: "SHARE", label: "Rapport audit partagé au client", detail: "Lien valable 90 jours · PIN actif" },
  { id: "e5", ts: "2026-05-22 17:08", actor: "Jean Dupont", initials: "JD", category: "MILESTONE", label: "Étape « Audit énergétique » terminée" },
  { id: "e6", ts: "2026-05-22 16:55", actor: "Jean Dupont", initials: "JD", category: "EDIT", label: "Scénarios travaux générés (3)", detail: "Geste rentable + Bouquet équilibré + Rénovation BBC" },
  { id: "e7", ts: "2026-05-21 14:20", actor: "Marie Leroy", initials: "ML", category: "EDIT", label: "Étude thermique complétée", detail: "Cep mesuré : 201 kWh/m²·an · calage +3,5 %" },
  { id: "e8", ts: "2026-05-18 10:15", actor: "Marie Leroy", initials: "ML", category: "DOC", label: "Photos chantier importées (12)", detail: "Façades, combles, chaudière, fenêtres" },
  { id: "e9", ts: "2026-05-15 14:00", actor: "Jean Dupont", initials: "JD", category: "MILESTONE", label: "Étape « Collecte des données » terminée" },
  { id: "e10", ts: "2026-05-10 09:00", actor: "Jean Dupont", initials: "JD", category: "EDIT", label: "Projet créé", detail: "Client Martin Sophie · maison Aix-en-Provence" },
];

const CATEGORY_META: Record<ActivityEvent["category"], { Icon: typeof Activity; color: string }> = {
  EDIT: { Icon: Edit3, color: "bg-forest-100 text-forest-700" },
  DOC: { Icon: Upload, color: "bg-info-100 text-info-700" },
  MILESTONE: { Icon: CheckCircle2, color: "bg-forest-200 text-forest-800" },
  SHARE: { Icon: Send, color: "bg-amber-100 text-amber-700" },
  VIEW: { Icon: Eye, color: "bg-stone-100 text-stone-700" },
  AID: { Icon: Coins, color: "bg-terracotta-100 text-terracotta-700" },
};

export default function HistoriquePage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-forest-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          Historique du dossier
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Toutes les actions, modifications et événements du projet — journal d&apos;audit complet.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <ol className="relative space-y-4 border-l border-cream-300 pl-6">
            {TIMELINE.map((e) => {
              const meta = CATEGORY_META[e.category];
              const Icon = meta.Icon;
              return (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[33px] grid h-8 w-8 place-items-center rounded-full ring-4 ring-white ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <div className="rounded-lg border border-cream-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-forest-900">{e.label}</p>
                        {e.detail && <p className="mt-0.5 text-xs text-stone-600">{e.detail}</p>}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-stone-500">
                        {e.ts}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-500">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-forest-700 text-[9px] font-bold text-white">
                        {e.initials}
                      </span>
                      par {e.actor}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
