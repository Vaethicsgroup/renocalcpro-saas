// components/seo/JsonLd.tsx — Schema.org JSON-LD pour SEO.

const HOST = process.env.NEXT_PUBLIC_APP_URL ?? "https://renocalcpro.fr";

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Réno·Calc Pro",
    legalName: "VA ETHICS GROUP",
    url: HOST,
    logo: `${HOST}/brand/symbol-teal.svg`,
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@renocalcpro.fr",
      contactType: "customer support",
      availableLanguage: ["French", "English", "Spanish", "German", "Portuguese"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "FR",
    },
    sameAs: [],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Réno·Calc Pro",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    offers: [
      { "@type": "Offer", name: "Découverte (gratuit)",  price: "0",   priceCurrency: "EUR" },
      { "@type": "Offer", name: "Mon projet",            price: "19",  priceCurrency: "EUR" },
      { "@type": "Offer", name: "Solo (Pro)",            price: "49",  priceCurrency: "EUR", priceSpecification: { "@type": "PriceSpecification", price: "49", priceCurrency: "EUR", referenceQuantity: { "@type": "QuantitativeValue", value: "1", unitText: "MONTH" } } },
      { "@type": "Offer", name: "Pro",                   price: "149", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Équipe",                price: "449", priceCurrency: "EUR" },
    ],
    aggregateRating: undefined, // À ajouter quand on a > 50 avis
    description: "Plateforme française d'audits énergétiques et de rapports premium pour particuliers et professionnels du bâtiment. Méthode 3CL-DPE 2021, MaPrimeRénov', CEE, décret tertiaire.",
    featureList: [
      "Calculateur DPE conforme arrêté 31 mars 2021",
      "4 templates de rapports : audit particulier, DPE collectif, audit copropriété, audit tertiaire",
      "Identification automatique des aides MaPrimeRénov' et CEE",
      "Application mobile iOS / Android",
      "API REST publique",
      "Hébergé en France (OVH)",
    ],
    inLanguage: ["fr","en","es","de","pt"],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Réno·Calc Pro",
    url: HOST,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${HOST}/help?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem", position: i + 1,
      name: it.name, item: it.url,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
