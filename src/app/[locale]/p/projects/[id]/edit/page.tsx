// app/[locale]/p/projects/[id]/edit/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Page d'édition complète d'un projet existant — toutes les sections du
// wizard de création accessibles en accordion :
//   1. Identification & contexte (nom, type, période, climat, altitude, occupation)
//   2. Géométrie & dimensions (SHAB, hauteur, niveaux, mitoyenneté, surfaces parois)
//   3. Enveloppe murs (matériau + isolation)
//   4. Enveloppe toiture (type + isolation)
//   5. Enveloppe plancher (type + isolation)
//   6. Menuiseries & ponts thermiques (vitrage, matériau, volets)
//   7. Chauffage (type, année, consigne, climatisation)
//   8. ECS & ventilation
//   9. Production solaire
//   10. Foyer fiscal (occupants, RFR, IDF)
//   11. Autonomie & handicap
//   12. Notes
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { EditProjectForm } from "@/components/p/EditProjectForm";

export default function ProjectEditPage() {
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? "fr";
  const projectId = params?.id ?? "";

  // MVP : initialData mock — à brancher sur une server action `loadProject(id)`
  // ou un fetch GraphQL.
  const initialData = {
    projectName: "Maison des Tilleuls",
    buildingType: "MAISON_INDIV" as const,
    constructionPeriod: "1975_1981" as const,
    climateZone: "H2a" as const,
    altitudeM: 250,
    surfaceHabitableM2: 120,
    hauteurSousPlafondM: 2.5,
    niveauCount: 2,
    occupants: 4,
    occupation: "PRIMARY" as const,
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/${locale}/p/projects/${projectId}/synthese`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-forest-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour au dossier
        </Link>
      </div>

      {/* Hero */}
      <Card>
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-forest-700 text-white">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
                Édition du dossier
              </p>
              <h1
                className="font-serif text-2xl font-bold text-forest-900 md:text-3xl"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                Modifier les données du projet
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Toutes les sections du wizard sont accessibles en accordion.
                Modifiez ce que vous voulez, le DPE et les scénarios seront
                recalculés après enregistrement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire complet */}
      <EditProjectForm
        initialData={initialData}
        onSubmit={async (data) => {
          // TODO : appeler la server action `updateProjectFull(projectId, data)`
          // Pour l'instant simulation 800ms.
          await new Promise((r) => setTimeout(r, 800));
          // eslint-disable-next-line no-console
          console.log("Projet sauvé :", data);
          return {
            ok: true,
            message: `Dossier "${data.projectName}" mis à jour avec succès.`,
          };
        }}
      />
    </div>
  );
}
