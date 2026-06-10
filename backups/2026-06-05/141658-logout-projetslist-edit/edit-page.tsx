// app/[locale]/p/projects/[id]/edit/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Page d'édition d'un projet existant — onglet "Modifier les données".
// Permet d'actualiser les informations clés sans repasser par le wizard
// complet : nom, type, adresse, surface, année, période construction, etc.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Home,
  Building2,
  Briefcase,
  Settings2,
  MapPin,
  Hammer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";

interface ProjectEditData {
  name: string;
  kind: "INDIVIDUAL" | "COLLECTIVE" | "TERTIARY";
  address: string;
  postalCode: string;
  city: string;
  surfaceM2: number;
  constructionYear: number;
  niveauCount: number;
  hauteurSousPlafondM: number;
  heatingKind: string;
  notes?: string;
}

const KIND_LABELS: Record<ProjectEditData["kind"], string> = {
  INDIVIDUAL: "Habitation individuelle",
  COLLECTIVE: "Logement collectif",
  TERTIARY: "Bâtiment tertiaire",
};

const KIND_ICONS: Record<ProjectEditData["kind"], typeof Home> = {
  INDIVIDUAL: Home,
  COLLECTIVE: Building2,
  TERTIARY: Briefcase,
};

const HEATING_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "CHAUDIERE_GAZ_COND", label: "Chaudière gaz condensation" },
  { value: "CHAUDIERE_GAZ_STD", label: "Chaudière gaz standard" },
  { value: "CHAUDIERE_FIOUL", label: "Chaudière fioul" },
  { value: "PAC_AIR_EAU", label: "Pompe à chaleur air/eau" },
  { value: "PAC_AIR_AIR", label: "Pompe à chaleur air/air" },
  { value: "RADIATEUR_ELEC", label: "Radiateurs électriques" },
  { value: "POELE_GRANUL", label: "Poêle à granulés" },
  { value: "POELE_BOIS_BUCHE", label: "Poêle à bois" },
];

