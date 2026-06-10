// app/[locale]/p/account/page.tsx — Mon compte particulier i18n
import { getTranslations } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Input";
import { AvatarUploader } from "@/components/forms/AvatarUploader";
import Link from "next/link";

interface Props { params: Promise<{ locale: string }> }

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pAccount" });
  // MVP : user mocké
  const user = {
    firstName: "Claire",
    lastName: "D.",
    email: "claire@example.fr",
    locale: "fr",
    notifications: { weekly: true, marketing: false, alerts: true },
    plan: "Solo (essai 14j)",
    nextBilling: "22 mai 2026",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 p-6 shadow-card md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-forest-100 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-forest-700">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
          {t("eyebrow")}
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-forest-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("title")}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-forest-900/70">{t("subtitle")}</p>
      </header>

      {/* Profil */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profileTitle")}</CardTitle>
          <CardDescription>{t("profileSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <AvatarUploader
              storageKey="user-avatar"
              size={104}
              initials={`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}
            />
            <form className="grid flex-1 gap-5 sm:grid-cols-2">
              <FormField label={t("firstNameLabel")} htmlFor="firstName"><Input id="firstName" defaultValue={user.firstName} /></FormField>
              <FormField label={t("lastNameLabel")} htmlFor="lastName"><Input id="lastName" defaultValue={user.lastName} /></FormField>
              <FormField label={t("emailLabel")} htmlFor="email" className="sm:col-span-2" helper={t("emailHelp")}>
                <Input id="email" type="email" defaultValue={user.email} />
              </FormField>
              <div className="sm:col-span-2">
                <Button variant="primary" size="md">{t("saveProfile")}</Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Préférences */}
      <Card>
        <CardHeader>
          <CardTitle>{t("prefsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <FormField label={t("langLabel")} htmlFor="lang">
              <Select id="lang" defaultValue={user.locale}>
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="pt">🇵🇹 Português</option>
              </Select>
            </FormField>

            <fieldset>
              <legend className="text-sm font-medium text-stone-900">{t("notifLegend")}</legend>
              <div className="mt-3 space-y-2">
                {[
                  { id: "weekly", label: t("prefWeeklyRecap"), checked: user.notifications.weekly },
                  { id: "alerts", label: t("prefImportantAlerts"), checked: user.notifications.alerts },
                  { id: "marketing", label: t("prefProductNews"), checked: user.notifications.marketing },
                ].map(n => (
                  <label key={n.id} className="flex items-center gap-3 text-sm">
                    <input type="checkbox" defaultChecked={n.checked} className="h-4 w-4 rounded border-stone-300 text-teal-600" />
                    <span>{n.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>{t("secTitle")}</CardTitle>
          <CardDescription>{t("secDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-semibold text-stone-900">{t("magicAuthTitle")}</p>
              <p className="text-stone-600">{t("activatedFor")} <span className="font-mono text-xs">{user.email}</span></p>
            </div>
            <Button variant="secondary" size="md">{t("btn2fa")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Facturation */}
      <Card>
        <CardHeader>
          <CardTitle>{t("subTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-stone-900">{t("currentPlan")}</p>
              <p className="font-serif text-lg font-bold text-teal-800">{user.plan}</p>
            </div>
            <p className="mt-1 text-xs text-stone-600">{t("nextBilling")} {user.nextBilling}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/${locale}/tarifs`}><Button variant="primary" size="md">{t("btnCompare")}</Button></Link>
            <Button variant="secondary" size="md">{t("btnViewInvoices")}</Button>
            <Button variant="ghost" size="md">{t("btnCancelSub")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* RGPD */}
      <Card>
        <CardHeader>
          <CardTitle>{t("rgpdTitle")}</CardTitle>
          <CardDescription>{t("rgpdDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm">
                  <p className="font-semibold text-stone-900">{t("exportTitle")}</p>
                  <p className="text-stone-600">{t("exportDesc")}</p>
                </div>
                <Button variant="secondary" size="md">{t("btnExport")}</Button>
              </div>
            </div>
            <div className="rounded-lg border border-error-200 bg-error-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm">
                  <p className="font-semibold text-error-900">{t("deleteTitle")}</p>
                  <p className="text-error-700">{t("deleteDesc")}</p>
                </div>
                <Button variant="destructive" size="md">{t("btnDelete")}</Button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-stone-500">
            {t("dpoQuestion")} <a href="mailto:dpo@renocalcpro.fr" className="font-semibold text-teal-700 hover:underline">dpo@renocalcpro.fr</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
