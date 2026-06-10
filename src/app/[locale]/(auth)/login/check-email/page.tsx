// app/[locale]/(auth)/login/check-email/page.tsx — Confirmation après envoi.
import { setRequestLocale, getTranslations } from "next-intl/server";

interface PageProps { params: Promise<{ locale: string }> }

export default async function CheckEmail({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-md text-center">
      <div aria-hidden className="text-6xl">✉️</div>
      <h1 className="mt-6 font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        Email envoyé
      </h1>
      <p className="mt-3 text-stone-600">
        {t("magicLinkSentSubtitle")}
      </p>
    </div>
  );
}
