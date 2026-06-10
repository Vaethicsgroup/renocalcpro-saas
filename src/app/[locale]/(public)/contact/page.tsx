// app/[locale]/(public)/contact/page.tsx — Page Contact v4.0 « Maquette »
// ════════════════════════════════════════════════════════════════════════════
// Refonte selon la maquette validée par le user :
//   - Hero centré « Parlons de votre projet » serif énorme avec leaves SVG bg
//   - 3 cards inline (Démo / Conseil personnalisé / Données sécurisées) avec
//     icones cercles verts
//   - 2 colonnes : sidebar coordonnées (Téléphone / Email / Adresse) avec
//     icones rondes vertes + formulaire « Envoyez-nous un message »
//   - Illustration vectorielle maison en bas
//   - Footer hérité du PublicLayout (HeaderPremium + FooterPremium déjà
//     renvoient au site marketing)
//
// Couleurs maquette :
//   forest deep #1F4D2E (CTA, titres)
//   forest medium #4A7050 (accents)
//   forest light #7BC067 (icons highlights)
//   cream warm #FFFEFB (bg principal)
//
// La page est gardée comme Server Component pour rester SSR-friendly.

import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  CalendarCheck,
  Lightbulb,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { ContactFormDemo } from "@/components/contact/ContactFormDemo";

interface Props {
  params: Promise<{ locale: string }>;
}

interface ContactItem {
  Icon: LucideIcon;
  labelKey: string;
  primaryKey: string;
  secondaryKey?: string;
  href?: string;
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contactPage" });

  const HERO_FEATURES = [
    { Icon: CalendarCheck, titleKey: "featDemoTitle", descKey: "featDemoDesc" },
    { Icon: Lightbulb, titleKey: "featAdviceTitle", descKey: "featAdviceDesc" },
    { Icon: ShieldCheck, titleKey: "featSecurityTitle", descKey: "featSecurityDesc" },
  ];

  const CONTACT_ITEMS: ReadonlyArray<ContactItem> = [
    { Icon: Phone, labelKey: "labelPhone", primaryKey: "phonePrimary", secondaryKey: "phoneSecondary" },
    { Icon: Mail, labelKey: "labelEmail", primaryKey: "_emailPrimary", secondaryKey: "emailSecondary", href: "mailto:contact@renocalcpro.fr" },
    { Icon: MapPin, labelKey: "labelAddress", primaryKey: "addressPrimary", secondaryKey: "addressSecondary" },
  ];

