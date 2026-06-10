// app/[locale]/(public)/changelog/page.tsx
// Page publique des nouveautés visibles utilisateur (release notes marketing).
// Multilingue via next-intl (fallback FR si message manquant).

import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://renocalcpro.fr";

interface Props { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Nouveautés — Réno·Calc Pro",
    description: "Toutes les évolutions récentes de la plateforme : nouvelles fonctionnalités, améliorations UX, corrections.",
    alternates: {
      canonical: `${SITE_URL}/${locale}/changelog`,
      languages: {
        "fr-FR": `${SITE_URL}/fr/changelog`,
        en: `${SITE_URL}/en/changelog`,
        es: `${SITE_URL}/es/changelog`,
        de: `${SITE_URL}/de/changelog`,
        pt: `${SITE_URL}/pt/changelog`,
      },
    },
  };
}

interface ReleaseNote {
  date: string;
  version: string;
  highlights: string[];
  features: { icon: string; title: string; description: string }[];
}

const RELEASES: ReleaseNote[] = [
  {
    date: "2026-06-05",
    version: "Juin 2026 — v2.6",
    highlights: [
      "🔍 Mode expert : composez votre scénario avec choix matériaux/systèmes (λ, R, COP, € détaillés)",
      "♿ Aides autonomie / handicap : MaPrimeAdapt', PCH, APA, Action Logement intégrées",
      "🏢 Dashboard pro : coordonnées client + statut propriété (SCI, indivision, copro) avec éligibilité aides automatique",
      "📋 11 sous-types projet : appartement, immeuble, copro, bureau, commerce, ERP, bâtiment public, etc. — formulaire adaptatif",
      "📊 Comparaison Avant → Après visualisée + ROI horizon 5/10/15/20 ans avec inflation énergie",
    ],
    features: [
      {
        icon: "🎯",
        title: "Mode Expert (abonnement Pro Particulier / Pro Artisan)",
        description:
          "Choisissez vos matériaux poste par poste — 12 isolants documentés (λ, ρ, Cp, déphasage, biosourcé) — comparez 14 systèmes chauffage (COP/η, € install, € kWh utile, durée vie, CO₂) — 5 ECS + 7 ventilations. Adapté à votre cible (maison, copro, HLM, tertiaire).",
      },
      {
        icon: "💰",
        title: "Catalogue aides détaillé 2025",
        description:
          "20+ aides FR cataloguées : MaPrimeRénov' forfaits par geste & bandes Bleu/Jaune/Violet/Rose, MPR Parcours Accompagné, MPR Copropriété, CEE Coup de Pouce, Éco-PTZ, TVA 5,5 %, Éco-PLS HLM, Décret tertiaire. Résolution automatique des exclusivités + écrêtement par coût de poste.",
      },
      {
        icon: "♿",
        title: "Aides autonomie & handicap",
        description:
          "7 dispositifs intégrés : MaPrimeAdapt' (Anah, 50-70 %), PCH logement (MDPH), APA domicile, Action Logement (5000 €), caisses de retraite, TVA 5,5 % adaptation, CI autonomie. Éligibilité auto selon âge, GIR, taux handicap.",
      },
      {
        icon: "👤",
        title: "Coordonnées client structurées (Pro)",
        description:
          "Prénom / nom / email / téléphone + adresse complète du bien diagnostiqué. Champs validés et persistés via mutation GraphQL updateProject.",
      },
      {
        icon: "🏛",
        title: "11 statuts de propriété avec éligibilité automatique",
        description:
          "Propriétaire occupant, bailleur, locataire, SCI familiale (IR) vs patrimoniale (IS), indivision, usufruitier/nu-propriétaire, syndic copro, bailleur social HLM, personne morale. Carte d'éligibilité aux 7 aides recalculée en temps réel + étapes administratives spécifiques.",
      },
      {
        icon: "📋",
        title: "11 sous-types projet — formulaire adaptatif",
        description:
          "Habitation (maison ind./pavillon/maison de ville), Collectif (appartement/immeuble/copro), Tertiaire (bureau/commerce/ERP/bâtiment public/local d'activité). Le formulaire affiche/masque automatiquement les sections selon le sous-type : pas d'ECS pour un bureau, vitrines/chaîne froid pour un commerce, lots+PPT pour une copro.",
      },
      {
        icon: "🔬",
        title: "Workflow d'audit professionnel",
        description:
          "Check-list 20 documents groupés par catégorie (Propriété, Fiscal, Énergie, Technique, Travaux, Réglementaire) avec conditionnels (amiante < 1997, plomb < 1949). Niveau de confiance A-D calculé sur 9 critères pondérés. 7 étapes du process : démarrage → collecte → visite → modélisation → scénarios → restitution → accompagnement.",
      },
      {
        icon: "📈",
        title: "ROI horizon 5/10/15/20 ans",
        description:
          "Saisie de vos factures réelles (élec / gaz / fioul / bois / RCU) avec calcul d'économies sur consommations réelles. Projection ROI avec inflation énergie 4 %/an : payback exact, économies cumulées, bilan net à 5/10/15/20 ans.",
      },
      {
        icon: "🔀",
        title: "Comparaison Avant → Après visualisée",
        description:
          "Carte unifiée avec étiquettes DPE et GES côte à côte (avant → après + badge +N classes), 4 KPIs avec delta visuel (consommation, Cep, facture €, émissions CO₂). Format scan rapide pour client final.",
      },
      {
        icon: "🛒",
        title: "Liste travaux recommandés par scénario",
        description:
          "Pour chaque scénario préréglé activé (Isolation seule / Chauffage seul / Rénovation globale), liste détaillée des travaux avec icônes thématiques, coût estimatif par poste et total HT. Lecture immédiate avant calcul.",
      },
      {
        icon: "🔌",
        title: "GraphQL API étendu",
        description:
          "Nouveau type Project avec relations ProjectClient, ProjectOwnership (avec eligibilities booleans), ProjectAutonomy, ProjectTypeSpecifics. Mutation updateProject pour modifier un dossier existant. Anciens champs préservés (rétrocompatible).",
      },
    ],
  },
  {
    date: "2026-05-10",
    version: "Mai 2026",
    highlights: [
      "🌍 Interface 100 % traduite en FR / EN / ES / DE / PT",
      "📚 Bibliothèque de 80 matériaux du bâti initial + 20 systèmes documentés",
      "🤖 Identification de matériau par photo (IA Claude Vision)",
    ],
    features: [
      { icon: "🧱", title: "Bibliothèque matériaux du bâti initial",
        description: "80 entrées en 5 catégories (murs, planchers, menuiseries, finitions) avec niveau de confiance, comportement hygrothermique et alertes d'incompatibilités." },
      { icon: "🌡", title: "Score de confort été et hiver",
        description: "Note 1-5 avec causes principales d'inconfort et améliorations recommandées par ordre d'impact." },
      { icon: "📐", title: "Aide à la mesure interactive",
        description: "6 schémas SVG interactifs pour mesurer correctement surfaces, hauteurs, fenêtres, toitures inclinées." },
      { icon: "🔍", title: "Détection isolation cachée — 4 méthodes",
        description: "Guide pédagogique : observation tableau, sondage acoustique, caméra thermique, thermo-hygromètre." },
      { icon: "⚠️", title: "Vérification compatibilité hygrothermique",
        description: "Alerte automatique sur les associations à risque (pierre + ciment, pisé + RPE, etc.) avec recommandations alternatives." },
      { icon: "📷", title: "Identification de matériau par photo (mobile)",
        description: "Capture une photo, recevez 3 suggestions IA avec confiance et justification. Mode hors-ligne supporté." },
      { icon: "📊", title: "Score qualité du dossier (grade A/B/C/D)",
        description: "Mesure la fiabilité globale de l'audit en pondérant chaque champ par sa source (observé, estimé, supposé, inconnu)." },
      { icon: "🔐", title: "API REST publique v1 (14 endpoints)",
        description: "Intégrez Réno·Calc Pro à vos workflows : dossiers, rapports, identification IA, statut overrides catalogue." },
      { icon: "📨", title: "Webhooks sortants HMAC-SHA256",
        description: "14 évènements (projets, rapports, paiements, IA, catalogue) avec retry exponentiel et signature cryptographique." },
    ],
  },
  {
    date: "2026-05-09",
    version: "Avril-Mai 2026",
    highlights: [
      "📚 41 articles d'aide en français + 11 traduits en anglais",
      "🎭 Mode impersonification admin auditée pour le support",
      "💳 Portail Stripe intégré + 5 plans d'abonnement",
    ],
    features: [
      { icon: "📚", title: "Centre d'aide 44 articles",
        description: "Guide complet : premiers pas, calculateur, rapports PDF, aides MaPrimeRénov', facturation, équipe, API." },
      { icon: "🎭", title: "Mode impersonification admin",
        description: "Notre équipe support peut accéder temporairement à votre compte (avec votre accord) pour diagnostiquer un problème. Toutes les actions sont auditées." },
      { icon: "💳", title: "Portail Stripe intégré",
        description: "Gérez votre abonnement, méthode de paiement, factures et changement de plan en un clic depuis votre espace." },
      { icon: "🔒", title: "Cloudflare Turnstile anti-bot",
        description: "Protection respectueuse de la vie privée (sans CAPTCHA) sur les formulaires sensibles." },
      { icon: "🧪", title: "Email preview gallery interne",
        description: "Pour notre équipe : visualisation et test de tous nos templates email avant envoi en production." },
    ],
  },
  {
    date: "2026-04-15",
    version: "Avril 2026",
    highlights: [
      "📊 Dashboards séparés Particulier / Pro",
      "📱 Application mobile React Native (preview)",
      "🚀 PWA installable",
    ],
    features: [
      { icon: "🏠", title: "Dashboard Particulier",
        description: "Vue simplifiée pour les propriétaires : MaPrimeRénov', mes dossiers, mes devis." },
      { icon: "💼", title: "Dashboard Pro",
        description: "Vue cabinet : portfolio dossiers, KPI activation, MRR, équipe multi-seat." },
      { icon: "📱", title: "Application mobile (preview)",
        description: "Capture terrain hors-ligne, sync automatique au retour réseau, photos avec géolocalisation." },
      { icon: "🚀", title: "PWA installable",
        description: "Installez Réno·Calc Pro sur votre écran d'accueil mobile/desktop, accès offline aux dossiers consultés." },
    ],
  },
];

