// app/[locale]/(public)/page.tsx — Homepage publique V6 (mockup 1).
//
// Refonte fidèle à la maquette 01-homepage-reference.png.
// Composition : Header (layout) + Hero + Bandeau avantages + Fonctionnalités +
// Parcours 4 étapes + Showcase dashboard + CTA final + Footer (layout).
//
// L'ancienne version est conservée en `page.legacy.tsx.bak`.
// Branchements futurs :
//   - texte / i18n → next-intl messages
//   - KPI hero (−61 %, 1 280 €) → moteur énergétique Prisma
//   - CTA "Créer mon projet" → route réelle `/o/projects/new` (auth)
//   - Section dashboard → composants compositionV5 (DashboardMockup réel)
//
// Aucune modification du moteur, de la persistance ou des calculs métier.

import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  LaptopFrame, DashboardMockup, DEFAULT_DASHBOARD,
} from "@/components/marketing/compositionV5";

/* ─────────────────────────────── Icons inline ─────────────────────────────── */

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 fill-none stroke-current stroke-[1.75]`.concat(" " + className)}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
const IconLeaf     = (p: { className?: string }) => <Icon {...p} d="M3 21s2-8 8-13 10-5 10-5-0 7-5 12-13 6-13 6zM3 21l9-9" />;
const IconLayers   = (p: { className?: string }) => <Icon {...p} d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 18l9 5 9-5" />;
const IconCoins    = (p: { className?: string }) => <Icon {...p} d="M8 7a5 3 0 1 0 10 0 5 3 0 1 0-10 0zM8 7v5c0 1.66 2.24 3 5 3s5-1.34 5-3V7M3 13a5 3 0 1 0 10 0 5 3 0 1 0-10 0zM3 13v5c0 1.66 2.24 3 5 3s5-1.34 5-3v-5" />;
const IconDocument = (p: { className?: string }) => <Icon {...p} d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h8M8 9h4" />;
const IconChart    = (p: { className?: string }) => <Icon {...p} d="M3 20h18M5 20V9M10 20V5M15 20v-7M20 20v-10" />;
const IconCheck    = (p: { className?: string }) => <Icon {...p} d="M4 12l6 6L20 6" />;
const IconArrow    = (p: { className?: string }) => <Icon {...p} d="M5 12h14M13 5l7 7-7 7" />;
const IconPlay     = (p: { className?: string }) => <Icon {...p} d="M8 5v14l11-7z" />;
const IconRocket   = (p: { className?: string }) => <Icon {...p} d="M5 15l4 4m6-14a7 7 0 0 1 4 4l-9 9H6v-4l9-9zM16 8l0 0M14.5 14.5c-2 2-5 2-5 2s0-3 2-5" />;

/* ─────────────────────────────────── Page ─────────────────────────────────── */

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div lang="fr" translate="no" className="notranslate">
      <Hero />
      <BenefitsBar />
      <FeaturesSection />
      <StepsSection />
      <PlatformShowcase />
      <FinalCta />
    </div>
  );
}

/* ─────────────────────────────────── Hero ─────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cream-50 via-cream-50 to-cream-100">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-12 px-8 pb-24 pt-14 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:pb-32 lg:pt-20">
        {/* Colonne texte */}
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[2.2px] text-stone-500">
            <span className="h-0.5 w-10 bg-copper-500" />
            Rénovation énergétique · Simulation · Aides · Rapports
          </div>
          <h1 className="font-serif text-[46px] font-medium leading-[1.08] tracking-[-0.025em] text-forest-900 lg:text-[58px]">
            Simplifiez vos projets de{" "}
            <em className="not-italic">
              <span className="italic text-forest-800">rénovation énergétique</span>
            </em>
          </h1>
          <p className="mt-6 max-w-[520px] text-[17px] leading-[1.6] text-stone-600">
            Concevez, simulez, comparez et pilotez vos travaux de rénovation énergétique,
            du diagnostic à la restitution d'un rapport professionnel.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/fr/auth/signup?intent=new-project"
              className="inline-flex items-center gap-2.5 rounded-xl bg-forest-800 px-6 py-3.5 text-[14px] font-semibold text-white shadow-elevated transition hover:bg-forest-900"
            >
              Créer mon projet
              <IconArrow className="h-4 w-4" />
            </Link>
            <Link
              href="/fr/presentation"
              className="inline-flex items-center gap-2.5 rounded-xl border border-forest-300 bg-white/60 px-6 py-3.5 text-[14px] font-semibold text-forest-800 backdrop-blur transition hover:bg-white"
            >
              <IconPlay className="h-4 w-4" />
              Découvrir la plateforme
            </Link>
          </div>
        </div>

        {/* Colonne image + overlay DPE */}
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-floating">
            <Image
              src="/images/renocalcpro/maison-individuelle.webp"
              alt="Maison individuelle contemporaine rénovée avec façade blanche, pierre et grandes baies vitrées, entourée d'un jardin paysager"
              fill
              priority
              sizes="(min-width: 1024px) 720px, 100vw"
              className="object-cover"
            />
          </div>
          <SimulationCard />
        </div>
      </div>
    </section>
  );
}

function SimulationCard() {
  return (
    <aside className="absolute -bottom-10 right-4 z-20 w-[300px] rounded-2xl border border-cream-300 bg-white/95 p-5 shadow-floating backdrop-blur-sm lg:-bottom-6 lg:right-[-20px]">
      <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-forest-800">
        <IconChart className="h-4 w-4 text-forest-700" />
        Simulation énergétique
      </div>
      <div className="mb-3 border-t border-cream-200" />
      <div className="mb-3 text-[11px] uppercase tracking-wider text-stone-500">Classe énergétique (DPE)</div>
      <div className="mb-4 flex items-center gap-3">
        <DpeBadge letter="D" tone="warn" />
        <IconArrow className="h-4 w-4 text-stone-400" />
        <DpeBadge letter="B" tone="success" />
      </div>
      <div className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">Consommation estimée</div>
      <div className="mb-3 font-serif text-[22px] font-semibold tracking-[-0.3px] text-forest-800">− 61 %</div>
      <div className="mb-1.5 text-[11px] uppercase tracking-wider text-stone-500">Économies annuelles</div>
      <div className="font-serif text-[18px] font-semibold tracking-[-0.3px] text-copper-700">≈ 1 280 €</div>
      <div className="mt-3 text-[9px] italic text-stone-400">
        Valeurs indicatives · exemple de simulation
      </div>
    </aside>
  );
}

function DpeBadge({ letter, tone }: { letter: string; tone: "warn" | "success" }) {
  const bg = tone === "warn"
    ? "linear-gradient(135deg,#EFB647,#C99433)"
    : "linear-gradient(135deg,#52B870,#3F9856)";
  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[15px] font-bold text-white shadow-soft"
      style={{ background: bg }}
    >
      {letter}
    </span>
  );
}

/* ──────────────────────────── Bandeau avantages ──────────────────────────── */

function BenefitsBar() {
  const items = [
    { icon: IconLeaf,     label: "Réduction de la consommation énergétique" },
    { icon: IconLayers,   label: "Scénarios de travaux comparés" },
    { icon: IconCoins,    label: "Aides et financements mobilisables" },
    { icon: IconDocument, label: "Rapports professionnels conformes" },
  ];
  return (
    <section className="border-y border-cream-300 bg-cream-50">
      <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-6 px-8 py-8 lg:grid-cols-4 lg:py-10">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-800 ring-1 ring-forest-100">
              <Icon />
            </span>
            <span className="text-[13.5px] font-medium leading-snug text-forest-900">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── Fonctionnalités clés ─────────────────────────── */

function FeaturesSection() {
  const features = [
    {
      icon: IconChart,
      title: "Analyse énergétique",
      body: "Évaluez la performance de votre bâtiment et identifiez les gisements d'économies.",
      image: "/images/renocalcpro/rapport-energetique.webp",
      imageAlt: "Plans et calculs d'analyse énergétique sur un bureau",
    },
    {
      icon: IconLayers,
      title: "Scénarios de rénovation",
      body: "Comparez plusieurs stratégies de travaux (isolation, chauffage, ventilation…) et leurs performances.",
      image: "/images/renocalcpro/maison-individuelle.webp",
      imageAlt: "Isolation en laine de bois sous combles",
    },
    {
      icon: IconCoins,
      title: "Aides et financements",
      body: "Identifiez les aides disponibles (MaPrimeRénov', CEE, etc.) et estimez leur impact sur votre budget.",
      image: "/images/renocalcpro/logement-collectif.webp",
      imageAlt: "Bureau avec plante verte et simulation financière",
    },
    {
      icon: IconDocument,
      title: "Rapports professionnels",
      body: "Générez un rapport complet, clair et exploitable pour vos clients, partenaires ou démarches administratives.",
      image: "/images/renocalcpro/rapport-energetique.webp",
      imageAlt: "Rapport énergétique imprimé avec classes DPE",
    },
  ];
  return (
    <section className="bg-cream-50">
      <div className="mx-auto max-w-[1320px] px-8 pb-20 pt-24">
        <SectionTag>Fonctionnalités clés</SectionTag>
        <h2 className="mt-3 max-w-[760px] font-serif text-[42px] font-medium leading-[1.1] tracking-[-0.02em] text-forest-900 lg:text-[48px]">
          Une plateforme complète pour vos projets
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: IconCmp, title, body, image, imageAlt,
}: {
  icon: (p: { className?: string }) => ReactNode;
  title: string; body: string; image: string; imageAlt: string;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card transition hover:shadow-elevated">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-forest-800 shadow-soft ring-1 ring-cream-200">
          <IconCmp />
        </span>
      </div>
      <div className="p-5">
        <h3 className="mb-2 font-serif text-[20px] font-semibold tracking-[-0.2px] text-forest-900">{title}</h3>
        <p className="text-[13px] leading-[1.55] text-stone-600">{body}</p>
      </div>
    </article>
  );
}

/* ─────────────────────── Votre projet en 4 étapes ─────────────────────── */

function StepsSection() {
  const steps = [
    { n: 1, title: "Créer le projet",           body: "Définissez votre bâtiment et vos objectifs." },
    { n: 2, title: "Saisir les caractéristiques", body: "Renseignez les données techniques principales.", active: true },
    { n: 3, title: "Comparer les scénarios",    body: "Évaluez les solutions et leurs performances." },
    { n: 4, title: "Générer le rapport",        body: "Obtenez une restitution professionnelle prête à l'emploi." },
  ];
  return (
    <section className="bg-[#F5F2EB]">
      <div className="mx-auto max-w-[1320px] px-8 py-24">
        <SectionTag>Un parcours simple et guidé</SectionTag>
        <h2 className="mt-3 max-w-[560px] font-serif text-[42px] font-medium leading-[1.1] tracking-[-0.02em] text-forest-900 lg:text-[48px]">
          Votre projet en 4 étapes
        </h2>

        <div className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
          {/* ligne connectrice */}
          <div
            className="pointer-events-none absolute left-[7%] right-[7%] top-7 hidden md:block"
            aria-hidden
          >
            <div className="h-px w-full border-t border-dashed border-stone-300" />
          </div>
          {steps.map((s) => (
            <div key={s.n} className="relative text-center">
              <div
                className={
                  "relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full font-serif text-[20px] font-semibold " +
                  (s.active
                    ? "bg-forest-700 text-white ring-4 ring-forest-100"
                    : "border-2 border-stone-300 bg-white text-forest-800")
                }
              >
                {s.n}
              </div>
              <h3 className="mb-1 font-serif text-[17px] font-semibold tracking-[-0.1px] text-forest-900">{s.title}</h3>
              <p className="mx-auto max-w-[230px] text-[12.5px] leading-[1.55] text-stone-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Platform showcase ─────────────────────────── */

function PlatformShowcase() {
  const bullets = [
    "Un tableau de bord clair et personnalisable",
    "Un accompagnement pas à pas",
    "Des résultats fiables et exploitables",
    "Des rapports prêts à partager",
  ];
  return (
    <section className="bg-cream-50">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 px-8 py-24 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        {/* Dashboard laptop */}
        <div className="relative">
          <LaptopFrame className="mx-auto w-full max-w-[720px] scale-[0.92] origin-top-left lg:scale-100">
            <DashboardMockup data={DEFAULT_DASHBOARD} />
          </LaptopFrame>
        </div>

        <div>
          <SectionTag>Découvrez RENOCALCPRO</SectionTag>
          <h2 className="mt-3 font-serif text-[42px] font-medium leading-[1.08] tracking-[-0.02em] text-forest-900 lg:text-[46px]">
            Une solution intuitive et performante
          </h2>
          <ul className="mt-8 space-y-3.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] text-forest-900">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-forest-700 text-white">
                  <IconCheck className="h-4 w-4" />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/fr/presentation"
              className="inline-flex items-center gap-2 rounded-xl bg-forest-800 px-5 py-3 text-[13.5px] font-semibold text-white shadow-elevated hover:bg-forest-900"
            >
              Découvrir la plateforme
              <IconArrow className="h-4 w-4" />
            </Link>
            <Link
              href="/fr/fonctionnalites"
              className="inline-flex items-center gap-2 rounded-xl border border-forest-300 bg-white px-5 py-3 text-[13.5px] font-semibold text-forest-800 hover:bg-cream-100"
            >
              Voir toutes les fonctionnalités
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── Final CTA ─────────────────────────────── */

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-forest-800 via-forest-800 to-forest-900">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden>
        <Image
          src="/images/renocalcpro/maison-individuelle.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="relative mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-8 px-8 py-14 text-white lg:flex-row lg:items-center lg:py-16">
        <div>
          <h2 className="font-serif text-[32px] font-medium leading-tight tracking-[-0.02em] lg:text-[38px]">
            Prêt à lancer votre projet ?
          </h2>
          <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-cream-100/90">
            Évaluez, optimisez et pilotez vos travaux de rénovation énergétique dès maintenant.
          </p>
        </div>
        <Link
          href="/fr/auth/signup?intent=new-project"
          className="inline-flex items-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-[14px] font-semibold text-forest-900 shadow-elevated transition hover:bg-cream-50"
        >
          <IconRocket className="h-4 w-4" />
          Créer mon projet gratuitement
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────────── Utilities ─────────────────────────────── */

function SectionTag({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[2.2px] text-copper-600">
      <span className="h-0.5 w-6 bg-copper-500" />
      {children}
    </div>
  );
}