  return (
    <main className="relative overflow-hidden bg-[#FFFEFB] pb-24">
      {/* Halo de feuilles décoratif en arrière-plan */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <LeavesDecoration />
      </div>

      {/* ── Hero ── */}
      <header className="relative mx-auto max-w-4xl px-6 pt-16 text-center md:pt-20">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#1F4D2E]/70">
          {t("eyebrow")}
        </p>
        <h1
          className="mt-4 font-serif text-4xl font-bold leading-[1.05] tracking-tight text-[#1F4D2E] md:text-5xl lg:text-6xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-stone-700 md:text-lg">
          {t("heroSubtitle1")}
          <br className="hidden sm:block" />
          {t("heroSubtitle2")}
        </p>

        {/* 3 features inline */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3 sm:gap-5">
          {HERO_FEATURES.map((f) => (
            <div
              key={f.titleKey}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span
                aria-hidden
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F4D2E]/8 text-[#1F4D2E] ring-1 ring-[#1F4D2E]/20"
                style={{ backgroundColor: "rgba(31,77,46,0.08)" }}
              >
                <f.Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1F4D2E]">
                  {t(f.titleKey)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                  {t(f.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── 2 colonnes : sidebar coordonnées + form ── */}
      <section className="relative mx-auto mt-14 grid max-w-6xl gap-6 px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-10">
        {/* Sidebar coordonnées */}
        <aside aria-label={t("ariaCoords")} className="space-y-3">
          <h2
            className="font-serif text-xl font-bold text-[#1F4D2E]"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            {t("coordsTitle")}
          </h2>
          <p className="text-sm text-stone-600">
            {t("coordsSubtitle")}
          </p>
          <div className="mt-4 space-y-3">
            {CONTACT_ITEMS.map((item) => (
              <ContactCardComp
                key={item.labelKey}
                item={item}
                label={t(item.labelKey)}
                primary={t(item.primaryKey)}
                secondary={item.secondaryKey ? t(item.secondaryKey) : undefined}
              />
            ))}
          </div>
        </aside>

        {/* Formulaire — v4.1 client component mode démo explicite */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card md:p-8">
          <h2
            className="font-serif text-xl font-bold text-[#1F4D2E] md:text-2xl"
            style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
          >
            {t("formTitle")}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {t("formSubtitle")}
          </p>
          <ContactFormDemo locale={locale} contactEmail="contact@renocalcpro.fr" />
        </section>
      </section>

      {/* ── Illustration maison bottom ── */}
      <section className="relative mx-auto mt-16 max-w-5xl px-6">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-[#F8F4EB] via-white to-[#F0F6F0] shadow-card">
          <div className="flex flex-col items-center gap-6 p-8 md:flex-row md:p-10">
            <ContactHouseIllustration />
            <div className="flex-1 text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1F4D2E]/70">
                {t("teamEyebrow")}
              </p>
              <h3
                className="mt-2 font-serif text-xl font-bold text-[#1F4D2E] md:text-2xl"
                style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
              >
                {t("teamTitle")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {t("teamSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[#1F4D2E]">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function ContactCardComp({
  item,
  label,
  primary,
  secondary,
}: {
  item: ContactItem;
  label: string;
  primary: string;
  secondary?: string;
}) {
  const Inner = (
    <>
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-soft"
        style={{ backgroundColor: "#1F4D2E" }}
      >
        <item.Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-semibold uppercase tracking-wider text-stone-500">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#1F4D2E]">
          {primary}
        </p>
        {secondary && (
          <p className="mt-0.5 text-xs text-stone-600">{secondary}</p>
        )}
      </div>
    </>
  );

  const base =
    "flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-card transition-colors";

  return item.href ? (
    <a href={item.href} className={`${base} hover:border-[#1F4D2E]/30`}>
      {Inner}
    </a>
  ) : (
    <div className={base}>{Inner}</div>
  );
}

/**
 * Décoration SVG feuilles en arrière-plan du hero (effet ambiant, opacité
 * faible pour ne pas perturber la lisibilité).
 */
function LeavesDecoration() {
  return (
    <svg
      viewBox="0 0 1440 600"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="leaves-pattern"
          x="0"
          y="0"
          width="220"
          height="220"
          patternUnits="userSpaceOnUse"
        >
          <g opacity="0.08" fill="#1F4D2E">
            <path d="M40 30 Q60 80 30 130 Q0 100 20 60 Z" />
            <path d="M170 80 Q190 130 160 180 Q130 150 150 110 Z" />
            <path d="M90 160 Q110 200 80 220 Q60 200 70 180 Z" />
          </g>
        </pattern>
      </defs>
      <rect width="1440" height="600" fill="url(#leaves-pattern)" />
    </svg>
  );
}

/**
 * Illustration vectorielle maison moderne pour la section bottom.
 */
function ContactHouseIllustration() {
  return (
    <svg
      viewBox="0 0 240 180"
      xmlns="http://www.w3.org/2000/svg"
      className="h-32 w-48 shrink-0 md:h-40 md:w-60"
      aria-hidden
    >
      {/* Soleil */}
      <circle cx="210" cy="30" r="14" fill="#FCD34D" opacity="0.85" />

      {/* Arbres background */}
      <ellipse cx="30" cy="135" rx="16" ry="32" fill="#6A8D6C" opacity="0.5" />
      <rect x="27" y="150" width="6" height="20" fill="#7E7150" />

      {/* Sol */}
      <rect x="0" y="160" width="240" height="20" fill="#C4B285" opacity="0.3" />

      {/* Maison */}
      <rect x="70" y="80" width="120" height="80" fill="#FFFFFF" stroke="#1F4D2E" strokeWidth="2" />
      <polygon points="70,80 130,40 190,80" fill="#1F4D2E" />

      {/* Étage bois */}
      <rect x="70" y="115" width="120" height="45" fill="#8A7B5A" opacity="0.25" stroke="#1F4D2E" strokeWidth="2" />

      {/* Fenêtre haute */}
      <rect x="85" y="85" width="40" height="20" fill="#DBEAFE" stroke="#1F4D2E" strokeWidth="1.5" />
      <line x1="105" y1="85" x2="105" y2="105" stroke="#1F4D2E" strokeWidth="1.2" />

      {/* Fenêtres bas */}
      <rect x="85" y="125" width="25" height="25" fill="#DBEAFE" stroke="#1F4D2E" strokeWidth="1.5" />
      <rect x="150" y="125" width="25" height="25" fill="#DBEAFE" stroke="#1F4D2E" strokeWidth="1.5" />

      {/* Porte */}
      <rect x="120" y="120" width="20" height="40" fill="#8A4A35" stroke="#1F4D2E" strokeWidth="1.5" />
      <circle cx="134" cy="140" r="1.2" fill="#FCD34D" />

      {/* Cheminée */}
      <rect x="160" y="50" width="10" height="20" fill="#5E5440" stroke="#1F4D2E" strokeWidth="1.5" />

      {/* Garde-corps balcon */}
      <line x1="70" y1="115" x2="190" y2="115" stroke="#1F4D2E" strokeWidth="2" />

      {/* Buisson */}
      <ellipse cx="200" cy="160" rx="14" ry="8" fill="#6A8D6C" opacity="0.7" />
    </svg>
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}