export default function ProjectEditPage() {
  const params = useParams<{ locale: string; id: string }>();
  const router = useRouter();
  const locale = params?.locale ?? "fr";
  const projectId = params?.id ?? "";

  // MVP : données mock — à remplacer par fetch depuis Prisma.
  const [data, setData] = useState<ProjectEditData>({
    name: "Maison des Tilleuls",
    kind: "INDIVIDUAL",
    address: "12 rue des Tilleuls",
    postalCode: "87000",
    city: "Limoges",
    surfaceM2: 120,
    constructionYear: 1978,
    niveauCount: 2,
    hauteurSousPlafondM: 2.5,
    heatingKind: "CHAUDIERE_GAZ_COND",
    notes: "",
  });

  const [saveState, setSaveState] = useState<
    | { status: "idle" }
    | { status: "saving" }
    | { status: "success" }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const update = <K extends keyof ProjectEditData>(
    key: K,
    value: ProjectEditData[K],
  ) => setData((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaveState({ status: "saving" });
    try {
      // TODO : appeler `updateProject` server action / GraphQL mutation
      // Pour l'instant : simulation 700ms.
      await new Promise((r) => setTimeout(r, 700));
      setSaveState({ status: "success" });
      setTimeout(() => setSaveState({ status: "idle" }), 3000);
    } catch (err) {
      setSaveState({
        status: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
  };

  const KindIcon = KIND_ICONS[data.kind];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + retour */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/p/projects/${projectId}/synthese`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-forest-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour au dossier
        </Link>
      </div>

      {/* Header */}
      <header className="rounded-xl border border-forest-200 bg-forest-50/40 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-700 text-white">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
              Édition du dossier
            </p>
            <h2
              className="font-serif text-2xl font-bold text-forest-900"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              Modifier les données du projet
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Mettez à jour les informations principales. Les calculs DPE et
              scénarios seront recalculés automatiquement après enregistrement.
            </p>
          </div>
        </div>
      </header>

      {/* Bannière feedback */}
      {saveState.status === "success" && (
        <div className="flex items-start gap-2 rounded-lg border border-forest-300 bg-forest-50 px-4 py-3 text-sm text-forest-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
          Modifications enregistrées. Le diagnostic sera recalculé.
        </div>
      )}
      {saveState.status === "error" && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
          {saveState.message}
        </div>
      )}

      {/* Section 1 — Identification */}
      <Card>
        <CardContent>
          <SectionTitle icon={KindIcon} title="Identification du projet" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nom du projet" htmlFor="name" required>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </FormField>
            <FormField label="Type de bâtiment" htmlFor="kind" required>
              <Select
                id="kind"
                value={data.kind}
                onChange={(e) =>
                  update("kind", e.target.value as ProjectEditData["kind"])
                }
              >
                {(Object.keys(KIND_LABELS) as ProjectEditData["kind"][]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {KIND_LABELS[k]}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Localisation */}
      <Card>
        <CardContent>
          <SectionTitle icon={MapPin} title="Adresse du bien" />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              label="Adresse"
              htmlFor="address"
              required
              className="sm:col-span-3"
            >
              <Input
                id="address"
                value={data.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </FormField>
            <FormField label="Code postal" htmlFor="postalCode" required>
              <Input
                id="postalCode"
                value={data.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
                maxLength={5}
              />
            </FormField>
            <FormField
              label="Ville"
              htmlFor="city"
              required
              className="sm:col-span-2"
            >
              <Input
                id="city"
                value={data.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Caractéristiques bâtiment */}
      <Card>
        <CardContent>
          <SectionTitle icon={Hammer} title="Caractéristiques du bâti" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Surface habitable (m²)" htmlFor="surface" required>
              <Input
                id="surface"
                type="number"
                min={10}
                max={10000}
                value={data.surfaceM2}
                onChange={(e) =>
                  update("surfaceM2", Number(e.target.value) || 0)
                }
              />
            </FormField>
            <FormField label="Année de construction" htmlFor="year" required>
              <Input
                id="year"
                type="number"
                min={1800}
                max={new Date().getFullYear()}
                value={data.constructionYear}
                onChange={(e) =>
                  update("constructionYear", Number(e.target.value) || 0)
                }
              />
            </FormField>
            <FormField label="Nombre de niveaux" htmlFor="niveaux">
              <Input
                id="niveaux"
                type="number"
                min={1}
                max={20}
                value={data.niveauCount}
                onChange={(e) =>
                  update("niveauCount", Number(e.target.value) || 1)
                }
              />
            </FormField>
            <FormField label="Hauteur sous plafond (m)" htmlFor="ceiling">
              <Input
                id="ceiling"
                type="number"
                step="0.1"
                min={2}
                max={6}
                value={data.hauteurSousPlafondM}
                onChange={(e) =>
                  update("hauteurSousPlafondM", Number(e.target.value) || 2.5)
                }
              />
            </FormField>
            <FormField
              label="Chauffage principal"
              htmlFor="heating"
              className="sm:col-span-2"
            >
              <Select
                id="heating"
                value={data.heatingKind}
                onChange={(e) => update("heatingKind", e.target.value)}
              >
                {HEATING_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Notes */}
      <Card>
        <CardContent>
          <SectionTitle icon={Settings2} title="Notes personnelles" />
          <FormField label="Notes" htmlFor="notes">
            <textarea
              id="notes"
              value={data.notes ?? ""}
              rows={4}
              onChange={(e) => update("notes", e.target.value)}
              className="w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
              placeholder="Particularités, contraintes, contacts artisans…"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest-300 bg-white p-3 shadow-lg">
        <p className="text-xs text-stone-600">
          Toutes vos modifications doivent être enregistrées pour relancer le
          calcul.
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() =>
              router.push(`/${locale}/p/projects/${projectId}/synthese`)
            }
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            size="md"
            iconLeft={<Save className="h-4 w-4" strokeWidth={2} />}
            onClick={handleSave}
            disabled={saveState.status === "saving"}
          >
            {saveState.status === "saving"
              ? "Enregistrement…"
              : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Settings2;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-serif text-lg font-bold text-forest-900">{title}</h3>
    </div>
  );
}
