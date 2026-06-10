// app/[locale]/o/projects/[id]/edit/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Édition complète d'un dossier projet pro — réutilise EditProjectForm
// (12 sections accordéons, ~50 champs) + ajoute des sections expert pro :
//   - Coordonnées client structurées
//   - Statut de propriété (SCI / indivision / etc.)
//   - Réglementaire tertiaire (DEET, OPERAT, RGE, labels)
//   - Cible audit (auditeur, certification visée)
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings2,
  User,
  Shield,
  Award,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { EditProjectForm } from "@/components/p/EditProjectForm";

interface ProClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ownershipKind: string;
  legalEntityName?: string;
  siret?: string;
}

interface TertiaryInfo {
  isTertiary: boolean;
  deetSubject: boolean;
  operatRef: string;
  certifications: ReadonlyArray<string>;
  targetLabels: ReadonlyArray<string>;
}

interface AuditInfo {
  auditorName: string;
  auditorCertif: string;
  targetCertification: "OPQIBI" | "QUALIBAT_8731" | "NF_HABITAT" | "AUTRE";
  targetDelivery: string;
}

const INITIAL_CLIENT: ProClientInfo = {
  firstName: "Sophie",
  lastName: "Martin",
  email: "sophie.martin@email.fr",
  phone: "06 12 34 56 78",
  ownershipKind: "PROPRIETAIRE_OCCUPANT",
};

const INITIAL_TERTIARY: TertiaryInfo = {
  isTertiary: false,
  deetSubject: false,
  operatRef: "",
  certifications: [],
  targetLabels: [],
};

const INITIAL_AUDIT: AuditInfo = {
  auditorName: "Jean Dupont",
  auditorCertif: "OPQIBI 1905",
  targetCertification: "OPQIBI",
  targetDelivery: "2026-07-15",
};

const OWNERSHIP_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "PROPRIETAIRE_OCCUPANT", label: "Propriétaire occupant" },
  { value: "PROPRIETAIRE_BAILLEUR", label: "Propriétaire bailleur" },
  { value: "LOCATAIRE", label: "Locataire" },
  { value: "SCI_FAMILIALE_IR", label: "SCI familiale (à l'IR)" },
  { value: "SCI_PATRIMONIALE_IS", label: "SCI patrimoniale (à l'IS)" },
  { value: "INDIVISION", label: "Indivision" },
  { value: "USUFRUITIER", label: "Usufruitier" },
  { value: "SYNDIC_COPRO", label: "Syndic de copropriété" },
  { value: "BAILLEUR_SOCIAL", label: "Bailleur social (HLM)" },
  { value: "PERSONNE_MORALE_ENTREPRISE", label: "Personne morale / entreprise" },
];

const RGE_CERTIFICATIONS: ReadonlyArray<string> = [
  "Qualibat 8731 (Audit énergétique)",
  "OPQIBI 1905 (Études thermiques)",
  "QualiPAC (Pompes à chaleur)",
  "QualiPV (Photovoltaïque)",
  "QualiSol (Solaire thermique)",
  "Qualibois (Bois énergie)",
  "QualiBat (Tous corps d'état)",
];

const TERTIARY_LABELS: ReadonlyArray<string> = [
  "HQE Bâtiment Durable",
  "BREEAM",
  "LEED",
  "BEPOS Effinergie",
  "E+C- (RE2020)",
  "PassivHaus",
  "BiodiverCity",
];

