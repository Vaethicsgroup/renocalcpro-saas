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
import { useTranslations } from "next-intl";
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

const OWNERSHIP_OPTIONS: ReadonlyArray<{ value: string; labelKey: string }> = [
  { value: "PROPRIETAIRE_OCCUPANT", labelKey: "ownerOccupant" },
  { value: "PROPRIETAIRE_BAILLEUR", labelKey: "ownerLandlord" },
  { value: "LOCATAIRE", labelKey: "ownerTenant" },
  { value: "SCI_FAMILIALE_IR", labelKey: "ownerSciIr" },
  { value: "SCI_PATRIMONIALE_IS", labelKey: "ownerSciIs" },
  { value: "INDIVISION", labelKey: "ownerIndivision" },
  { value: "USUFRUITIER", labelKey: "ownerUsufruit" },
  { value: "SYNDIC_COPRO", labelKey: "ownerSyndic" },
  { value: "BAILLEUR_SOCIAL", labelKey: "ownerHlm" },
  { value: "PERSONNE_MORALE_ENTREPRISE", labelKey: "ownerEntreprise" },
];

const RGE_CERTIFICATION_KEYS: ReadonlyArray<string> = [
  "certRgeQualibat8731",
  "certRgeOpqibi1905",
  "certRgeQualiPAC",
  "certRgeQualiPV",
  "certRgeQualiSol",
  "certRgeQualibois",
  "certRgeQualiBat",
];

const TERTIARY_LABEL_KEYS: ReadonlyArray<{ key?: string; label?: string }> = [
  { key: "labelHqe" },
  { label: "BREEAM" },
  { label: "LEED" },
  { label: "BEPOS Effinergie" },
  { label: "E+C- (RE2020)" },
  { label: "PassivHaus" },
  { label: "BiodiverCity" },
];

export default function ProjectEditPage() {
  const params = useParams<{ locale: string; id: string }>();
  const locale = params?.locale ?? "fr";
  const projectId = params?.id ?? "";
  const t = useTranslations("oEdit");

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
          {t("back")}
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
                {t("eyebrow")}
              </p>
              <h1
                className="font-serif text-2xl font-bold text-forest-900 md:text-3xl"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {t("heroTitle")}
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                {t("heroSubtitle")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {saveState === "success" && (
        <div className="flex items-center gap-2 rounded-md border border-forest-300 bg-forest-50 px-4 py-3 text-sm text-forest-900">
          <CheckCircle2 className="h-4 w-4 text-forest-700" />
          {t("savedAll")}
        </div>
      )}

      {/* 1. Identité client structurée */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle
            icon={User}
            title={t("secClientTitle")}
            subtitle={t("secClientSubtitle")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("labelFirstName")}
              required
              value={client.firstName}
              onChange={(v) => updateClient("firstName", v)}
            />
            <Field
              label={t("labelLastName")}
              required
              value={client.lastName}
              onChange={(v) => updateClient("lastName", v)}
            />
            <Field
              label={t("labelEmail")}
              type="email"
              required
              value={client.email}
              onChange={(v) => updateClient("email", v)}
            />
            <Field
              label={t("labelPhone")}
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
            title={t("secOwnerTitle")}
            subtitle={t("secOwnerSubtitle")}
          />
          <label className="block text-sm">
            <span className="font-semibold text-forest-900">{t("labelStatus")}</span>
            <select
              value={client.ownershipKind}
              onChange={(e) => updateClient("ownershipKind", e.target.value)}
              className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
            >
              {OWNERSHIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.labelKey)}
                </option>
              ))}
            </select>
          </label>
          {isLegalEntity && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label={t("labelLegalEntity")}
                value={client.legalEntityName ?? ""}
                onChange={(v) => updateClient("legalEntityName", v)}
                placeholder={t("phLegalEntity")}
              />
              <Field
                label={t("labelSiret")}
                value={client.siret ?? ""}
                onChange={(v) => updateClient("siret", v)}
                placeholder={t("phSiret")}
              />
            </div>
          )}
          <div className="mt-3 rounded-md border border-info-200 bg-info-50/40 p-2 text-[11px] text-info-900">
            <Info className="mr-1 inline h-3 w-3" />
            {t("infoSci")}
          </div>
        </CardContent>
      </Card>

      {/* 3. Spécificités tertiaire */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle
            icon={Shield}
            title={t("secTertiaryTitle")}
            subtitle={t("secTertiarySubtitle")}
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
                {t("isTertiary")}
              </span>
              <span className="text-xs text-stone-600">
                {t("isTertiaryDesc")}
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
                    {t("deetSubject")}
                  </span>
                  <span className="text-xs text-amber-800">
                    {t("deetDesc")}
                  </span>
                </span>
              </label>

              {tertiary.deetSubject && (
                <Field
                  label={t("labelOperatRef")}
                  value={tertiary.operatRef}
                  onChange={(v) => updateTertiary("operatRef", v)}
                  placeholder={t("phOperatRef")}
                />
              )}

              {/* Certifications RGE applicables */}
              <div>
                <p className="text-sm font-semibold text-forest-900">
                  {t("labelRgeApplicable")}
                </p>
                <p className="text-xs text-stone-600">
                  {t("rgeApplicableDesc")}
                </p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {RGE_CERTIFICATION_KEYS.map((certKey) => {
                    const cert = t(certKey);
                    const active = tertiary.certifications.includes(cert);
                    return (
                      <button
                        key={certKey}
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
                  {t("labelEnvLabels")}
                </p>
                <p className="text-xs text-stone-600">
                  {t("envLabelsDesc")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TERTIARY_LABEL_KEYS.map((item) => {
                    const label = item.key ? t(item.key) : item.label!;
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
            title={t("secAuditTitle")}
            subtitle={t("secAuditSubtitle")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("labelAuditorName")}
              value={audit.auditorName}
              onChange={(v) => updateAudit("auditorName", v)}
            />
            <Field
              label={t("labelAuditorCertif")}
              value={audit.auditorCertif}
              onChange={(v) => updateAudit("auditorCertif", v)}
              placeholder={t("phAuditorCertif")}
            />
            <label className="block text-sm">
              <span className="font-semibold text-forest-900">
                {t("labelTargetCertif")}
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
                <option value="QUALIBAT_8731">{t("certifQualibat")}</option>
                <option value="NF_HABITAT">{t("certifNfHabitat")}</option>
                <option value="AUTRE">{t("certifOther")}</option>
              </select>
            </label>
            <Field
              label={t("labelDeliveryDate")}
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
          {t("buildingDataLabel")}
        </p>
        <EditProjectForm
          onSubmit={async () => ({
            ok: true,
            message: t("buildingDataSavedMsg"),
          })}
        />
      </div>

      {/* Save bar global */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest-300 bg-white p-3 shadow-lg">
        <p className="text-xs text-stone-600">
          {t("saveBarText")}
        </p>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saveState === "saving"}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-forest-800 disabled:bg-stone-300"
        >
          {saveState === "saving"
            ? t("btnSaving")
            : t("btnSaveAll")}
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
