// app/[locale]/(public)/legal/cgv/page.tsx — CGV
import { setRequestLocale, getTranslations } from "next-intl/server";

export const metadata = { title: "Conditions Générales de Vente" };

interface PageProps { params: Promise<{ locale: string }> }

export default async function CgvPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal.cgv");

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("title")}</h1>
      <p className="text-sm text-stone-500">{t("lastUpdated")}</p>

      {(["s1","s2","s3","s4","s5","s6","s7","s8"] as const).map(k => (
        <section key={k} className="mt-8">
          <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t(`${k}.title`)}</h2>
          <div className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-700">{t(`${k}.body`)}</div>
        </section>
      ))}
    </>
  );
}
