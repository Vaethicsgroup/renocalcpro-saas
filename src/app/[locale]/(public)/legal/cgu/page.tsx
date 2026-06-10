// app/[locale]/(public)/legal/cgu/page.tsx — CGU
import { setRequestLocale, getTranslations } from "next-intl/server";

export const metadata = { title: "Conditions Générales d'Utilisation" };

interface PageProps { params: Promise<{ locale: string }> }

export default async function CguPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal.cgu");

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("title")}</h1>
      <p className="text-sm text-stone-500">{t("lastUpdated")}</p>

      <Section title={t("s1.title")} body={t("s1.body")} />
      <Section title={t("s2.title")} body={t("s2.body")} />
      <Section title={t("s3.title")} body={t("s3.body")} />
      <Section title={t("s4.title")} body={t("s4.body")} />
      <Section title={t("s5.title")} body={t("s5.body")} />
      <Section title={t("s6.title")} body={t("s6.body")} />
      <Section title={t("s7.title")} body={t("s7.body")} />
      <Section title={t("s8.title")} body={t("s8.body")} />
      <Section title={t("s9.title")} body={t("s9.body")} />
      <Section title={t("s10.title")} body={t("s10.body")} />
    </>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{title}</h2>
      <div className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-700">{body}</div>
    </section>
  );
}
