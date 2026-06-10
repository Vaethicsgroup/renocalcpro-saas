// app/[locale]/(public)/partenaires/page.tsx — Page partenaires & programme d'apport d'affaires.
import type { Metadata } from "next";
import Link from "next/link";
import {
  Handshake,
  Building2,
  Shield,
  Zap,
  Award,
  ArrowRight,
} from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://renocalcpro.fr";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Partenaires — Réno·Calc Pro",
    description:
      "Découvrez nos partenaires : Anah, France Rénov', Ademe, fournisseurs CEE, banques Éco-PTZ, artisans RGE. Programme partenariat technique et commercial.",
    alternates: {
      canonical: `${SITE_URL}/${locale}/partenaires`,
      languages: {
        "fr-FR": `${SITE_URL}/fr/partenaires`,
        en: `${SITE_URL}/en/partenaires`,
      },
    },
  };
}

const PARTNER_CATEGORIES = [
  {
    icon: Shield,
    color: "bg-forest-100 text-forest-700",
    title: "Institutions publiques",
    desc: "Anah, France Rénov', Ademe, Cerema — nos catalogues d'aides et de calculs sont alignés sur leurs barèmes officiels 2025.",
    examples: ["Anah", "France Rénov'", "Ademe", "Cerema"],
  },
  {
    icon: Zap,
    color: "bg-amber-100 text-amber-700",
    title: "Obligés CEE",
    desc: "Versement automatisé des primes Coup de Pouce via des conventions directes avec les principaux obligés énergie.",
    examples: ["TotalEnergies", "EDF", "Engie", "PrimesEnergie.fr"],
  },
  {
    icon: Building2,
    color: "bg-night-100 text-night-700",
    title: "Banques Éco-PTZ",
    desc: "Constitution de dossier facilitée auprès de nos banques partenaires pour le prêt à taux zéro.",
    examples: ["Crédit Agricole", "Société Générale", "BPCE", "BNP Paribas"],
  },
  {
    icon: Award,
    color: "bg-info-100 text-info-700",
    title: "Réseaux d'artisans RGE",
    desc: "Mise en relation avec un réseau d'entreprises RGE qualifiées dans toute la France.",
    examples: ["FFB", "CAPEB", "Réseau Effy", "Hello Watt"],
  },
];

export default async function PartenairesPage({ params }: Props) {
  const { locale } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <header className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-forest-100 text-forest-700">
          <Handshake className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
          Partenariats
        </p>
        <h1
          className="mt-2 font-serif text-4xl font-bold tracking-tight text-forest-900 md:text-5xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Nos partenaires
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-stone-600">
          Réno·Calc Pro s&apos;appuie sur un écosystème complet pour offrir
          une expérience fluide, de l&apos;audit énergétique au versement des
          aides en passant par la mise en relation avec des artisans RGE.
        </p>
      </header>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {PARTNER_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <article
              key={cat.title}
              className="rounded-xl border border-cream-300 bg-white p-5 shadow-sm hover:border-forest-300"
            >
              <div
                className={`mb-3 grid h-10 w-10 place-items-center rounded-full ${cat.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3
                className="font-serif text-lg font-bold text-forest-900"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {cat.title}
              </h3>
              <p className="mt-1.5 text-sm text-stone-700">{cat.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cat.examples.map((e) => (
                  <span
                    key={e}
                    className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-12 rounded-2xl border border-forest-300 bg-gradient-to-br from-forest-50 via-white to-cream-50 p-8 text-center">
        <h2 className="font-serif text-2xl font-bold text-forest-900 md:text-3xl">
          Devenir partenaire
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-700">
          Vous êtes un acteur de la rénovation énergétique, un courtier en
          financement, un installateur RGE ou une collectivité locale ? Nous
          étudions toutes les propositions de partenariat technique, commercial
          ou institutionnel.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${locale}/contact`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Proposer un partenariat
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="mailto:partenaires@renocalcpro.fr"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-forest-300 bg-white px-4 text-sm font-semibold text-forest-900 hover:border-forest-500"
          >
            partenaires@renocalcpro.fr
          </a>
        </div>
      </section>
    </main>
  );
}
