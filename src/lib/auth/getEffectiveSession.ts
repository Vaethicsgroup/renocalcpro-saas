// lib/auth/getEffectiveSession.ts
// Wrapper autour de auth() qui applique l'impersonification si active.
// Renvoie session.user comme étant le user impersonné, et expose
// session.impersonatedBy avec l'identité réelle de l'admin.
//
// À utiliser PARTOUT dans les Server Components et Server Actions à la place
// d'auth() direct, sauf dans les pages /admin/ où on veut l'identité admin réelle.

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/client";
import { cookies } from "next/headers";
import { IMPERSONATION_COOKIE, verifyImpersonationToken } from "./impersonate";

export interface EffectiveSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  /** Si présent, c'est l'admin réel qui se fait passer pour user. */
  impersonatedBy?: {
    adminUserId: string;
    impersonationId: string;
    expiresAt: Date;
  };
}

export async function getEffectiveSession(): Promise<EffectiveSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const baseSession: EffectiveSession = {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
    },
  };

  // Vérifie un cookie d'impersonification valide
  const cookieStore = await cookies();
  const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  const impersonationId = verifyImpersonationToken(token);
  if (!impersonationId) return baseSession;

  const imp = await prisma.impersonation.findUnique({
    where: { id: impersonationId },
  });
  if (!imp || imp.endedAt || imp.expiresAt < new Date()) return baseSession;

  // Sécurité : seul l'admin originel peut continuer à utiliser SA session impersonifiée
  if (imp.adminUserId !== session.user.id) return baseSession;

  const target = await prisma.user.findUnique({
    where: { id: imp.targetUserId },
    select: { id: true, email: true, fullName: true, avatarUrl: true },
  });
  if (!target) return baseSession;

  return {
    user: {
      id: target.id,
      email: target.email,
      name: target.fullName,
      image: target.avatarUrl,
    },
    impersonatedBy: {
      adminUserId: imp.adminUserId,
      impersonationId: imp.id,
      expiresAt: imp.expiresAt,
    },
  };
}
