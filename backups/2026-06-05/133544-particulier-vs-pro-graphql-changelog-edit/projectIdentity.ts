// src/server/actions/projectIdentity.ts
// ════════════════════════════════════════════════════════════════════════════
// Server actions pour la modification de l'identité projet côté espace Pro :
//   - coordonnées client (nom, email, téléphone, adresse du bien)
//   - statut de propriété (occupant / bailleur / SCI / indivision…)
//   - notes internes auditeur
//
// Persistance : champs natifs du modèle Prisma `Project` (name, clientName,
// address). Champs étendus (firstName/lastName/phone séparés, ownershipKind,
// etc.) à migrer en colonne JSON `extraData` lors d'une prochaine migration.
//
// Ne touche pas à Prisma (pas de migration ici) — utilise les colonnes
// existantes du modèle Project.
// ════════════════════════════════════════════════════════════════════════════

"use server";

import { prisma } from "@/lib/db/client";

export interface UpdateProjectIdentityInput {
  projectId: string;
  organizationId: string;
  /** Coordonnées client. */
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyAddress: string;
  propertyPostalCode: string;
  propertyCity: string;
  /** Statut de propriété. */
  ownershipKind: string;
  legalEntityName?: string;
  siret?: string;
  /** Notes internes auditeur. */
  internalNotes?: string;
}

export interface UpdateProjectIdentityResult {
  ok: boolean;
  message: string;
  projectId?: string;
}

/**
 * Met à jour l'identité d'un projet existant. Mappage minimal vers le schéma
 * Prisma actuel :
 *   - clientName = "Prénom Nom"
 *   - address = "rue, CP ville"
 * Les champs étendus (ownership, email, phone, etc.) sont sérialisés dans
 * `description` au format JSON tant qu'il n'y a pas de champ dédié.
 *
 * @returns un statut compréhensible pour l'UI (succès, erreur DB, project non trouvé).
 */
export async function updateProjectIdentity(
  input: UpdateProjectIdentityInput,
): Promise<UpdateProjectIdentityResult> {
  // Vérifier accessibilité (sécurité : projet doit appartenir à l'organisation)
  let project;
  try {
    project = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId: input.organizationId },
    });
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error && err.message.includes("Database")
          ? "Base de données indisponible — modifications non sauvegardées."
          : "Erreur lors de la vérification du projet.",
    };
  }
  if (!project) {
    return { ok: false, message: "Projet introuvable ou accès refusé." };
  }

  // Construction des données natives
  const clientName = `${input.firstName} ${input.lastName}`.trim();

  // Métadonnées étendues sérialisées dans `clientNotes` (compat schéma actuel).
  // Migrer dans une colonne JSON dédiée lors d'une future évolution Prisma.
  const extendedMeta = {
    schemaVersion: "2.3",
    propertyAddress: input.propertyAddress,
    propertyPostalCode: input.propertyPostalCode,
    propertyCity: input.propertyCity,
    ownershipKind: input.ownershipKind,
    legalEntityName: input.legalEntityName,
    siret: input.siret,
    internalNotes: input.internalNotes,
    updatedAt: new Date().toISOString(),
  };

  try {
    await prisma.project.update({
      where: { id: input.projectId },
      data: {
        clientName,
        clientEmail: input.email,
        clientPhone: input.phone,
        clientNotes: JSON.stringify(extendedMeta),
      },
    });
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? `Échec persistance : ${err.message}`
          : "Échec persistance — réessayez.",
    };
  }

  return {
    ok: true,
    message: `Dossier "${clientName}" mis à jour avec succès.`,
    projectId: input.projectId,
  };
}
