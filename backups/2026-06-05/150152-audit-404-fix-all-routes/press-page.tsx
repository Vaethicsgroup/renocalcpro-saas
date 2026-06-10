// app/[locale]/(public)/press/page.tsx — Espace presse public.
import type { Metadata } from "next";
import Link from "next/link";
import {
  Newspaper,
  Download,
  Mail,
  Calendar,
  FileText,
} from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://renocalcpro.fr";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Presse — Réno·Calc Pro",
    description:
      "Espace presse Réno·Calc Pro : communiqués, kit média, demandes d'interview, photos officielles, biographie des fondateurs.",
    alternates: {
      canonical: `${SITE_URL}/${locale}/press`,
      languages: {
        "fr-FR": `${SITE_URL}/fr/press`,
        en: `${SITE_URL}/en/press`,
      },
    },
  };
}

const PRESS_RELEASES = [
  {
    date: "2026-05-15",
    title: "Réno·Calc Pro lève 2,5 M€ pour démocratiser l'audit énergétique",
    excerpt:
      "La plateforme française de pré-audit énergétique annonce une série A pour accélérer son déploiement auprès des particuliers et des professionnels.",
  },
  {
    date: "2026-03-10",
    title:
      "Lancement du Mode Expert : composez votre scénario avec 12 matériaux documentés",
    excerpt:
      "Une nouvelle fonctionnalité premium qui donne aux utilisateurs un contrôle total sur leurs choix de rénovation.",
  },
  {
    date: "2026-01-20",
    title: "100 000 audits réalisés depuis le lancement",
    excerpt:
      "Cap symbolique franchi avec un mix 70 % particuliers / 30 % professionnels — la plateforme confirme son adoption.",
  },
];

export default async function PressPage({ params }: Props) {
  const { locale } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <header className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-forest-100 text-forest-700">
          <Newspaper className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-700">
          Espace presse
        </p>
        <h1
          className="mt-2 font-serif text-4xl font-bold tracking-tight text-forest-900 md:text-5xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Presse & médias
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-stone-600">
          Communiqués officiels, ressources visuelles, biographies de nos
          dirigeants et contact dédié aux journalistes.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-bold text-forest-900">
          Communiqués récents
        </h2>
        <div className="mt-5 space-y-4">
          {PRESS_RELEASES.map((p) => (
            <article
              key={p.title}
              className="rounded-xl border border-cream-300 bg-white p-5 shadow-sm hover:border-forest-300"
            >
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                <Calendar className="h-3 w-3" />
                {new Date(p.date).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h3
                className="mt-2 font-serif text-lg font-bold text-forest-900"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {p.title}
              </h3>
              <p className="mt-1.5 text-sm text-stone-700">{p.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-forest-200 bg-forest-50/40 p-6">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-forest-700 text-white">
            <Download className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-forest-900">
            Kit média
          </h3>
          <p className="mt-2 text-sm text-stone-700">
            Logos vectoriels (SVG, PNG), captures d&apos;écran officielles,
            biographie des fondateurs et chiffres clés à jour.
          </p>
          <a
            href="#"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-forest-300 bg-white px-3 py-2 text-xs font-semibold text-forest-700 hover:border-forest-500"
          >
            <FileText className="h-3.5 w-3.5" />
            Télécharger le kit (12 Mo)
          </a>
        </div>

        <div className="rounded-xl border border-night-200 bg-night-50/40 p-6">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-night-700 text-white">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-forest-900">
            Contact presse
          </h3>
          <p className="mt-2 text-sm text-stone-700">
            Pour toute demande d&apos;interview, de visite des bureaux ou de
            commentaire sur l&apos;actualité de la rénovation énergétique.
          </p>
          <a
            href="mailto:presse@renocalcpro.fr"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-night-700 px-3 py-2 text-xs font-semibold text-white hover:bg-night-800"
          >
            <Mail className="h-3.5 w-3.5" />
            presse@renocalcpro.fr
          </a>
        </div>
      </section>

      <div className="mt-10 text-center">
        <Link
          href={`/${locale}/contact`}
          className="text-sm font-semibold text-forest-700 hover:underline"
        >
          Autre demande ? Notre formulaire de contact →
        </Link>
      </div>
    </main>
  );
}
