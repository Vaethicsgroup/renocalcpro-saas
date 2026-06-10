// app/[locale]/admin/settings/page.tsx — Paramètres système admin
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { getTranslations } from "next-intl/server";

interface Props { params: Promise<{ locale: string }> }

export default async function SettingsAdminPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminSettings" });
  const flags = [
    { key: "WEBHOOKS_EMIT",     labelKey: "flagWebhooks",   active: true,  cohort: "100 %" },
    { key: "MATERIAL_VISION",   labelKey: "flagMatVision",  active: true,  cohort: "100 %" },
    { key: "ASSISTANT_AI",      labelKey: "flagAssistant",  active: true,  cohort: "100 %" },
    { key: "ASSISTANT_PLUGINS", labelKey: "flagPlugins",    active: false, cohort: "0 %" },
    { key: "VOICE_INPUT",       labelKey: "flagVoice",      active: true,  cohort: "100 %" },
  ];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold text-stone-900 md:text-4xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>{t("title")}</h1>
        <p className="mt-1 text-sm text-stone-600">{t("subtitle")}</p>
      </header>

      <Card>
        <CardHeader><CardTitle>{t("secFlagsTitle")}</CardTitle><CardDescription>{t("secFlagsDesc")}</CardDescription></CardHeader>
        <CardContent>
          <ul className="divide-y divide-stone-100">
            {flags.map(f => (
              <li key={f.key} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-mono text-xs text-stone-500">{f.key}</p>
                  <p className="font-semibold">{t(f.labelKey)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-600">{t("cohortLabel")} {f.cohort}</span>
                  <StatusBadge status={f.active ? "success" : "neutral"} size="sm">{f.active ? t("statusEnabled") : t("statusDisabled")}</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">{t("flagFineGrained")} <Link href={`/${locale}/admin/feature-flags`} className="text-teal-700 hover:underline">/admin/feature-flags</Link></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("secRateTitle")}</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>{t("rateApi")}</span><span className="font-mono">100 req/min/IP</span></li>
            <li className="flex justify-between"><span>{t("rateAuth")}</span><span className="font-mono">10 req/min/IP</span></li>
            <li className="flex justify-between"><span>{t("rateAssistant")}</span><span className="font-mono">20 000 tokens / conv</span></li>
            <li className="flex justify-between"><span>{t("rateWebhooks")}</span><span className="font-mono">50 req/sec global</span></li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("secMaintTitle")}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{t("maintCurrent")}</p>
              <p className="text-xs text-stone-500">{t("maintDesc")}</p>
            </div>
            <StatusBadge status="success">{t("maintNominal")}</StatusBadge>
          </div>
          <Button variant="destructive" size="md" className="mt-4">{t("maintActivate")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
