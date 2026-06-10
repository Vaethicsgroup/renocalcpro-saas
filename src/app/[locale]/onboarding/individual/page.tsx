// app/[locale]/onboarding/individual/page.tsx — Onboarding particulier i18n complet
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Thermometer,
  Coins,
  Trophy,
  Leaf,
  Key,
  type LucideIcon,
} from "lucide-react";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";

interface ObjectiveOption {
  value: string;
  Icon: LucideIcon;
  labelKey: string;
}

const OBJECTIVES: ReadonlyArray<ObjectiveOption> = [
  { value: "comfort", Icon: Thermometer, labelKey: "objComfort" },
  { value: "savings", Icon: Coins, labelKey: "objSavings" },
  { value: "label", Icon: Trophy, labelKey: "objLabel" },
  { value: "ecology", Icon: Leaf, labelKey: "objEcology" },
  { value: "rental", Icon: Key, labelKey: "objRental" },
];

export default function OnboardingIndividualPage() {
  const router = useRouter();
  const t = useTranslations("onboardingIndividual");
  const locale = useLocale();
  const [step, setStep] = useState(0);

  const steps = [
    { key: "welcome", label: t("stepWelcome") },
    { key: "logement", label: t("stepLogement") },
    { key: "objectif", label: t("stepObjectif") },
    { key: "ready", label: t("stepReady") },
  ];

  const welcomeBenefits = [
    t("welcomeBenefit1"),
    t("welcomeBenefit2"),
    t("welcomeBenefit3"),
    t("welcomeBenefit4"),
  ];

  return (
    <div className="relative min-h-screen bg-cream-50 px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px] overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-forest-100/40 blur-3xl sm:h-96 sm:w-[800px]" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white/85 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-forest-700 shadow-soft">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
            {t("eyebrow")}
          </p>
          <h1
            className="mt-3 font-serif text-3xl font-bold tracking-tight text-night-800 md:text-4xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            {t("title")}
          </h1>
        </header>

        <div className="mb-8 flex justify-center">
          <OnboardingStepper steps={steps} currentStep={step} />
        </div>

        {step === 0 && (
          <Card variant="featured">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
                <Sparkles className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <CardTitle>{t("welcomeTitle")}</CardTitle>
              <CardDescription>{t("welcomeBody")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {welcomeBenefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-sm text-stone-700"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700"
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="mt-6"
                onClick={() => setStep(1)}
                iconRight={
                  <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                }
              >
                {t("welcomeCta")}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("logementTitle")}</CardTitle>
              <CardDescription>{t("logementSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t("logementTypeLabel")} htmlFor="type" required>
                  <Select id="type">
                    <option>{t("logementTypeMaison")}</option>
                    <option>{t("logementTypeAppartement")}</option>
                    <option>{t("logementTypeImmeuble")}</option>
                  </Select>
                </FormField>
                <FormField label={t("logementYearLabel")} htmlFor="year">
                  <Input
                    id="year"
                    type="number"
                    placeholder={t("logementYearPh")}
                  />
                </FormField>
                <FormField label={t("logementPostalLabel")} htmlFor="cp" required>
                  <Input id="cp" placeholder={t("logementPostalPh")} />
                </FormField>
                <FormField label={t("logementSurfaceLabel")} htmlFor="surf">
                  <Input
                    id="surf"
                    type="number"
                    placeholder={t("logementSurfacePh")}
                  />
                </FormField>
              </div>
              <div className="mt-6 flex justify-between gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setStep(0)}
                  iconLeft={
                    <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
                  }
                >
                  {t("btnBack")}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setStep(2)}
                  iconRight={
                    <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                  }
                >
                  {t("btnContinue")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("objectiveTitle")}</CardTitle>
              <CardDescription>{t("objectiveSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {OBJECTIVES.map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-cream-300 bg-white p-4 transition-colors hover:border-forest-300 hover:bg-cream-50/80"
                  >
                    <input
                      type="radio"
                      name="objective"
                      value={o.value}
                      className="h-4 w-4 accent-forest-600"
                    />
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-700"
                    >
                      <o.Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-medium text-night-800">
                      {t(o.labelKey)}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex justify-between gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setStep(1)}
                  iconLeft={
                    <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
                  }
                >
                  {t("btnBack")}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setStep(3)}
                  iconRight={
                    <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                  }
                >
                  {t("btnContinue")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card variant="featured">
            <CardContent>
              <div className="text-center">
                <div
                  aria-hidden
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-100 text-forest-700"
                >
                  <Sparkles className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <h3
                  className="mt-4 font-serif text-2xl font-bold text-night-800"
                  style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
                >
                  {t("readyTitle")}
                </h3>
                <p className="mt-2 text-sm text-stone-600">{t("readyBody")}</p>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="mt-6"
                  onClick={() => router.push(`/${locale}/p/dashboard`)}
                  iconRight={
                    <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                  }
                >
                  {t("readyCta")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
