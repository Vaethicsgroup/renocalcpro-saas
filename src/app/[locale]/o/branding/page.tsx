// app/[locale]/o/branding/page.tsx — Marque & entreprise v2
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  Palette,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Award,
  Globe,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  FileSignature,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface CompanyInfo {
  legalName: string;
  tradeName: string;
  siret: string;
  vatNumber: string;
  legalForm: string;
  capital: string;
  rcs: string;
  ape: string;
  addressLine: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  rgeCertifications: string;
  insurance: string;
}

interface Branding {
  primaryColor: string;
  accentColor: string;
  footerText: string;
  legalMentions: string;
  reportSignature: string;
}

const INITIAL_COMPANY: CompanyInfo = {
  legalName: "Cabinet Dupont Audit Énergétique",
  tradeName: "Cabinet Dupont",
  siret: "823 456 789 00012",
  vatNumber: "FR12 823456789",
  legalForm: "SARL",
  capital: "10 000 €",
  rcs: "RCS Paris 823 456 789",
  ape: "7112B — Ingénierie, études techniques",
  addressLine: "12 rue des Lilas",
  postalCode: "75011",
  city: "Paris",
  country: "France",
  phone: "01 23 45 67 89",
  email: "contact@cabinet-dupont.fr",
  website: "https://cabinet-dupont.fr",
  rgeCertifications: "OPQIBI 1905 (Études thermiques) · Qualibat 8731 (Audit énergétique)",
  insurance: "RCP MMA n° 123456789",
};

const INITIAL_BRANDING: Branding = {
  primaryColor: "#1F4D2E",
  accentColor: "#FF8A00",
  footerText: "Cabinet Dupont · OPQIBI 1905 · 12 rue des Lilas, 75011 Paris · contact@cabinet-dupont.fr",
  legalMentions: "SARL au capital de 10 000 € · RCS Paris 823 456 789 · TVA intracom FR12 823456789 · Assurance RCP MMA n° 123456789",
  reportSignature: "Jean Dupont\nGérant — Auditeur certifié OPQIBI\nCabinet Dupont",
};

