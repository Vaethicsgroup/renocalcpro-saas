// app/[locale]/(public)/legal/mentions/page.tsx — Mentions légales (FR obligation légale)
import { setRequestLocale, getTranslations } from "next-intl/server";

interface PageProps { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legalMentions" });
  return { title: t("metaTitle") };
}

export default async function MentionsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legalMentions" });

  // Note : mentions légales sont une obligation française → contenu juridique FR uniquement.
  // Titre, métadonnées et structure traduits ; corps juridique reste FR.
  const isNotFr = locale !== "fr";

  return (
    <>
      {isNotFr && (
        <div role="note" className="mb-6 rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4 text-sm text-teal-900">
          {t("frOnlyNotice")}
        </div>
      )}
      <h1 className="font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("title")}</h1>
      <p className="text-sm text-stone-500">{t("updatedOn")}</p>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("secEditor")}</h2>
        <p className="mt-3 text-sm leading-7 text-stone-700" lang="fr">
          <strong>Réno·Calc Pro</strong> — service édité par <strong>VA ETHICS GROUP</strong><br />
          Forme juridique : à compléter<br />
          Capital social : à compléter<br />
          Siège social : à compléter<br />
          SIRET : à compléter<br />
          Numéro de TVA intracommunautaire : à compléter<br />
          Email : <a href="mailto:contact@renocalcpro.fr" className="text-teal-700 underline">contact@renocalcpro.fr</a>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("secDirector")}</h2>
        <p className="mt-3 text-sm leading-7 text-stone-700" lang="fr">Flora VINCIA — joignable via <a href="mailto:contact@renocalcpro.fr" className="text-teal-700 underline">contact@renocalcpro.fr</a></p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("secHosting")}</h2>
        <p className="mt-3 text-sm leading-7 text-stone-700" lang="fr">
          Site hébergé par <strong>OVH SAS</strong><br />
          2 rue Kellermann, 59100 Roubaix, France<br />
          Téléphone : 1007<br />
          Site : <a href="https://www.ovhcloud.com/fr/" className="text-teal-700 underline">https://www.ovhcloud.com/fr/</a>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("secIp")}</h2>
        <p className="mt-3 text-sm leading-7 text-stone-700" lang="fr">
          L&apos;ensemble du contenu de ce site (textes, images, logos, code source, base de données, design) est protégé
          par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction,
          représentation, modification, publication, adaptation totale ou partielle des éléments du site, quel que soit
          le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de Réno·Calc Pro.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("secRgpd")}</h2>
        <p className="mt-3 text-sm leading-7 text-stone-700" lang="fr">
          RGPD / DPO : <a href="mailto:rgpd@renocalcpro.fr" className="text-teal-700 underline">rgpd@renocalcpro.fr</a><br />
          Vulnérabilité de sécurité : <a href="mailto:security@renocalcpro.fr" className="text-teal-700 underline">security@renocalcpro.fr</a>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>{t("secMediation")}</h2>
        <p className="mt-3 text-sm leading-7 text-stone-700" lang="fr">
          Conformément à l&apos;article L. 612-1 du Code de la consommation, le consommateur a la possibilité de recourir
          gratuitement au service de médiation suivant : <em>à compléter avec le médiateur retenu</em>.
        </p>
      </section>
    </>
  );
}
