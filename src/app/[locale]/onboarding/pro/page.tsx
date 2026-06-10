// app/[locale]/onboarding/pro/page.tsx — Onboarding pro i18n complet
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const PRESET_KEYS_BY_SEGMENT: Record<string, { templateKeys: string[]; libKeys: string[] }> = {
  auditeur:       { templateKeys: ["presetTmplAuditPart", "presetTmplAuditTert"], libKeys: ["presetLibMat", "presetLibSys", "presetLibHygro"] },
  diagnostiqueur: { templateKeys: ["presetTmplDpeCol"],                            libKeys: ["presetLibMat"] },
  syndic:         { templateKeys: ["presetTmplCopro"],                             libKeys: ["presetLibSysCol"] },
  bureau_etudes:  { templateKeys: ["presetTmplAuditTert", "presetTmplAuditPart"], libKeys: ["presetLibMat", "presetLibHygro", "presetLibExportIfc"] },
  agence:         { templateKeys: ["presetTmplEstimMarket"],                       libKeys: ["presetLibCalLoiClimat"] },
};

export default function OnboardingProPage() {
  const router = useRouter();
  const t = useTranslations("onboardingPro");
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [segment, setSegment] = useState("auditeur");
  const presetKeys = PRESET_KEYS_BY_SEGMENT[segment] ?? PRESET_KEYS_BY_SEGMENT.auditeur;
  const presets = { templates: presetKeys.templateKeys.map(k => t(k)), libs: presetKeys.libKeys.map(k => t(k)) };

  const steps = [
    { key: "cabinet", label: t("stepCabinet") },
    { key: "preferences", label: t("stepPreferences") },
    { key: "ready", label: t("stepReady") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-white/70 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-forest-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
            {t("proEyebrow")}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
            {t("proTitle")}
          </h1>
        </header>

        <div className="mb-8 flex justify-center">
          <OnboardingStepper steps={steps} currentStep={step} />
        </div>

        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("cabinetTitle")}</CardTitle>
              <CardDescription>{t("cabinetSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t("cabinetLegalName")} htmlFor="rs" required>
                  <Input id="rs" placeholder={t("cabinetLegalNamePh")} />
                </FormField>
                <FormField label={t("cabinetSiret")} htmlFor="siret" helper={t("cabinetSiretHelper")}>
                  <Input id="siret" placeholder={t("cabinetSiretPh")} />
                </FormField>
                <FormField label={t("cabinetAddress")} htmlFor="addr" className="sm:col-span-2" required>
                  <Input id="addr" placeholder={t("cabinetAddressPh")} />
                </FormField>
                <FormField label={t("cabinetPhone")} htmlFor="tel">
                  <Input id="tel" type="tel" placeholder={t("cabinetPhonePh")} />
                </FormField>
                <FormField label={t("cabinetWeb")} htmlFor="web">
                  <Input id="web" type="url" placeholder={t("cabinetWebPh")} />
                </FormField>
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" size="md" disabled>← {t("btnBack")}</Button>
                <Button variant="primary" size="md" onClick={() => setStep(1)}>{t("btnContinue")} →</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("preferencesTitle")}</CardTitle>
              <CardDescription>{t("preferencesSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField label={t("segmentLabel")} htmlFor="segment" required>
                <Select id="segment" value={segment} onChange={e => setSegment(e.target.value)}>
                  <option value="auditeur">{t("segmentAuditeur")}</option>
                  <option value="diagnostiqueur">{t("segmentDiagnostiqueur")}</option>
                  <option value="syndic">{t("segmentSyndic")}</option>
                  <option value="bureau_etudes">{t("segmentBureauEtudes")}</option>
                  <option value="agence">{t("segmentAgence")}</option>
                </Select>
              </FormField>

              <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4">
                <p className="text-2xs font-semibold uppercase tracking-wider text-teal-700">{t("presetsTitle")}</p>
                <p className="mt-1 text-sm text-stone-700">{t("presetsTemplates")}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {presets.templates.map(tpl => <Badge key={tpl} size="sm">{tpl}</Badge>)}
                </div>
                <p className="mt-3 text-sm text-stone-700">{t("presetsLibs")}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {presets.libs.map(l => <Badge key={l} size="sm">{l}</Badge>)}
                </div>
              </div>

              <FormField label={t("volumeLabel")} htmlFor="vol" className="mt-5">
                <Select id="vol">
                  <option>{t("volume1_5")}</option>
                  <option>{t("volume6_20")}</option>
                  <option>{t("volume21_50")}</option>
                  <option>{t("volume50plus")}</option>
                </Select>
              </FormField>

              <div className="mt-6 flex justify-between">
                <Button variant="ghost" size="md" onClick={() => setStep(0)}>← {t("btnBack")}</Button>
                <Button variant="primary" size="md" onClick={() => setStep(2)}>{t("btnContinue")} →</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card variant="featured">
            <CardContent>
              <div className="text-center">
                <p className="text-5xl">🚀</p>
                <h3 className="mt-4 font-serif text-2xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
                  {t("activatedTitle")}
                </h3>
                <p className="mt-2 text-sm text-stone-600">{t("activatedSubtitle")}</p>
                <ul className="mt-5 mx-auto max-w-md space-y-2 text-left text-sm">
                  <li className="flex items-start gap-2"><span aria-hidden className="text-success-700">✓</span> {t("activatedBullet1", { count: presets.templates.length })}</li>
                  <li className="flex items-start gap-2"><span aria-hidden className="text-success-700">✓</span> {t("activatedBullet2")}</li>
                  <li className="flex items-start gap-2"><span aria-hidden className="text-success-700">✓</span> {t("activatedBullet3")}</li>
                  <li className="flex items-start gap-2"><span aria-hidden className="text-success-700">✓</span> {t("activatedBullet4")}</li>
                </ul>
                <Button variant="primary" size="lg" fullWidth className="mt-6" onClick={() => router.push(`/${locale}/o/dashboard`)}>
                  {t("readyCta")} →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
