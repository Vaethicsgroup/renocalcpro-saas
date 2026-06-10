// src/components/o/ProIntakeForm.tsx
// ════════════════════════════════════════════════════════════════════════════
// Formulaire « Nouveau dossier professionnel » qui précède le wizard de
// saisie bâtiment. Capture le contexte de mission (client, bien, type
// d'audit, priorité) puis bascule sur /p/projects/new?from=pro qui consomme
// l'intake pour pré-remplir projectName + location.
//
// Côté client uniquement — pas de server action, pas d'appel réseau,
// localStorage exclusivement.
// ════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Building2,
  Home,
  ClipboardList,
  Mail,
  MapPin,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  Info,
  Calculator,
  FileText,
  Gauge,
  Sparkles,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { FormField, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  PRO_INTAKE_VERSION,
  saveProIntake,
  getBrowserStorage,
  type ProIntakeData,
  type ProMissionType,
  type ProClientContext,
  type ProPriority,
} from "@/lib/profiles/pro-intake";

interface Props {
  locale: string;
}

const MISSION_OPTIONS: ReadonlyArray<{
  value: ProMissionType;
  Icon: LucideIcon;
  descKey: string;
  labelKey: string;
}> = [
  { value: "AUDIT_ENERGETIQUE", Icon: ClipboardList, descKey: "missionAuditDesc", labelKey: "missionAudit" },
  { value: "DPE", Icon: Gauge, descKey: "missionDpeDesc", labelKey: "missionDpe" },
  { value: "GES", Icon: Sparkles, descKey: "missionGesDesc", labelKey: "missionGes" },
  { value: "ETUDE_THERMIQUE", Icon: Calculator, descKey: "missionEtudeDesc", labelKey: "missionEtude" },
  { value: "SCENARIO_TRAVAUX", Icon: FileText, descKey: "missionScenarioDesc", labelKey: "missionScenario" },
  { value: "CONSEIL", Icon: Lightbulb, descKey: "missionConseilDesc", labelKey: "missionConseil" },
];

const CONTEXT_OPTIONS: ReadonlyArray<{
  value: ProClientContext;
  Icon: LucideIcon;
  labelKey: string;
}> = [
  { value: "PARTICULIER", Icon: Home, labelKey: "ctxParticulier" },
  { value: "COPRO", Icon: Building2, labelKey: "ctxCopro" },
  { value: "BIEN_IMMOBILIER", Icon: Briefcase, labelKey: "ctxBien" },
  { value: "TERTIAIRE", Icon: Building2, labelKey: "ctxTertiaire" },
];

const PRIORITY_LABEL_KEYS: Record<ProPriority, string> = {
  LOW: "priorityLow",
  NORMAL: "priorityNormal",
  HIGH: "priorityHigh",
  URGENT: "priorityUrgent",
};

const PRIORITY_OPTIONS: ReadonlyArray<ProPriority> = ["LOW", "NORMAL", "HIGH", "URGENT"];

const PRIORITY_TONE_CLASSES: Record<ProPriority, string> = {
  LOW: "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50",
  NORMAL: "border-info-300 bg-white text-info-800 hover:border-info-400 hover:bg-info-50",
  HIGH: "border-amber-300 bg-white text-amber-800 hover:border-amber-400 hover:bg-amber-50",
  URGENT: "border-terracotta-300 bg-white text-terracotta-800 hover:border-terracotta-400 hover:bg-terracotta-50",
};
const PRIORITY_ACTIVE_CLASSES: Record<ProPriority, string> = {
  LOW: "border-stone-500 bg-stone-100 text-stone-900 ring-2 ring-stone-200",
  NORMAL: "border-info-600 bg-info-100 text-info-900 ring-2 ring-info-200",
  HIGH: "border-amber-600 bg-amber-100 text-amber-900 ring-2 ring-amber-200",
  URGENT: "border-terracotta-600 bg-terracotta-100 text-terracotta-900 ring-2 ring-terracotta-200",
};

