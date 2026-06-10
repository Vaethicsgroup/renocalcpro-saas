// app/[locale]/(public)/legal/cookies/page.tsx — Politique cookies (minimaliste)
import { setRequestLocale, getTranslations } from "next-intl/server";

export const metadata = { title: "Politique de cookies" };

interface PageProps { params: Promise<{ locale: string }> }

export default async function CookiesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal.cookies");

  return (
    <>
      <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("title")}</h1>
      <p className="text-sm text-stone-500">{t("lastUpdated")}</p>

      <Section title={t("s1.title")} body={t("s1.body")} />
      <Section title={t("s2.title")} body={t("s2.body")} />

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("table.title")}</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-3 font-semibold text-stone-700">{t("table.col1")}</th>
                <th className="p-3 font-semibold text-stone-700">{t("table.col2")}</th>
                <th className="p-3 font-semibold text-stone-700">{t("table.col3")}</th>
                <th className="p-3 font-semibold text-stone-700">{t("table.col4")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr>
                <td className="p-3 font-mono text-xs">__Secure-authjs.session-token</td>
                <td className="p-3">{t("table.row1Purpose")}</td>
                <td className="p-3">{t("table.row1Type")}</td>
                <td className="p-3">15 min</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-xs">__Host-authjs.csrf-token</td>
                <td className="p-3">{t("table.row2Purpose")}</td>
                <td className="p-3">{t("table.row2Type")}</td>
                <td className="p-3">{t("table.session")}</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-xs">NEXT_LOCALE</td>
                <td className="p-3">{t("table.row3Purpose")}</td>
                <td className="p-3">{t("table.row3Type")}</td>
                <td className="p-3">1 {t("table.year")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <Section title={t("s3.title")} body={t("s3.body")} />
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
