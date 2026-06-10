// app/[locale]/o/settings/page.tsx — Paramètres pro v2
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Plug,
  Shield,
  Palette,
  Download,
  Trash2,
  Mail,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Key,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

type SectionKey =
  | "account"
  | "security"
  | "notifications"
  | "integrations"
  | "appearance"
  | "data_privacy";

const SECTIONS: ReadonlyArray<{
  key: SectionKey;
  labelKey: string;
  icon: typeof User;
  descKey: string;
}> = [
  { key: "account", labelKey: "secAccount", icon: User, descKey: "secAccountDesc" },
  { key: "security", labelKey: "secSecurity", icon: Lock, descKey: "secSecurityDesc" },
  { key: "notifications", labelKey: "secNotifications", icon: Bell, descKey: "secNotificationsDesc" },
  { key: "integrations", labelKey: "secIntegrations", icon: Plug, descKey: "secIntegrationsDesc" },
  { key: "appearance", labelKey: "secAppearance", icon: Palette, descKey: "secAppearanceDesc" },
  { key: "data_privacy", labelKey: "secDataPrivacy", icon: Shield, descKey: "secDataPrivacyDesc" },
];

export default function SettingsPage() {
  const t = useTranslations("oSettings");
  const [active, setActive] = useState<SectionKey>("account");

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-50 via-white to-forest-50 p-5 shadow-sm sm:p-6">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
          <SettingsIcon className="h-3 w-3" />
          {t("eyebrow")}
        </p>
        <h1
          className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("heroTitle")}
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          {t("heroSubtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardContent className="p-2">
            <nav>
              <ul className="space-y-0.5">
                {SECTIONS.map((s) => {
                  const Icon = s.icon;
                  const isActive = active === s.key;
                  return (
                    <li key={s.key}>
                      <button
                        type="button"
                        onClick={() => setActive(s.key)}
                        aria-current={isActive ? "page" : undefined}
                        className={[
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          isActive
                            ? "bg-forest-50 text-forest-900"
                            : "text-stone-700 hover:bg-cream-50",
                        ].join(" ")}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                            isActive ? "bg-forest-700 text-white" : "bg-cream-100 text-stone-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-sm font-semibold ${isActive ? "text-forest-900" : ""}`}>
                            {t(s.labelKey)}
                          </span>
                          <span className="block truncate text-[11px] text-stone-500">
                            {t(s.descKey)}
                          </span>
                        </span>
                        <ChevronRight className={`ml-auto h-3 w-3 shrink-0 ${isActive ? "text-forest-700" : "text-stone-400"}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {active === "account" && <AccountSection />}
          {active === "security" && <SecuritySection />}
          {active === "notifications" && <NotificationsSection />}
          {active === "integrations" && <IntegrationsSection />}
          {active === "appearance" && <AppearanceSection />}
          {active === "data_privacy" && <DataPrivacySection />}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof User; title: string; subtitle: string }) {
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

function AccountSection() {
  const t = useTranslations("oSettings");
  const [firstName, setFirstName] = useState("Jean");
  const [lastName, setLastName] = useState("Dupont");
  const [email, setEmail] = useState("jean.dupont@cabinet-dupont.fr");
  const [phone, setPhone] = useState("06 12 34 56 78");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card>
      <CardContent className="p-5">
        <SectionTitle icon={User} title={t("accountTitle")} subtitle={t("accountSubtitle")} />
        {saved && (
          <div className="mb-3 flex items-center gap-2 rounded-md bg-forest-50 px-3 py-2 text-sm text-forest-900">
            <CheckCircle2 className="h-4 w-4 text-forest-700" />
            {t("savedMessage")}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("labelFirstName")} value={firstName} onChange={setFirstName} />
          <Field label={t("labelLastName")} value={lastName} onChange={setLastName} />
          <Field label={t("labelEmail")} type="email" value={email} onChange={setEmail} />
          <Field label={t("labelPhone")} type="tel" value={phone} onChange={setPhone} />
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold text-forest-900">{t("passwordTitle")}</p>
          <button type="button" className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-md border border-cream-300 bg-white px-3 text-xs font-semibold text-forest-700 hover:bg-cream-50">
            <Key className="h-3 w-3" />
            {t("btnChangePassword")}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-end border-t border-cream-200 pt-4">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-forest-700 px-4 text-xs font-semibold text-white shadow-sm hover:bg-forest-800 disabled:bg-stone-300"
          >
            {saving ? t("btnSaving") : t("btnSave")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const t = useTranslations("oSettings");
  const [twoFA, setTwoFA] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = "rcp_live_sk_••••••••••••••••••••••3a7f";

  const copy = () => {
    navigator.clipboard.writeText("rcp_live_sk_abc123_jamais_montre_3a7f");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Lock} title={t("securityTitle")} subtitle={t("securitySubtitle")} />
          <label className="flex items-start gap-3 rounded-lg border border-cream-200 bg-white p-3">
            <input
              type="checkbox"
              checked={twoFA}
              onChange={(e) => setTwoFA(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-forest-600"
            />
            <span>
              <span className="block text-sm font-semibold text-forest-900">{t("twoFaLabel")}</span>
              <span className="text-xs text-stone-600">{t("twoFaDesc")}</span>
            </span>
          </label>
          {twoFA && (
            <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
              {t("twoFaWarn")}
              <button type="button" className="ml-2 rounded bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-700">
                {t("twoFaConfigure")}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Activity} title={t("sessionsTitle")} subtitle={t("sessionsSubtitle")} />
          <ul className="space-y-2">
            {[
              { deviceKey: "deviceMacBook", locationKey: "locationParis", lastActiveKey: "lastNow", current: true },
              { deviceKey: "deviceIPhone", locationKey: "locationParis", lastActiveKey: "lastTwoHours", current: false },
            ].map((s) => (
              <li key={s.deviceKey} className="flex items-center justify-between rounded-lg border border-cream-200 bg-white p-3">
                <div>
                  <p className="text-sm font-semibold text-forest-900">
                    {t(s.deviceKey)}
                    {s.current && (
                      <span className="ml-2 rounded-full bg-forest-100 px-1.5 py-0.5 text-[10px] font-bold text-forest-800">{t("currentSession")}</span>
                    )}
                  </p>
                  <p className="text-xs text-stone-500">{t(s.locationKey)} · {t(s.lastActiveKey)}</p>
                </div>
                {!s.current && (
                  <button type="button" className="rounded-md border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50">
                    {t("btnDisconnect")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Key} title={t("apiKeyTitle")} subtitle={t("apiKeySubtitle")} />
          <div className="flex items-center gap-2 rounded-md border border-cream-200 bg-cream-50 p-2">
            <code className="flex-1 truncate font-mono text-xs text-stone-700">
              {showKey ? "rcp_live_sk_abc123_jamais_montre_3a7f" : apiKey}
            </code>
            <button type="button" onClick={() => setShowKey(!showKey)} className="rounded-md border border-cream-300 bg-white p-1.5 text-stone-600 hover:bg-cream-100" aria-label={t("ariaShowHide")}>
              {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-md border border-forest-300 bg-white px-2 py-1 text-[11px] font-semibold text-forest-700 hover:bg-forest-50">
              <Copy className="h-3 w-3" />
              {copied ? t("btnCopied") : t("btnCopy")}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            {t("apiKeyWarn")}
          </p>
          <button type="button" className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50">
            {t("btnRegenKey")}
          </button>
        </CardContent>
      </Card>
    </>
  );
}

function NotificationsSection() {
  const t = useTranslations("oSettings");
  const [emailPrefs, setEmailPrefs] = useState({ new_project: true, client_view: true, client_signed: true, weekly_digest: false, product_news: false });
  const [smsPrefs, setSmsPrefs] = useState({ urgent_only: true, aids_status: false });
  const [inappPrefs, setInappPrefs] = useState({ all: true, soundEnabled: true });

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Mail} title={t("notifEmailTitle")} subtitle={t("notifEmailSubtitle")} />
          <ToggleRow label={t("notifNewProject")} description={t("notifNewProjectDesc")} checked={emailPrefs.new_project} onChange={(v) => setEmailPrefs((p) => ({ ...p, new_project: v }))} />
          <ToggleRow label={t("notifClientView")} description={t("notifClientViewDesc")} checked={emailPrefs.client_view} onChange={(v) => setEmailPrefs((p) => ({ ...p, client_view: v }))} />
          <ToggleRow label={t("notifClientSigned")} description={t("notifClientSignedDesc")} checked={emailPrefs.client_signed} onChange={(v) => setEmailPrefs((p) => ({ ...p, client_signed: v }))} />
          <ToggleRow label={t("notifWeekly")} description={t("notifWeeklyDesc")} checked={emailPrefs.weekly_digest} onChange={(v) => setEmailPrefs((p) => ({ ...p, weekly_digest: v }))} />
          <ToggleRow label={t("notifProductNews")} description={t("notifProductNewsDesc")} checked={emailPrefs.product_news} onChange={(v) => setEmailPrefs((p) => ({ ...p, product_news: v }))} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Smartphone} title={t("notifSmsTitle")} subtitle={t("notifSmsSubtitle")} />
          <ToggleRow label={t("notifUrgentOnly")} description={t("notifUrgentOnlyDesc")} checked={smsPrefs.urgent_only} onChange={(v) => setSmsPrefs((p) => ({ ...p, urgent_only: v }))} />
          <ToggleRow label={t("notifAidsStatus")} description={t("notifAidsStatusDesc")} checked={smsPrefs.aids_status} onChange={(v) => setSmsPrefs((p) => ({ ...p, aids_status: v }))} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Bell} title={t("notifInappTitle")} subtitle={t("notifInappSubtitle")} />
          <ToggleRow label={t("notifAll")} description={t("notifAllDesc")} checked={inappPrefs.all} onChange={(v) => setInappPrefs((p) => ({ ...p, all: v }))} />
          <ToggleRow label={t("notifSound")} description={t("notifSoundDesc")} checked={inappPrefs.soundEnabled} onChange={(v) => setInappPrefs((p) => ({ ...p, soundEnabled: v }))} />
        </CardContent>
      </Card>
    </>
  );
}

function IntegrationsSection() {
  const t = useTranslations("oSettings");
  return (
    <Card>
      <CardContent className="p-5">
        <SectionTitle icon={Plug} title={t("intgTitle")} subtitle={t("intgSubtitle")} />
        <ul className="space-y-3">
          {[
            { name: "Stripe", descKey: "intgStripeDesc", statusKey: "intgStatusConnected", color: "bg-forest-100 text-forest-800" },
            { name: "Resend", descKey: "intgResendDesc", statusKey: "intgStatusConnected", color: "bg-forest-100 text-forest-800" },
            { name: "Twilio", descKey: "intgTwilioDesc", statusKey: "intgStatusNotConfigured", color: "bg-stone-100 text-stone-700" },
            { name: "Brevo (Sendinblue)", descKey: "intgBrevoDesc", statusKey: "intgStatusNotConfigured", color: "bg-stone-100 text-stone-700" },
            { name: "API GraphQL", descKey: "intgGraphqlDesc", statusKey: "intgStatusActive", color: "bg-info-100 text-info-800" },
            { name: "Webhooks", descKey: "intgWebhooksDesc", statusKey: "intgStatusTwoWebhooks", color: "bg-forest-100 text-forest-800" },
            { name: "Zapier", descKey: "intgZapierDesc", statusKey: "intgStatusSoon", color: "bg-amber-100 text-amber-800" },
          ].map((i) => (
            <li key={i.name} className="flex items-center justify-between rounded-lg border border-cream-200 bg-white p-3">
              <div className="min-w-0">
                <p className="font-semibold text-forest-900">{i.name}</p>
                <p className="text-xs text-stone-600">{t(i.descKey)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${i.color}`}>{t(i.statusKey)}</span>
                <button type="button" className="rounded-md border border-cream-300 bg-white px-2 py-1 text-[11px] font-semibold text-forest-700 hover:bg-forest-50">
                  {t("btnConfigure")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AppearanceSection() {
  const t = useTranslations("oSettings");
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
  const [language, setLanguage] = useState("fr");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  return (
    <Card>
      <CardContent className="p-5">
        <SectionTitle icon={Palette} title={t("appearanceTitle")} subtitle={t("appearanceSubtitle")} />
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-forest-900">{t("themeTitle")}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([{ v: "light" as const, labelKey: "themeLight", Icon: Sun }, { v: "dark" as const, labelKey: "themeDark", Icon: Moon }, { v: "auto" as const, labelKey: "themeAuto", Icon: SettingsIcon }]).map(({ v, labelKey, Icon }) => {
                const active = theme === v;
                return (
                  <button key={v} type="button" onClick={() => setTheme(v)} className={["flex items-center justify-center gap-1.5 rounded-lg border-2 p-3 text-sm font-semibold transition-colors", active ? "border-forest-500 bg-forest-50 text-forest-900" : "border-cream-300 bg-white text-stone-700 hover:border-forest-200"].join(" ")}>
                    <Icon className="h-4 w-4" />
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={t("selectLanguage")} value={language} onChange={setLanguage} options={[{ value: "fr", label: "Français" }, { value: "en", label: "English" }, { value: "es", label: "Español" }, { value: "de", label: "Deutsch" }, { value: "pt", label: "Português" }]} icon={Globe} />
            <Select label={t("selectTimezone")} value={timezone} onChange={setTimezone} options={[{ value: "Europe/Paris", label: t("tzParis") }, { value: "Europe/London", label: t("tzLondon") }, { value: "America/New_York", label: t("tzNewYork") }]} />
            <Select label={t("selectDateFormat")} value={dateFormat} onChange={setDateFormat} options={[{ value: "DD/MM/YYYY", label: "31/12/2026" }, { value: "YYYY-MM-DD", label: "2026-12-31" }, { value: "MM/DD/YYYY", label: "12/31/2026" }]} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataPrivacySection() {
  const t = useTranslations("oSettings");
  return (
    <>
      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Download} title={t("dataExportTitle")} subtitle={t("dataExportSubtitle")} />
          <p className="text-sm text-stone-700">
            {t("dataExportText")}
          </p>
          <button type="button" className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-md bg-forest-600 px-3 text-sm font-semibold text-white hover:bg-forest-800">
            <Download className="h-4 w-4" />
            {t("btnRequestExport")}
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <SectionTitle icon={Shield} title={t("dataRetentionTitle")} subtitle={t("dataRetentionSubtitle")} />
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />{t("dataR1")}</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />{t("dataR2")}</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />{t("dataR3")}</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />{t("dataR4")}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="rounded-lg border border-red-200 bg-red-50/40 p-4">
            <SectionTitle icon={Trash2} title={t("dataDeleteTitle")} subtitle={t("dataDeleteSubtitle")} />
            <p className="text-sm text-stone-700">
              {t("dataDeleteText")}
            </p>
            <button type="button" className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 text-sm font-semibold text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              {t("btnDeleteAccount")}
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-forest-900">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-cream-300 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none" />
    </label>
  );
}

function Select({ label, value, onChange, options, icon: Icon }: { label: string; value: string; onChange: (v: string) => void; options: ReadonlyArray<{ value: string; label: string }>; icon?: typeof Globe }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-forest-900">{label}</span>
      <div className="relative mt-1">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />}
        <select value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-md border border-cream-300 ${Icon ? "pl-9" : "pl-3"} pr-3 py-2 text-sm focus:border-forest-500 focus:outline-none`}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </label>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 border-b border-cream-100 py-3 last:border-b-0">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-forest-600" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-forest-900">{label}</span>
        <span className="block text-xs text-stone-600">{description}</span>
      </span>
    </label>
  );
}
