// src/lib/project-summary/project-narrative.ts
// ════════════════════════════════════════════════════════════════════════════
// Génération d'un résumé narratif d'un projet de rénovation énergétique.
//
// PRINCIPES :
//   - Lib PURE : pas d'I/O, pas d'imports next-intl. Le translator `t` est
//     injecté via `options.t`. UI fournit `useTranslations()`, tests fournissent
//     un faux.
//   - HONNÊTETÉ : si une donnée est inconnue, on dit "à confirmer" plutôt que
//     d'inventer. Chaque champ manquant alimente `confidenceNotes[]`.
//   - DÉTERMINISTE : pas d'IA, pas d'aléa. Mêmes inputs → mêmes outputs.
//   - 3 TONS : client / professional / technical adaptent vocabulaire et
//     priorisation.
//   - FAIL-SAFE : si une donnée plante (toString sur null, etc.), on tombe
//     proprement sur "à confirmer".
//
// NON-PORTÉE :
//   - Aucun rendu PDF ici (interdit dans ce lot).
//   - Aucun appel moteur calc.
//   - Pas de prise de décision réglementaire.
// ════════════════════════════════════════════════════════════════════════════

/** Translator injecté par l'appelant. Compatible useTranslations() de next-intl. */
export type Translator = (key: string, params?: Record<string, unknown>) => string;

/** Ton du résumé. */
export type NarrativeTone = "client" | "professional" | "technical";

/** Notes de visite saisies par l'utilisateur — toutes optionnelles. */
export interface VisitNotes {
  general?: string;
  walls?: string;
  roof?: string;
  floor?: string;
  openings?: string;
  heating?: string;
  dhw?: string;
  ventilation?: string;
  garageOrUnheatedRooms?: string;
  humidity?: string;
  comfort?: string;
  priorities?: string;
}

/** Niveau d'isolation déclaré. */
export type InsulationLevel = "none" | "partial" | "good" | "unknown";

/** Type de bien. */
export type BuildingType = "maison" | "appartement" | "tertiaire" | "copropriete";

/** Scénario de rénovation recommandé (forme minimale). */
export interface RecommendedScenario {
  name: string;
  /** Étiquette DPE après travaux (A-G). */
  dpeAfter?: string;
  /** Coût indicatif TTC. */
  costEur?: number;
}

/** Entrées techniques du projet — toutes optionnelles (rapport pré-visite). */
export interface ProjectNarrativeInputs {
  buildingType?: BuildingType;
  constructionYear?: number;
  surfaceHabitableM2?: number;
  city?: string;
  climateZone?: string;

  // Systèmes
  heatingSystem?: string;
  heatingEnergy?: string;
  dhwSystem?: string;
  ventilationSystem?: string;

  // Enveloppe
  windowsType?: string;
  wallsType?: string;
  roofType?: string;
  floorType?: string;
  wallsInsulation?: InsulationLevel;
  roofInsulation?: InsulationLevel;
  floorInsulation?: InsulationLevel;

  // Annexes
  hasAttachedGarage?: boolean;
  hasUnheatedRoom?: boolean;
  hasAtticAccess?: boolean;

  // Recommandations issues du moteur (si déjà calculées)
  recommendedScenarios?: RecommendedScenario[];
}

/** Options de génération. */
export interface NarrativeOptions {
  tone: NarrativeTone;
  includeUncertaintyNotes: boolean;
  locale: string;
  t: Translator;
}