export default function ProjectEditPage() {
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? "fr";
  const projectId = params?.id ?? "";

  const [client, setClient] = useState<ProClientInfo>(INITIAL_CLIENT);
  const [tertiary, setTertiary] = useState<TertiaryInfo>(INITIAL_TERTIARY);
  const [audit, setAudit] = useState<AuditInfo>(INITIAL_AUDIT);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const updateClient = <K extends keyof ProClientInfo>(
    key: K,
    value: ProClientInfo[K],
  ) => setClient((p) => ({ ...p, [key]: value }));

  const updateTertiary = <K extends keyof TertiaryInfo>(
    key: K,
    value: TertiaryInfo[K],
  ) => setTertiary((p) => ({ ...p, [key]: value }));

  const updateAudit = <K extends keyof AuditInfo>(
    key: K,
    value: AuditInfo[K],
  ) => setAudit((p) => ({ ...p, [key]: value }));

  const toggleArrItem = (arr: ReadonlyArray<string>, item: string) =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const handleSaveAll = async () => {
    setSaveState("saving");
    await new Promise((r) => setTimeout(r, 700));
    setSaveState("success");
    setTimeout(() => setSaveState("idle"), 3000);
  };

  const isLegalEntity =
    client.ownershipKind === "SCI_FAMILIALE_IR" ||
    client.ownershipKind === "SCI_PATRIMONIALE_IS" ||
    client.ownershipKind === "PERSONNE_MORALE_ENTREPRISE" ||
    client.ownershipKind === "SYNDIC_COPRO" ||
    client.ownershipKind === "BAILLEUR_SOCIAL";

  return (
    <div className="space-y-6">
      {/* Breadcrumb retour */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/o/projects/${projectId}/identite`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-forest-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Retour à la synthèse
        </Link>
      </div>

      {/* Hero */}
      <Card>
        <CardContent className="p-5">
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
                Vue auditeur expert — toutes les sections du wizard particulier
                + identité client structurée + statut de propriété + spécificités
                tertiaire + cible certification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {saveState === "success" && (
        <div className="flex items-center gap-2 rounded-md border border-forest-300 bg-forest-50 px-4 py-3 text-sm text-forest-900">
          <CheckCircle2 className="h-4 w-4 text-forest-700" />
          Toutes les modifications ont été enregistrées. Le diagnostic sera
          recalculé.
        </div>
      )}

      {/* 1. Identité client structurée */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle
            icon={User}
            title="Identité client"
            subtitle="Coordonnées pour facturation, communication et dossiers d'aide."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Prénom"
              required
              value={client.firstName}
              onChange={(v) => updateClient("firstName", v)}
            />
            <Field
              label="Nom"
              required
              value={client.lastName}
              onChange={(v) => updateClient("lastName", v)}
            />
            <Field
              label="Email"
              type="email"
              required
              value={client.email}
              onChange={(v) => updateClient("email", v)}
            />
            <Field
              label="Téléphone"
              type="tel"
              value={client.phone}
              onChange={(v) => updateClient("phone", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Statut de propriété */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle
            icon={Briefcase}
            title="Statut de propriété"
            subtitle="Détermine l'éligibilité aux aides (MPR, Éco-PTZ, etc.)."
          />
          <label className="block text-sm">
            <span className="font-semibold text-forest-900">Statut</span>
            <select
              value={client.ownershipKind}
              onChange={(e) => updateClient("ownershipKind", e.target.value)}
              className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
            >
              {OWNERSHIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {isLegalEntity && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Raison sociale / nom SCI"
                value={client.legalEntityName ?? ""}
                onChange={(v) => updateClient("legalEntityName", v)}
                placeholder="SCI Famille Martin"
              />
              <Field
                label="SIRET"
                value={client.siret ?? ""}
                onChange={(v) => updateClient("siret", v)}
                placeholder="123 456 789 00012"
              />
            </div>
          )}
          <div className="mt-3 rounded-md border border-info-200 bg-info-50/40 p-2 text-[11px] text-info-900">
            <Info className="mr-1 inline h-3 w-3" />
            Une SCI à l&apos;IR est éligible à MPR (transparence fiscale). Une SCI à l&apos;IS est exclue de MPR mais peut accéder aux CEE classique + déductions BIC.
          </div>
        </CardContent>
      </Card>

      {/* 3. Spécificités tertiaire */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle
            icon={Shield}
            title="Spécificités tertiaire & réglementaire"
            subtitle="DEET, OPERAT, labels environnementaux pour bâtiments tertiaires."
          />
          <label className="flex items-start gap-2 rounded-md border border-cream-300 bg-cream-50 p-3 text-sm">
            <input
              type="checkbox"
              checked={tertiary.isTertiary}
              onChange={(e) => updateTertiary("isTertiary", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-forest-600"
            />
            <span>
              <span className="block font-semibold text-forest-900">
                Bâtiment à usage tertiaire
              </span>
              <span className="text-xs text-stone-600">
                Active les exigences DEET / OPERAT si surface ≥ 1 000 m².
              </span>
            </span>
          </label>

          {tertiary.isTertiary && (
            <div className="mt-3 space-y-4">
              <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={tertiary.deetSubject}
                  onChange={(e) =>
                    updateTertiary("deetSubject", e.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded accent-amber-600"
                />
                <span>
                  <span className="block font-semibold text-amber-900">
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                    Soumis au Décret tertiaire (DEET)
                  </span>
                  <span className="text-xs text-amber-800">
                    Déclaration annuelle OPERAT obligatoire · Objectifs −40 % en
                    2030, −50 % en 2040, −60 % en 2050.
                  </span>
                </span>
              </label>

              {tertiary.deetSubject && (
                <Field
                  label="Référence OPERAT (numéro EFA)"
                  value={tertiary.operatRef}
                  onChange={(v) => updateTertiary("operatRef", v)}
                  placeholder="EFA-2026-XXXXXX"
                />
              )}

              {/* Certifications RGE applicables */}
              <div>
                <p className="text-sm font-semibold text-forest-900">
                  Certifications RGE applicables aux travaux
                </p>
                <p className="text-xs text-stone-600">
                  Sélectionnez les qualifications exigées pour les artisans.
                </p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {RGE_CERTIFICATIONS.map((cert) => {
                    const active = tertiary.certifications.includes(cert);
                    return (
                      <button
                        key={cert}
                        type="button"
                        onClick={() =>
                          updateTertiary(
                            "certifications",
                            toggleArrItem(tertiary.certifications, cert),
                          )
                        }
                        className={[
                          "flex items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-xs font-semibold transition-colors",
                          active
                            ? "border-forest-500 bg-forest-50 text-forest-900"
                            : "border-cream-300 bg-white text-stone-700 hover:border-forest-300",
                        ].join(" ")}
                      >
                        {active && (
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-forest-700" />
                        )}
                        {cert}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Labels environnementaux */}
              <div>
                <p className="text-sm font-semibold text-forest-900">
                  Labels environnementaux visés
                </p>
                <p className="text-xs text-stone-600">
                  Démarche de certification souhaitée pour le bâtiment.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TERTIARY_LABELS.map((label) => {
                    const active = tertiary.targetLabels.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          updateTertiary(
                            "targetLabels",
                            toggleArrItem(tertiary.targetLabels, label),
                          )
                        }
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                          active
                            ? "bg-forest-700 text-white"
                            : "border border-cream-300 bg-white text-stone-700 hover:border-forest-300",
                        ].join(" ")}
                      >
                        {active && <CheckCircle2 className="h-3 w-3" />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Cible certification audit */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle
            icon={Award}
            title="Mission audit"
            subtitle="Cadre contractuel et certification visée par votre cabinet."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Auditeur principal"
              value={audit.auditorName}
              onChange={(v) => updateAudit("auditorName", v)}
            />
            <Field
              label="Certification auditeur"
              value={audit.auditorCertif}
              onChange={(v) => updateAudit("auditorCertif", v)}
              placeholder="OPQIBI 1905"
            />
            <label className="block text-sm">
              <span className="font-semibold text-forest-900">
                Certification visée
              </span>
              <select
                value={audit.targetCertification}
                onChange={(e) =>
                  updateAudit(
                    "targetCertification",
                    e.target.value as AuditInfo["targetCertification"],
                  )
                }
                className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
              >
                <option value="OPQIBI">OPQIBI</option>
                <option value="QUALIBAT_8731">Qualibat 8731</option>
                <option value="NF_HABITAT">NF Habitat</option>
                <option value="AUTRE">Autre</option>
              </select>
            </label>
            <Field
              label="Date de livraison cible"
              type="date"
              value={audit.targetDelivery}
              onChange={(v) => updateAudit("targetDelivery", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Données techniques bâtiment — réutilise EditProjectForm */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-forest-700">
          Données techniques du bâtiment (12 sections — identique à
          l&apos;espace particulier)
        </p>
        <EditProjectForm
          onSubmit={async () => ({
            ok: true,
            message: "Section bâtiment enregistrée.",
          })}
        />
      </div>

      {/* Save bar global */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest-300 bg-white p-3 shadow-lg">
        <p className="text-xs text-stone-600">
          Tous les blocs (client + tertiaire + audit) sont enregistrés ensemble. Le DPE, les scénarios et les aides seront recalculés automatiquement.
        </p>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saveState === "saving"}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-forest-800 disabled:bg-stone-300"
        >
          {saveState === "saving"
            ? "Enregistrement…"
            : "Enregistrer toutes les modifications"}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="font-serif text-lg font-bold text-forest-900">{title}</h2>
        <p className="text-sm text-stone-600">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-forest-900">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
      />
    </label>
  );
}
