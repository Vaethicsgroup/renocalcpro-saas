// lib/abtest/heroVariant.ts
// Helper d'attribution A/B variant 50/50 par segment, persistant via cookie.
// Tracking via Plausible custom event "ab_variant_assigned".

import { cookies } from "next/headers";

export type HeroVariant = "A" | "B";
export type LandingSegment = "auditeurs" | "diagnostiqueurs" | "copropriete" | "particuliers";

const COOKIE_PREFIX = "renocal.abv.";
const COOKIE_TTL_SEC = 90 * 24 * 3600;  // 90 jours

/**
 * Récupère ou assigne la variante hero pour un segment.
 * Server component compatible (utilise next/headers cookies).
 */
export async function getOrAssignHeroVariant(segment: LandingSegment): Promise<HeroVariant> {
  const store = await cookies();
  const cookieName = `${COOKIE_PREFIX}${segment}`;
  const existing = store.get(cookieName)?.value;

  if (existing === "A" || existing === "B") {
    return existing;
  }

  // Assignation random 50/50, persistante
  const variant: HeroVariant = Math.random() < 0.5 ? "A" : "B";
  store.set(cookieName, variant, {
    maxAge: COOKIE_TTL_SEC,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return variant;
}

/**
 * Variants hero définis par segment.
 * Permet de comparer empiriquement quel ton convertit le mieux.
 */
export const HERO_VARIANTS: Record<LandingSegment, Record<HeroVariant, { title: string; subtitle: string; ctaPrimary: string }>> = {
  auditeurs: {
    A: {
      title: "Vos audits OPQIBI en 4 minutes au lieu de 4 heures",
      subtitle: "Plateforme dédiée aux auditeurs énergétiques certifiés. Conforme arrêté 4 mai 2022. Mode complet 24-36 pages. Hébergé en France.",
      ctaPrimary: "Essai gratuit 14 jours",
    },
    B: {
      title: "Le seul logiciel d'audit conçu par des auditeurs",
      subtitle: "Templates conformes, calculs opposables, interface optimisée terrain. Rejoignez les 200+ cabinets qui nous ont déjà fait confiance.",
      ctaPrimary: "Démarrer maintenant",
    },
  },
  diagnostiqueurs: {
    A: {
      title: "DPE collectif conforme AFNOR en moins de temps",
      subtitle: "Plateforme certifiée pour diagnostiqueurs immobiliers AFNOR. Méthode 3CL-DPE 2021, opposable juridiquement. Hébergement HDS France.",
      ctaPrimary: "Essai gratuit 14 jours",
    },
    B: {
      title: "Multipliez par 2 votre productivité DPE collectif",
      subtitle: "Plus rapide, plus précis, plus opposable. Ce que les diagnostiqueurs nous demandent depuis 5 ans, on l'a fait.",
      ctaPrimary: "Voir comment",
    },
  },
  copropriete: {
    A: {
      title: "Préparez votre vote en AG en 1 semaine",
      subtitle: "Audit copropriété conforme article L 731-1 du CCH. Résolution AG prête à voter. Tableau d'appels de fonds par tantième.",
      ctaPrimary: "Démarrer un audit",
    },
    B: {
      title: "Votre copropriété mérite mieux qu'un PDF de 50 pages",
      subtitle: "Audit clair, résolution AG prête à voter, plan de financement compréhensible par tous les copropriétaires. La rénovation énergétique simplifiée.",
      ctaPrimary: "Découvrir l'audit",
    },
  },
  particuliers: {
    A: {
      title: "Combien vous coûteraient vos travaux d'isolation ?",
      subtitle: "Calculez en 4 minutes le montant de vos aides MaPrimeRénov', les économies d'énergie attendues et le retour sur investissement. Sans engagement.",
      ctaPrimary: "Calculer gratuitement",
    },
    B: {
      title: "Économisez jusqu'à 60 % sur votre facture chauffage",
      subtitle: "Découvrez quels travaux sont vraiment rentables pour VOTRE maison, dans le bon ordre. Estimation MaPrimeRénov' incluse.",
      ctaPrimary: "Voir mes économies",
    },
  },
};