export default function BrandingPage() {
  const t = useTranslations("oBranding");
  const [company, setCompany] = useState<CompanyInfo>(INITIAL_COMPANY);
  const [branding, setBranding] = useState<Branding>(INITIAL_BRANDING);
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateCompany = <K extends keyof CompanyInfo>(key: K, value: CompanyInfo[K]) =>
    setCompany((prev) => ({ ...prev, [key]: value }));

  const updateBranding = <K extends keyof Branding>(key: K, value: Branding[K]) =>
    setBranding((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoFile(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-5 shadow-sm sm:p-6">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
          <Building2 className="h-3 w-3" />
          {t("eyebrow")}
        </p>
        <h1 className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("heroTitle")}
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          {t("heroSubtitle")}
        </p>
      </header>

      {saved && (
        <div className="flex items-center gap-2 rounded-md border border-forest-300 bg-forest-50 px-4 py-3 text-sm text-forest-900">
          <CheckCircle2 className="h-4 w-4 text-forest-700" />
          {t("savedAll")}
        </div>
      )}

      {/* Identité juridique */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Briefcase} title={t("secLegalTitle")} subtitle={t("secLegalSubtitle")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("labelLegalName")} required value={company.legalName} onChange={(v) => updateCompany("legalName", v)} />
            <Field label={t("labelTradeName")} value={company.tradeName} onChange={(v) => updateCompany("tradeName", v)} />
            <Field label={t("labelSiret")} required value={company.siret} onChange={(v) => updateCompany("siret", v)} placeholder="823 456 789 00012" />
            <Field label={t("labelVatNumber")} value={company.vatNumber} onChange={(v) => updateCompany("vatNumber", v)} />
            <Field label={t("labelLegalForm")} value={company.legalForm} onChange={(v) => updateCompany("legalForm", v)} placeholder={t("phLegalForm")} />
            <Field label={t("labelCapital")} value={company.capital} onChange={(v) => updateCompany("capital", v)} placeholder={t("phCapital")} />
            <Field label={t("labelRcs")} value={company.rcs} onChange={(v) => updateCompany("rcs", v)} />
            <Field label={t("labelApe")} value={company.ape} onChange={(v) => updateCompany("ape", v)} placeholder={t("phApe")} />
          </div>
        </CardContent>
      </Card>

      {/* Adresse & contact */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={MapPin} title={t("secAddressTitle")} subtitle={t("secAddressSubtitle")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field className="sm:col-span-3" label={t("labelAddress")} required value={company.addressLine} onChange={(v) => updateCompany("addressLine", v)} />
            <Field label={t("labelPostalCode")} required value={company.postalCode} onChange={(v) => updateCompany("postalCode", v)} />
            <Field className="sm:col-span-2" label={t("labelCity")} required value={company.city} onChange={(v) => updateCompany("city", v)} />
            <Field label={t("labelCountry")} value={company.country} onChange={(v) => updateCompany("country", v)} />
            <Field label={t("labelPhone")} type="tel" value={company.phone} onChange={(v) => updateCompany("phone", v)} icon={Phone} />
            <Field label={t("labelEmail")} type="email" value={company.email} onChange={(v) => updateCompany("email", v)} icon={Mail} />
            <Field className="sm:col-span-3" label={t("labelWebsite")} type="url" value={company.website} onChange={(v) => updateCompany("website", v)} icon={Globe} />
          </div>
        </CardContent>
      </Card>

      {/* Certifications & assurance */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Award} title={t("secRgeTitle")} subtitle={t("secRgeSubtitle")} />
          <div className="space-y-4">
            <Field label={t("labelRgeCert")} value={company.rgeCertifications} onChange={(v) => updateCompany("rgeCertifications", v)} placeholder={t("phRgeCert")} helper={t("helpRgeCert")} />
            <Field label={t("labelInsurance")} value={company.insurance} onChange={(v) => updateCompany("insurance", v)} placeholder={t("phInsurance")} helper={t("helpInsurance")} />
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
              <strong>{t("rgeImportant")}</strong> {t("rgeImportantText")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Building2} title={t("secLogoTitle")} subtitle={t("secLogoSubtitle")} />
          <div className="flex flex-wrap items-start gap-6">
            <div className="grid h-24 w-40 place-items-center overflow-hidden rounded-lg border-2 border-dashed border-cream-400 bg-cream-50">
              {logoFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoFile} alt={t("logoAlt")} className="max-h-full max-w-full object-contain" />
              ) : (
                <p className="text-center text-[11px] text-stone-500">
                  {t("noLogo")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-forest-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-forest-800">
                <Upload className="h-4 w-4" />
                {t("btnImportLogo")}
                <input type="file" accept="image/png,image/svg+xml,image/jpeg" onChange={handleLogoUpload} className="hidden" />
              </label>
              <p className="text-xs text-stone-500">
                {t("logoFormats")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Couleurs */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Palette} title={t("secColorsTitle")} subtitle={t("secColorsSubtitle")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField label={t("labelColorPrimary")} value={branding.primaryColor} onChange={(v) => updateBranding("primaryColor", v)} helper={t("helpColorPrimary")} />
            <ColorField label={t("labelColorAccent")} value={branding.accentColor} onChange={(v) => updateBranding("accentColor", v)} helper={t("helpColorAccent")} />
          </div>
          <div className="mt-4 rounded-lg border border-cream-300 bg-cream-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">{t("previewLabel")}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="rounded-md px-3 py-2 font-serif text-base font-bold text-white" style={{ backgroundColor: branding.primaryColor }}>
                {t("previewReportTitle")}
              </div>
              <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: branding.accentColor }}>
                DPE A
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentions PDF */}
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={FileText} title={t("secPdfTitle")} subtitle={t("secPdfSubtitle")} />
          <div className="space-y-4">
            <Field label={t("labelFooter")} value={branding.footerText} onChange={(v) => updateBranding("footerText", v)} helper={t("helpFooter")} />
            <TextField label={t("labelLegalMentions")} value={branding.legalMentions} onChange={(v) => updateBranding("legalMentions", v)} helper={t("helpLegalMentions")} rows={3} />
            <TextField label={t("labelSignature")} value={branding.reportSignature} onChange={(v) => updateBranding("reportSignature", v)} helper={t("helpSignature")} rows={3} icon={FileSignature} />
          </div>
        </CardContent>
      </Card>

      {/* Save bar sticky */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest-300 bg-white p-3 shadow-lg">
        <p className="text-xs text-stone-600">
          {t("saveBarText")}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-forest-800 disabled:bg-stone-300"
        >
          {saving ? t("btnSaving") : t("btnSave")}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Building2; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="font-serif text-xl font-bold text-forest-900">{title}</h2>
        <p className="text-sm text-stone-600">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, placeholder, helper, icon: Icon, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  icon?: typeof Phone;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="font-semibold text-forest-900">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <div className="relative mt-1">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-md border border-cream-300 ${Icon ? "pl-9" : "pl-3"} pr-3 py-2 text-sm focus:border-forest-500 focus:outline-none`}
        />
      </div>
      {helper && <span className="mt-0.5 block text-[11px] text-stone-500">{helper}</span>}
    </label>
  );
}

function TextField({
  label, value, onChange, helper, rows = 3, icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  helper?: string;
  rows?: number;
  icon?: typeof FileSignature;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-forest-900 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-forest-700" />}
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
      />
      {helper && <span className="mt-0.5 block text-[11px] text-stone-500">{helper}</span>}
    </label>
  );
}

function ColorField({
  label, value, onChange, helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  helper?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-forest-900">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 cursor-pointer rounded-md border border-cream-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 flex-1 rounded-md border border-cream-300 px-3 font-mono text-sm uppercase focus:border-forest-500 focus:outline-none"
        />
      </div>
      {helper && <span className="mt-0.5 block text-[11px] text-stone-500">{helper}</span>}
    </label>
  );
}
