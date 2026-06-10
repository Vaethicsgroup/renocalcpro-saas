// components/marketing/HeroPremium.tsx — Hero v3.2 (i18n + mobile-first + lien fixé)
// v3.2 :
//  - texte tiré de useTranslations("marketing") → /en réellement traduit
//  - tailles & paddings mobile-first (text-3xl base, sm:4xl, md:5xl, lg:6xl)
//  - cards DPE/scénario cachées en dessous de md (réduit l'encombrement mobile)
//  - lien "Voir comment ça marche" → /help/getting-started (page créée et autonome)

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Users,
  UserCheck,
  ShieldCheck,
  MapPin,
  ClipboardList,
  Coins,
  Target,
  FileText,
  Check,
} from "lucide-react";

// Aliases sémantiques pour clarté du contexte STATS.
const HeroUsers = Users;
const HeroExperts = UserCheck;
const HeroShield = ShieldCheck;
const HeroHosting = MapPin;

interface Props {
  locale: string;
}

export function HeroPremium({ locale }: Props) {
  const t = useTranslations("marketing");

  // DA Energy Trust : pictogrammes Lucide sobres.
  const BENEFITS = [
    { Icon: ClipboardList, text: t("benefits.diagnostic") },
    { Icon: Coins,         text: t("benefits.estimation") },
    { Icon: Target,        text: t("benefits.scenarios") },
    { Icon: FileText,      text: t("benefits.reports") },
  ];

  // DA Energy Trust : pictogrammes sobres Lucide remplacent les emojis.
  const STATS = [
    { value: t("stats.projectsValue"), label: t("stats.projectsLabel"), Icon: HeroUsers },
    { value: t("stats.expertsValue"),  label: t("stats.expertsLabel"),  Icon: HeroExperts },
    { value: t("stats.dataValue"),     label: t("stats.dataLabel"),     Icon: HeroShield },
    { value: t("stats.hostingValue"),  label: t("stats.hostingLabel"),  Icon: HeroHosting },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-forest-200/30 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute top-1/2 -left-24 h-64 w-64 rounded-full bg-cream-300/40 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-10 pb-14 sm:px-6 sm:pt-14 sm:pb-16 md:gap-12 md:pt-20 md:pb-20 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pt-24">
        {/* Colonne gauche : titre + bénéfices + CTA */}
        <div className="flex flex-col justify-center">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-forest-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-forest-700 shadow-sm backdrop-blur sm:text-xs">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-forest-500" />
            {t("eyebrow")}
          </div>

          <h1
            className="font-serif text-3xl font-bold leading-[1.08] tracking-tight text-forest-900 sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif" }}
          >
            {t("titleLine1")}{" "}
            <span className="text-forest-700">{t("titleHighlight")}</span>
            <br />
            <span className="text-forest-500">{t("titleLine2")}</span>
            <br />
            <span className="text-forest-700">{t("titleLine3")}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-forest-900/70 sm:mt-6 sm:text-lg">
            {t("subtitle")}
          </p>

          <ul className="mt-6 grid gap-2.5 sm:mt-8 sm:gap-3 sm:grid-cols-2">
            {BENEFITS.map(b => (
              <li key={b.text} className="flex items-center gap-3 text-sm text-stone-700">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-700"
                >
                  <b.Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <span className="font-medium">{b.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Link
              href={`/${locale}/auth/signup`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-6 text-sm font-semibold text-cream-50 shadow-lg shadow-forest-900/15 transition hover:bg-forest-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2 sm:w-auto sm:text-base"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href={`/${locale}/help/getting-started`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-cream-400 bg-white/90 px-6 text-sm font-semibold text-forest-800 backdrop-blur transition hover:border-forest-300 hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2 sm:w-auto sm:text-base"
            >
              <span aria-hidden className="text-forest-500">▶</span>
              {t("ctaSecondary")}
            </Link>
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-forest-900/60">
            <span>✓ {t("trust.noCommit")}</span>
            <span aria-hidden>·</span>
            <span>{t("trust.instant")}</span>
            <span aria-hidden>·</span>
            <span>{t("trust.rgpd")}</span>
          </p>
        </div>

        {/* Colonne droite : preview produit — uniquement md+ (allège mobile) */}
        <div className="relative hidden md:block">
          <ProductPreview t={t} />
        </div>
      </div>

      {/* Bandeau stats sous le hero — bleu nuit premium */}
      <div className="relative bg-night-800 text-cream-100">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-5 py-6 sm:gap-6 sm:px-6 sm:py-7 md:grid-cols-4">
          {STATS.map(s => (
            <div key={s.label} className="flex items-center gap-3 border-l border-cream-100/15 pl-4 first:border-l-0 first:pl-0 md:pl-6">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-500/15 text-forest-400"
              >
                <s.Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="truncate font-serif text-base font-bold leading-tight text-cream-50 sm:text-xl">{s.value}</div>
                <div className="truncate text-[10px] uppercase tracking-wider text-cream-200/75 sm:text-xs">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPreview({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="relative mx-auto min-h-[480px] w-full max-w-[560px] lg:min-h-[520px]">
      {/* Scène SVG */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl border border-cream-300 bg-gradient-to-br from-cream-50 via-cream-100 to-forest-50 shadow-2xl shadow-forest-900/10">
        <HouseIllustration />
      </div>

      {/* Carte DPE (top-right) */}
      <div className="absolute right-3 top-4 z-10 w-[220px] rounded-2xl border border-cream-300 bg-white p-3.5 shadow-xl shadow-forest-900/10 ring-1 ring-forest-900/5 sm:right-4 sm:top-6 sm:w-[240px] sm:p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-forest-900 sm:text-sm">{t("previewDpeTitle")}</h3>
          <span className="rounded-md bg-forest-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-700">DPE</span>
        </div>
        <div className="mt-3 space-y-1">
          {[
            { letter: "A", color: "#2d7a3e", w: 30 },
            { letter: "B", color: "#5ba13f", w: 38 },
            { letter: "C", color: "#a9c440", w: 50, active: "after" as const },
            { letter: "D", color: "#f4d03f", w: 60 },
            { letter: "E", color: "#f5ab35", w: 72, active: "before" as const },
            { letter: "F", color: "#e8763f", w: 82 },
            { letter: "G", color: "#c7402e", w: 92 },
          ].map(d => (
            <div key={d.letter} className="flex items-center gap-2">
              <div
                className="flex h-4 items-center justify-end rounded pr-1.5 text-[10px] font-bold text-white sm:h-5"
                style={{ backgroundColor: d.color, width: `${d.w}%` }}
              >
                {d.letter}
              </div>
              {d.active && (
                <span
                  className={[
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    d.active === "after"
                      ? "bg-forest-100 text-forest-700"
                      : "bg-orange-100 text-orange-700",
                  ].join(" ")}
                >
                  {d.active === "after" ? t("previewBadgeAfter") : t("previewBadgeBefore")}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-2 text-[11px]">
          <span className="text-forest-900/60">{t("previewDpeBefore")}</span>
          <span className="font-semibold text-forest-700">{t("previewDpeAfter")}</span>
        </div>
      </div>

      {/* Carte scénario (bottom-left) */}
      <div className="absolute bottom-4 left-3 z-10 w-[260px] rounded-2xl border border-cream-300 bg-white p-3.5 shadow-xl shadow-forest-900/10 ring-1 ring-forest-900/5 sm:bottom-6 sm:left-4 sm:w-[280px] sm:p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-forest-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream-50">{t("previewScenarioBadge")}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-forest-700">{t("previewScenarioKicker")}</span>
        </div>
        <h3 className="mt-2 font-serif text-sm font-bold text-forest-900 sm:text-base">{t("previewScenarioTitle")}</h3>
        <ul className="mt-3 space-y-1.5 text-xs text-forest-900/85">
          <li className="flex items-center gap-2">
            <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-forest-100 text-forest-700">
              <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
            </span>
            {t("previewScenarioItem1")}
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-forest-100 text-forest-700">
              <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
            </span>
            {t("previewScenarioItem2Pre")} <strong className="font-semibold">{t("previewScenarioItem2Strong")}</strong>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-forest-100 text-forest-700">
              <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
            </span>
            <strong className="font-semibold">{t("previewScenarioItem3Strong")}</strong> {t("previewScenarioItem3Post")}
          </li>
        </ul>
        <button
          type="button"
          className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-cream-400 bg-white py-1.5 text-xs font-semibold text-forest-800 transition hover:border-forest-300 hover:bg-cream-100"
        >
          <ClipboardList aria-hidden className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t("previewScenarioDetail")}
        </button>
      </div>
    </div>
  );
}

function HouseIllustration() {
  return (
    <svg
      viewBox="0 0 560 520"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#faf6ec" />
          <stop offset="100%" stopColor="#eaf3ec" />
        </linearGradient>
        <linearGradient id="roof" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3d6b4f" />
          <stop offset="100%" stopColor="#2d5a3e" />
        </linearGradient>
        <linearGradient id="wall" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fffdf5" />
          <stop offset="100%" stopColor="#f4ecd5" />
        </linearGradient>
        <linearGradient id="windowGlass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#cfe3d6" />
          <stop offset="100%" stopColor="#a8c9b3" />
        </linearGradient>
      </defs>
      <rect width="560" height="520" fill="url(#sky)" />
      <circle cx="450" cy="100" r="46" fill="#f4d03f" opacity="0.55" />
      <circle cx="450" cy="100" r="32" fill="#f5c542" opacity="0.85" />
      <ellipse cx="80" cy="320" rx="42" ry="58" fill="#4a7c5f" opacity="0.85" />
      <rect x="75" y="350" width="10" height="50" fill="#5a4128" />
      <path d="M0 410 L560 380 L560 520 L0 520 Z" fill="#7ea48a" opacity="0.4" />
      <path d="M0 430 L560 405 L560 520 L0 520 Z" fill="#5a8a6a" opacity="0.6" />
      <rect x="160" y="240" width="260" height="180" fill="url(#wall)" stroke="#d8cfb3" strokeWidth="2" />
      <polygon points="140,242 290,140 440,242" fill="url(#roof)" />
      <polygon points="140,242 290,140 440,242 425,252 290,158 155,252" fill="#1f4a2d" opacity="0.4" />
      <rect x="370" y="160" width="22" height="60" fill="#8a4a35" />
      <rect x="368" y="158" width="26" height="8" fill="#6b3a28" />
      <rect x="270" y="320" width="50" height="100" fill="#4a3528" rx="2" />
      <circle cx="310" cy="370" r="2.5" fill="#d4b873" />
      <rect x="270" y="318" width="50" height="6" fill="#3a2820" />
      <rect x="185" y="275" width="60" height="60" fill="url(#windowGlass)" stroke="#3d6b4f" strokeWidth="3" />
      <line x1="215" y1="275" x2="215" y2="335" stroke="#3d6b4f" strokeWidth="2" />
      <line x1="185" y1="305" x2="245" y2="305" stroke="#3d6b4f" strokeWidth="2" />
      <rect x="340" y="275" width="60" height="60" fill="url(#windowGlass)" stroke="#3d6b4f" strokeWidth="3" />
      <line x1="370" y1="275" x2="370" y2="335" stroke="#3d6b4f" strokeWidth="2" />
      <line x1="340" y1="305" x2="400" y2="305" stroke="#3d6b4f" strokeWidth="2" />
      <rect x="265" y="195" width="50" height="40" fill="url(#windowGlass)" stroke="#3d6b4f" strokeWidth="2.5" />
      <line x1="290" y1="195" x2="290" y2="235" stroke="#3d6b4f" strokeWidth="1.5" />
      <line x1="265" y1="215" x2="315" y2="215" stroke="#3d6b4f" strokeWidth="1.5" />
      <g transform="translate(305, 175) rotate(-34)">
        <rect width="80" height="40" fill="#1f3a5f" stroke="#0f2440" strokeWidth="1.5" rx="2" />
        <line x1="0" y1="13" x2="80" y2="13" stroke="#3d5a8a" strokeWidth="0.5" />
        <line x1="0" y1="26" x2="80" y2="26" stroke="#3d5a8a" strokeWidth="0.5" />
        <line x1="27" y1="0" x2="27" y2="40" stroke="#3d5a8a" strokeWidth="0.5" />
        <line x1="53" y1="0" x2="53" y2="40" stroke="#3d5a8a" strokeWidth="0.5" />
      </g>
      <ellipse cx="450" cy="425" rx="32" ry="20" fill="#5a8a6a" opacity="0.85" />
      <ellipse cx="475" cy="430" rx="22" ry="14" fill="#4a7c5f" opacity="0.9" />
      <path d="M275 420 L235 510 L335 510 L315 420 Z" fill="#d8cfb3" opacity="0.7" />
    </svg>
  );
}
