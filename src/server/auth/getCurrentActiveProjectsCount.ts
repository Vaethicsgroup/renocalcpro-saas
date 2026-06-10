// src/server/auth/getCurrentActiveProjectsCount.ts
// SERVEUR — lecture du nombre de projets ACTIFS du compte courant
// (non ARCHIVED) pour le compteur freemium côté UI.
//
// ⚠️ Strictement serveur. Ne JAMAIS exposer cette fonction au client.
//
// Comportement v1 (étape F MVP freemium) :
//   1. lit la session NextAuth via `auth()`
//   2. charge la Membership du user → organizationId (1re)
//   3. count Project where organizationId = X AND status != ARCHIVED
//
// Posture FAIL-CLOSED côté FREEMIUM : tout chemin incertain retombe sur 0
// projet (la carte freemium affichera alors "1 projet gratuit restant" pour
// FREE, donc le maximum permis — pas de blocage abusif d'un utilisateur dont
// on ne sait pas s'il a déjà créé un projet). C'est le bon trade-off pour
// l'AFFICHAGE. Le GATE serveur (projectCreationGate.ts) fait son propre count,
// indépendant : si la DB échoue lors de la création, c'est lui qui décide.
//
// Ne throw jamais.

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";

export async function getCurrentActiveProjectsCount(): Promise<number> {
  try {
    const session = await auth();
    const userId =
      session && typeof session === "object" && "user" in session
        ? (session as { user?: { id?: string | null } | null }).user?.id ?? null
        : null;

    if (!userId) {
      return 0;
    }

    const membership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { invitedAt: "asc" },
      select: { organizationId: true },
    });

    if (!membership || !membership.organizationId) {
      return 0;
    }

    // count(Project) where organization = X AND status != ARCHIVED.
    // Prisma `count` retourne un number directement.
    const count = await prisma.project.count({
      where: {
        organizationId: membership.organizationId,
        NOT: { status: "ARCHIVED" },
      },
    });

    // Garde-fou : `count` peut être undefined si mock Prisma rudimentaire.
    return typeof count === "number" && Number.isFinite(count) && count >= 0
      ? count
      : 0;
  } catch {
    // Fail-soft pour l'AFFICHAGE — voir commentaire en tête de fichier.
    return 0;
  }
}