export function ProIntakeForm({ locale }: Props) {
  const router = useRouter();
  const t = useTranslations("proIntake");

  const [dossierName, setDossierName] = useState("");
  const [missionType, setMissionType] = useState<ProMissionType>("AUDIT_ENERGETIQUE");
  const [clientContext, setClientContext] = useState<ProClientContext>("PARTICULIER");
  const [priority, setPriority] = useState<ProPriority>("NORMAL");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyPostalCode, setPropertyPostalCode] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Validation simple côté client
  const isValid =
    dossierName.trim().length > 0 &&
    clientName.trim().length > 0 &&
    propertyAddress.trim().length > 0 &&
    propertyPostalCode.trim().length > 0 &&
    propertyCity.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStorageWarning(null);

    if (!isValid) {
      setError(t("errorMissing"));
      return;
    }

    const payload: ProIntakeData = {
      version: PRO_INTAKE_VERSION,
      createdAt: new Date().toISOString(),
      dossierName: dossierName.trim(),
      missionType,
      clientContext,
      priority,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      propertyAddress: propertyAddress.trim(),
      propertyPostalCode: propertyPostalCode.trim(),
      propertyCity: propertyCity.trim(),
      notes: notes.trim() || undefined,
    };

    const storage = getBrowserStorage();
    const result = saveProIntake(storage, payload);

    if (result === "error") {
      // On affiche un warning mais on continue quand même la navigation.
      // L'utilisateur perdra le pré-remplissage mais pas la navigation.
      setStorageWarning(t("storageWarning"));
    }

    router.push(`/${locale}/p/projects/new?from=pro`);
  }

  function handleSkip() {
    router.push(`/${locale}/p/projects/new?from=pro`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* ───────────────────────────────────────────────────────────────────
          Section 1 — Type de mission
          ─────────────────────────────────────────────────────────────────── */}
      <Section
        title={t("sec1Title")}
        description={t("sec1Desc")}
        icon={ClipboardList}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MISSION_OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            const active = missionType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMissionType(opt.value)}
                aria-pressed={active}
                className={[
                  "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition",
                  active
                    ? "border-forest-600 bg-forest-50 ring-2 ring-forest-100"
                    : "border-cream-300 bg-white hover:border-forest-300 hover:bg-cream-50",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className={[
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                    active ? "bg-forest-600 text-white" : "bg-forest-100 text-forest-700",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-forest-900">
                    {t(opt.labelKey)}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                    {t(opt.descKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ───────────────────────────────────────────────────────────────────
          Section 2 — Contexte client
          ─────────────────────────────────────────────────────────────────── */}
      <Section
        title={t("sec2Title")}
        description={t("sec2Desc")}
        icon={Briefcase}
      >
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {CONTEXT_OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            const active = clientContext === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setClientContext(opt.value)}
                aria-pressed={active}
                className={[
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition",
                  active
                    ? "border-forest-600 bg-forest-50 ring-2 ring-forest-100"
                    : "border-cream-300 bg-white hover:border-forest-300 hover:bg-cream-50",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className={[
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                    active ? "bg-forest-600 text-white" : "bg-forest-100 text-forest-700",
                  ].join(" ")}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="text-xs font-semibold leading-tight text-forest-900">
                  {t(opt.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ───────────────────────────────────────────────────────────────────
          Section 3 — Coordonnées dossier
          ─────────────────────────────────────────────────────────────────── */}
      <Section
        title={t("sec3Title")}
        description={t("sec3Desc")}
        icon={Mail}
      >
        <div className="grid gap-4">
          <FormField label={t("dossierNameLabel")} htmlFor="dossierName" required helper={t("dossierNameHelper")}>
            <Input
              id="dossierName"
              name="dossierName"
              type="text"
              required
              value={dossierName}
              onChange={(e) => setDossierName(e.target.value)}
              placeholder={t("dossierNamePh")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("clientNameLabel")} htmlFor="clientName" required>
              <Input
                id="clientName"
                name="clientName"
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={clientContext === "COPRO" ? t("clientNamePhCopro") : t("clientNamePh")}
              />
            </FormField>

            <FormField label={t("clientEmailLabel")} htmlFor="clientEmail" helper={t("clientEmailHelper")}>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder={t("clientEmailPh")}
              />
            </FormField>
          </div>

          <FormField label={t("clientPhoneLabel")} htmlFor="clientPhone">
            <Input
              id="clientPhone"
              name="clientPhone"
              type="tel"
              inputMode="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder={t("clientPhonePh")}
            />
          </FormField>
        </div>
      </Section>

      {/* ───────────────────────────────────────────────────────────────────
          Section 4 — Localisation du bien
          ─────────────────────────────────────────────────────────────────── */}
      <Section
        title={t("sec4Title")}
        description={t("sec4Desc")}
        icon={MapPin}
      >
        <div className="grid gap-4">
          <FormField label={t("addressLabel")} htmlFor="propertyAddress" required>
            <Input
              id="propertyAddress"
              name="propertyAddress"
              type="text"
              required
              autoComplete="street-address"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder={t("addressPh")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <FormField label={t("postalCodeLabel")} htmlFor="propertyPostalCode" required>
              <Input
                id="propertyPostalCode"
                name="propertyPostalCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                required
                value={propertyPostalCode}
                onChange={(e) => setPropertyPostalCode(e.target.value)}
                placeholder={t("postalCodePh")}
              />
            </FormField>

            <FormField label={t("cityLabel")} htmlFor="propertyCity" required>
              <Input
                id="propertyCity"
                name="propertyCity"
                type="text"
                required
                value={propertyCity}
                onChange={(e) => setPropertyCity(e.target.value)}
                placeholder={t("cityPh")}
              />
            </FormField>
          </div>
        </div>
      </Section>

      {/* ───────────────────────────────────────────────────────────────────
          Section 5 — Priorité et notes
          ─────────────────────────────────────────────────────────────────── */}
      <Section
        title={t("sec5Title")}
        description={t("sec5Desc")}
        icon={Sparkles}
      >
        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-forest-900">
              {t("priorityLabel")}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRIORITY_OPTIONS.map((p) => {
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    aria-pressed={active}
                    className={[
                      "inline-flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-xs font-semibold transition",
                      active
                        ? PRIORITY_ACTIVE_CLASSES[p]
                        : PRIORITY_TONE_CLASSES[p],
                    ].join(" ")}
                  >
                    {t(PRIORITY_LABEL_KEYS[p])}
                  </button>
                );
              })}
            </div>
          </div>

          <FormField
            label={t("notesLabel")}
            htmlFor="notes"
            helper={t("notesHelper")}
          >
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPh")}
            />
          </FormField>
        </div>
      </Section>

      {/* ───────────────────────────────────────────────────────────────────
          Messages
          ─────────────────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-terracotta-300 bg-terracotta-50 p-3 text-xs text-terracotta-800"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <p>{error}</p>
        </div>
      )}
      {storageWarning && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <p>{storageWarning}</p>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          CTAs
          ─────────────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-cream-300 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}/o/projects`}
            className="text-xs font-semibold text-stone-600 hover:text-forest-700"
          >
            {t("cancelLink")}
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-cream-300 bg-white px-4 text-xs font-semibold text-forest-900 transition hover:border-forest-300 hover:bg-cream-50"
            >
              {t("skipBtn")}
            </button>
            <Button
              type="submit"
              size="lg"
              variant="primary"
              iconRight={<ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
            >
              {t("submitBtn")}
            </Button>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-stone-500">
          <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden />
          {t("footnote")}
        </p>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700 ring-1 ring-forest-200"
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2
            className="font-serif text-lg font-bold text-forest-900"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            {title}
          </h2>
          <p className="text-xs text-stone-600">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
