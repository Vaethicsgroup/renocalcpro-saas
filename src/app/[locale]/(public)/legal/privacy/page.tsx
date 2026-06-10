// app/[locale]/(public)/legal/privacy/page.tsx — Politique de confidentialité RGPD
import { setRequestLocale, getTranslations } from "next-intl/server";

export const metadata = { title: "Politique de confidentialité" };

interface PageProps { params: Promise<{ locale: string }> }

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal.privacy");

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("title")}</h1>
      <p className="text-sm text-stone-500">{t("lastUpdated")}</p>

      {(["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12"] as const).map(k => (
        <section key={k} className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t(`${k}.title`)}</h2>
          <div className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-700">{t(`${k}.body`)}</div>
        </section>
      ))}
    </>
  );
}