/** Résultat. */
export interface ProjectNarrativeSummary {
  title: string;
  propertyOverview: string;
  systemsOverview: string;
  envelopeOverview: string;
  visitObservations: string;
  renovationPriorities: string;
  disclaimers: string[];
  confidenceNotes: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS PURS
// ────────────────────────────────────────────────────────────────────────────

const NS = "projectSummary";
const k = (suffix: string) => `${NS}.${suffix}`;

/** Concatène des fragments non vides séparés par un espace, en évitant doublons. */
function joinParts(parts: ReadonlyArray<string | null | undefined>): string {
  return parts
    .map(p => (typeof p === "string" ? p.trim() : ""))
    .filter(p => p.length > 0)
    .join(" ");
}

/** Trim string, retourne undefined si vide. */
function trimOrUndef(s: string | null | undefined): string | undefined {
  if (typeof s !== "string") return undefined;
  const v = s.trim();
  return v.length === 0 ? undefined : v;
}

/** True si la valeur est exploitable (non vide). */
function present<T>(v: T | null | undefined): v is T {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

/** Map InsulationLevel → token i18n. */
function insulationToken(level: InsulationLevel | undefined): string {
  switch (level) {
    case "none":    return "insulation.none";
    case "partial": return "insulation.partial";
    case "good":    return "insulation.good";
    default:        return "insulation.unknown";
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GÉNÉRATEUR PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────

export function generateProjectNarrativeSummary(
  inputs: ProjectNarrativeInputs | null | undefined,
  visitNotes: VisitNotes | null | undefined,
  options: NarrativeOptions,
): ProjectNarrativeSummary {
  const safe = inputs ?? {};
  const notes = visitNotes ?? {};
  const { t, tone, includeUncertaintyNotes } = options;

  const confidenceNotes: string[] = [];
  const noteIfMissing = (token: string) => {
    confidenceNotes.push(t(k(token)));
  };

  // ─── TITRE ────────────────────────────────────────────────────────────────
  const buildingTypeLabel = safe.buildingType
    ? t(k(`buildingType.${safe.buildingType}`))
    : t(k("buildingType.unknown"));

  const yearOrTbd = safe.constructionYear
    ? String(safe.constructionYear)
    : t(k("tbd"));

  const cityOrTbd = present(safe.city)
    ? safe.city
    : t(k("tbd"));

  const title = t(k(`title.${tone}`), {
    buildingType: buildingTypeLabel,
    year: yearOrTbd,
    city: cityOrTbd,
  });

  // ─── PROPRIÉTÉ ────────────────────────────────────────────────────────────
  const propertyParts: Array<string | undefined> = [
    t(k("property.intro"), { buildingType: buildingTypeLabel }),
    safe.surfaceHabitableM2 != null
      ? t(k("property.surface"), { m2: safe.surfaceHabitableM2 })
      : (() => { noteIfMissing("confidence.surface"); return includeUncertaintyNotes ? t(k("property.surfaceTbd")) : undefined; })(),
    safe.constructionYear != null
      ? t(k("property.year"), { year: safe.constructionYear })
      : (() => { noteIfMissing("confidence.year"); return includeUncertaintyNotes ? t(k("property.yearTbd")) : undefined; })(),
    present(safe.city)
      ? t(k("property.city"), { city: safe.city })
      : undefined,
    present(safe.climateZone)
      ? t(k("property.climate"), { zone: safe.climateZone })
      : undefined,
  ];
  const propertyOverview = joinParts(propertyParts);

  // ─── SYSTÈMES ─────────────────────────────────────────────────────────────
  const systemsParts: Array<string | undefined> = [];
  if (present(safe.heatingSystem)) {
    const energyPart = present(safe.heatingEnergy)
      ? t(k("systems.heatingWithEnergy"), { system: safe.heatingSystem, energy: safe.heatingEnergy })
      : t(k("systems.heating"), { system: safe.heatingSystem });
    systemsParts.push(energyPart);
  } else {
    noteIfMissing("confidence.heating");
    if (includeUncertaintyNotes) systemsParts.push(t(k("systems.heatingTbd")));
  }

  if (present(safe.dhwSystem)) {
    systemsParts.push(t(k("systems.dhw"), { system: safe.dhwSystem }));
  } else {
    noteIfMissing("confidence.dhw");
    if (includeUncertaintyNotes) systemsParts.push(t(k("systems.dhwTbd")));
  }

  if (present(safe.ventilationSystem)) {
    systemsParts.push(t(k("systems.ventilation"), { system: safe.ventilationSystem }));
  } else {
    noteIfMissing("confidence.ventilation");
    if (includeUncertaintyNotes) systemsParts.push(t(k("systems.ventilationTbd")));
  }
  const systemsOverview = joinParts(systemsParts);

  // ─── ENVELOPPE ────────────────────────────────────────────────────────────
  const envelopeParts: Array<string | undefined> = [];

  // Murs
  if (present(safe.wallsType) || safe.wallsInsulation) {
    const wallsType = present(safe.wallsType) ? safe.wallsType : t(k("envelope.wallsUnknownType"));
    envelopeParts.push(
      t(k("envelope.walls"), {
        type: wallsType,
        insulation: t(k(insulationToken(safe.wallsInsulation))),
      }),
    );
    if (!safe.wallsInsulation || safe.wallsInsulation === "unknown") {
      noteIfMissing("confidence.wallsInsulation");
    }
  } else {
    noteIfMissing("confidence.walls");
    if (includeUncertaintyNotes) envelopeParts.push(t(k("envelope.wallsTbd")));
  }

  // Toiture
  if (present(safe.roofType) || safe.roofInsulation) {
    const roofType = present(safe.roofType) ? safe.roofType : t(k("envelope.roofUnknownType"));
    envelopeParts.push(
      t(k("envelope.roof"), {
        type: roofType,
        insulation: t(k(insulationToken(safe.roofInsulation))),
      }),
    );
    if (!safe.roofInsulation || safe.roofInsulation === "unknown") {
      noteIfMissing("confidence.roofInsulation");
    }
  } else {
    noteIfMissing("confidence.roof");
    if (includeUncertaintyNotes) envelopeParts.push(t(k("envelope.roofTbd")));
  }

  // Plancher
  if (present(safe.floorType) || safe.floorInsulation) {
    const floorType = present(safe.floorType) ? safe.floorType : t(k("envelope.floorUnknownType"));
    envelopeParts.push(
      t(k("envelope.floor"), {
        type: floorType,
        insulation: t(k(insulationToken(safe.floorInsulation))),
      }),
    );
    if (!safe.floorInsulation || safe.floorInsulation === "unknown") {
      noteIfMissing("confidence.floorInsulation");
    }
  } else {
    noteIfMissing("confidence.floor");
    if (includeUncertaintyNotes) envelopeParts.push(t(k("envelope.floorTbd")));
  }

  // Menuiseries
  if (present(safe.windowsType)) {
    envelopeParts.push(t(k("envelope.windows"), { type: safe.windowsType }));
  } else {
    noteIfMissing("confidence.windows");
    if (includeUncertaintyNotes) envelopeParts.push(t(k("envelope.windowsTbd")));
  }

  // Garage / local non chauffé / combles
  if (safe.hasAttachedGarage) {
    envelopeParts.push(t(k("envelope.attachedGarage")));
  }
  if (safe.hasUnheatedRoom) {
    envelopeParts.push(t(k("envelope.unheatedRoom")));
  }
  if (safe.hasAtticAccess) {
    envelopeParts.push(t(k("envelope.atticAccess")));
  }

  const envelopeOverview = joinParts(envelopeParts);

  // ─── OBSERVATIONS DE VISITE ───────────────────────────────────────────────
  const obsParts: Array<string | undefined> = [];
  const addObs = (labelKey: string, value: string | undefined) => {
    const v = trimOrUndef(value);
    if (v) obsParts.push(t(k(labelKey), { value: v }));
  };
  addObs("obs.general",                notes.general);
  addObs("obs.walls",                  notes.walls);
  addObs("obs.roof",                   notes.roof);
  addObs("obs.floor",                  notes.floor);
  addObs("obs.openings",               notes.openings);
  addObs("obs.heating",                notes.heating);
  addObs("obs.dhw",                    notes.dhw);
  addObs("obs.ventilation",            notes.ventilation);
  addObs("obs.garageOrUnheatedRooms",  notes.garageOrUnheatedRooms);
  addObs("obs.humidity",               notes.humidity);
  addObs("obs.comfort",                notes.comfort);
  // Note : `priorities` est routé vers la section dédiée plus bas.

  const visitObservations = obsParts.length > 0
    ? joinParts(obsParts)
    : t(k("obs.empty"));

  // ─── PRIORITÉS DE RÉNOVATION ──────────────────────────────────────────────
  const prioParts: Array<string | undefined> = [];

  const userPriorities = trimOrUndef(notes.priorities);
  if (userPriorities) {
    prioParts.push(t(k("priorities.userIntro"), { value: userPriorities }));
  }

  let scenarioRendered = false;
  if (Array.isArray(safe.recommendedScenarios) && safe.recommendedScenarios.length > 0) {
    const top = safe.recommendedScenarios[0];
    if (top && present(top.name)) {
      const dpe = present(top.dpeAfter) ? top.dpeAfter : t(k("tbd"));
      const cost = top.costEur != null ? String(top.costEur) : t(k("tbd"));
      prioParts.push(
        t(k(`priorities.topScenario.${tone}`), {
          name: top.name,
          dpe,
          cost,
        }),
      );
      scenarioRendered = true;
    }
  }

  // Si aucune priorité utilisateur ET aucun scénario rendu → fallback "empty".
  if (!userPriorities && !scenarioRendered) {
    prioParts.push(t(k("priorities.empty")));
  }

  const renovationPriorities = joinParts(prioParts);

  // ─── DISCLAIMERS ──────────────────────────────────────────────────────────
  const disclaimers: string[] = [
    t(k("disclaimers.indicative")),
    t(k("disclaimers.notAudit3CL")),
  ];
  if (confidenceNotes.length > 0) {
    disclaimers.push(t(k("disclaimers.dataToConfirm")));
  }

  return {
    title,
    propertyOverview,
    systemsOverview,
    envelopeOverview,
    visitObservations,
    renovationPriorities,
    disclaimers,
    confidenceNotes,
  };
}

/** Sérialise un résumé en une chaîne unique éditable / copiable. */
export function serializeNarrativeToText(
  summary: ProjectNarrativeSummary,
  options: { t: Translator },
): string {
  const t = options.t;
  const sections = [
    `# ${summary.title}`,
    "",
    `## ${t(k("section.property"))}`,
    summary.propertyOverview,
    "",
    `## ${t(k("section.systems"))}`,
    summary.systemsOverview,
    "",
    `## ${t(k("section.envelope"))}`,
    summary.envelopeOverview,
    "",
    `## ${t(k("section.observations"))}`,
    summary.visitObservations,
    "",
    `## ${t(k("section.priorities"))}`,
    summary.renovationPriorities,
    "",
    `## ${t(k("section.disclaimers"))}`,
    ...summary.disclaimers.map(d => `- ${d}`),
  ];
  if (summary.confidenceNotes.length > 0) {
    sections.push("", `## ${t(k("section.confidence"))}`);
    for (const c of summary.confidenceNotes) sections.push(`- ${c}`);
  }
  return sections.join("\n");
}
