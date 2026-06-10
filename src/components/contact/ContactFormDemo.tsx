// src/components/contact/ContactFormDemo.tsx — i18n complet via namespace contactDemo.
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Info,
  Mail,
  RotateCcw,
  Send,
} from "lucide-react";

interface Props {
  locale: string;
  contactEmail?: string;
}

export function ContactFormDemo({
  locale,
  contactEmail = "contact@renocalcpro.fr",
}: Props) {
  const t = useTranslations("contactDemo");
  const [sent, setSent] = useState(false);
  const [submittedName, setSubmittedName] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("fullname") || "").trim();
    setSubmittedName(name);
    setSent(true);
  }

  function handleReset() {
    setSent(false);
    setSubmittedName("");
  }

  if (sent) {
    const firstName = submittedName ? submittedName.split(" ")[0] : "";
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-6 w-6" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className="font-serif text-xl font-bold text-emerald-900 md:text-2xl"
              style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
            >
              {t("sentTitle")}
              {firstName ? t("sentTitleSuffix", { name: firstName }) : ""}
            </h2>
            <p className="mt-1 text-sm text-emerald-900/85">
              {t("sentSubtitle")}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} aria-hidden />
          <div className="text-xs leading-relaxed text-amber-900">
            <p className="font-semibold">{t("sentDemoStrong")}</p>
            <p className="mt-1">{t("sentDemoBody")}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1F4D2E] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163724]"
          >
            <Mail className="h-4 w-4" strokeWidth={2} aria-hidden />
            {t("mailtoCta", { email: contactEmail })}
          </a>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
            {t("resetCta")}
          </button>
        </div>

        <p className="mt-4 text-[11px] text-stone-600">{t("phoneNote")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate={false} className="mt-6 grid gap-5">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" strokeWidth={2} aria-hidden />
        <p>
          <span className="font-semibold">{t("bannerStrong")}</span>{" "}
          {t.rich("bannerBody", {
            email: contactEmail,
            link: (chunks) => (
              <a
                href={`mailto:${contactEmail}`}
                className="font-semibold text-[#1F4D2E] underline hover:text-[#163724]"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("fullnameLabel")} htmlFor="fullname" required>
          <input
            id="fullname"
            name="fullname"
            type="text"
            autoComplete="name"
            required
            placeholder={t("fullnamePh")}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3.5 text-base text-stone-900 placeholder-stone-400 transition-colors focus:border-[#1F4D2E]/60 focus:outline-none focus:ring-2 focus:ring-[#1F4D2E]/15 sm:text-sm"
          />
        </Field>
        <Field label={t("phoneLabel")} htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("phonePh")}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3.5 text-base text-stone-900 placeholder-stone-400 transition-colors focus:border-[#1F4D2E]/60 focus:outline-none focus:ring-2 focus:ring-[#1F4D2E]/15 sm:text-sm"
          />
        </Field>
      </div>

      <Field label={t("emailLabel")} htmlFor="email" required>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("emailPh")}
          className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3.5 text-base text-stone-900 placeholder-stone-400 transition-colors focus:border-[#1F4D2E]/60 focus:outline-none focus:ring-2 focus:ring-[#1F4D2E]/15 sm:text-sm"
        />
      </Field>

      <Field label={t("addressLabel")} htmlFor="propertyAddress">
        <input
          id="propertyAddress"
          name="propertyAddress"
          type="text"
          autoComplete="street-address"
          placeholder={t("addressPh")}
          className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3.5 text-base text-stone-900 placeholder-stone-400 transition-colors focus:border-[#1F4D2E]/60 focus:outline-none focus:ring-2 focus:ring-[#1F4D2E]/15 sm:text-sm"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label={t("projectTypeLabel")} htmlFor="projectType" required>
          <select
            id="projectType"
            name="projectType"
            required
            defaultValue=""
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3.5 text-base text-stone-900 transition-colors focus:border-[#1F4D2E]/60 focus:outline-none focus:ring-2 focus:ring-[#1F4D2E]/15 sm:text-sm"
          >
            <option value="" disabled>{t("projectTypePh")}</option>
            <option value="audit_energetique">{t("projectAuditEnergetique")}</option>
            <option value="renovation_globale">{t("projectRenovationGlobale")}</option>
            <option value="isolation">{t("projectIsolation")}</option>
            <option value="chauffage">{t("projectChauffage")}</option>
            <option value="dpe">{t("projectDPE")}</option>
            <option value="copropriete">{t("projectCopropriete")}</option>
            <option value="tertiaire">{t("projectTertiaire")}</option>
            <option value="conseil">{t("projectConseil")}</option>
            <option value="autre">{t("projectAutre")}</option>
          </select>
        </Field>
        <Field label={t("budgetLabel")} htmlFor="budget">
          <select
            id="budget"
            name="budget"
            defaultValue=""
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3.5 text-base text-stone-900 transition-colors focus:border-[#1F4D2E]/60 focus:outline-none focus:ring-2 focus:ring-[#1F4D2E]/15 sm:text-sm"
          >
            <option value="" disabled>{t("budgetPh")}</option>
            <option value="lt_10k">{t("budgetLt10")}</option>
            <option value="10_30k">{t("budget1030")}</option>
            <option value="30_60k">{t("budget3060")}</option>
            <option value="60_100k">{t("budget60100")}</option>
            <option value="gt_100k">{t("budgetGt100")}</option>
            <option value="unknown">{t("budgetUnknown")}</option>
          </select>
        </Field>
        <Field label={t("timeframeLabel")} htmlFor="timeframe">
          <select
            id="timeframe"
            name="timeframe"
            defaultValue=""
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3.5 text-base text-stone-900 transition-colors focus:border-[#1F4D2E]/60 focus:outline-none focus:ring-2 focus:ring-[#1F4D2E]/15 sm:text-sm"
          >
            <option value="" disabled>{t("timeframePh")}</option>
            <option value="immediat">{t("timeImmediat")}</option>
            <option value="lt_3m">{t("timeLt3m")}</option>
            <option value="3_6m">{t("time36m")}</option>
            <option value="6_12m">{t("time612m")}</option>
            <option value="gt_12m">{t("timeGt12m")}</option>
            <option value="exploratoire">{t("timeExplo")}</option>
          </select>
        </Field>
      </div>

      <Field label={t("messageLabel")} htmlFor="message" required>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder={t("messagePh")}
          className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-base text-stone-900 placeholder-stone-400 transition-colors focus:border-[#1F4D2E]/60 focus:outline-none focus:ring-2 focus:ring-[#1F4D2E]/15 sm:text-sm"
        />
      </Field>

      <Field label={t("docsLinkLabel")} htmlFor="docsLink">
        <input
          id="docsLink"
          name="docsLink"
          type="url"
          inputMode="url"
          placeholder={t("docsLinkPh")}
          className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3.5 text-base text-stone-900 placeholder-stone-400 transition-colors focus:border-[#1F4D2E]/60 focus:outline-none focus:ring-2 focus:ring-[#1F4D2E]/15 sm:text-sm"
        />
      </Field>
      <p className="-mt-3 text-xs leading-relaxed text-stone-600">
        {t("docsHelp")}
      </p>

      <label className="flex items-start gap-2.5 text-xs text-stone-600">
        <input
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 rounded border-stone-300"
          style={{ accentColor: "#1F4D2E" }}
        />
        <span>
          {t.rich("consentBody", {
            link: (chunks) => (
              <a
                href={`/${locale}/legal/privacy`}
                className="font-semibold text-[#1F4D2E] transition-colors hover:underline"
              >
                {chunks}
              </a>
            ),
          })}
        </span>
      </label>

      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1F4D2E] px-6 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#163724] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D2E]/40 focus-visible:ring-offset-2"
      >
        {t("submit")}
        <Send className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[#1F4D2E]">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