export default async function ChangelogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public");

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Release notes
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Nouveautés Réno·Calc Pro
        </h1>
        <p className="mt-3 mx-auto max-w-2xl text-stone-600">
          L'évolution continue de la plateforme — nouvelles fonctionnalités, améliorations UX, corrections.
          Pour les détails techniques, consultez le <a href="https://github.com/vinciaflora/renocal-pro" className="font-semibold text-teal-700 hover:underline">CHANGELOG technique</a>.
        </p>
      </header>

      <div className="mt-12 space-y-12">
        {RELEASES.map((release, i) => (
          <article key={i} className="relative">
            {/* Marker timeline */}
            <div className="absolute -left-4 top-0 hidden h-full w-0.5 bg-stone-200 sm:block" />
            <div className="absolute -left-[22px] top-2 hidden h-4 w-4 rounded-full border-4 border-white bg-teal-600 sm:block" />

            <header className="mb-4 flex items-baseline gap-3">
              <h2 className="font-serif text-2xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
                {release.version}
              </h2>
              <time className="text-xs text-stone-500">{release.date}</time>
            </header>

            {release.highlights.length > 0 && (
              <ul className="mb-5 rounded-xl border border-teal-200 bg-teal-50 p-4">
                {release.highlights.map((h, j) => (
                  <li key={j} className="text-sm font-medium text-teal-900">{h}</li>
                ))}
              </ul>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {release.features.map((f, j) => (
                <div key={j} className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-stone-900">
                    <span aria-hidden className="mr-1.5">{f.icon}</span>
                    {f.title}
                  </h3>
                  <p className="mt-1 text-xs text-stone-600">{f.description}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <footer className="mt-16 border-t border-stone-200 pt-8 text-center">
        <h2 className="font-serif text-xl font-semibold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Vous avez une idée pour la prochaine release ?
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Nous lisons toutes les suggestions. Écrivez-nous à <a href="mailto:contact@renocalcpro.fr" className="font-semibold text-teal-700 hover:underline">contact@renocalcpro.fr</a>.
        </p>
      </footer>
    </div>
  );
}
