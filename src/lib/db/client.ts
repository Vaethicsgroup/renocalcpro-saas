// src/lib/db/client.ts
// Singleton Prisma + extension multi-tenant.
// v2.5 — MOCK SAFE en dev local si DATABASE_URL absent (évite crash init Prisma).

import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const orgContext = new AsyncLocalStorage<{ organizationId: string }>();

const TENANT_MODELS = new Set([
  "Project", "Building", "Envelope", "System", "Scenario", "Intervention",
  "Aid", "Photo", "Report", "AuditLog", "Subscription", "Membership",
]);

/**
 * Mock Prisma : Proxy qui retourne des stubs pour TOUTES les méthodes.
 * Les opérations de lecture renvoient [] ou null.
 * Les opérations d'écriture renvoient un objet vide.
 * Utilisé quand DATABASE_URL est absent pour ne PAS planter le démarrage dev.
 */
function createMockPrisma(): PrismaClient {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      // $extends, $connect, $disconnect, $transaction, $queryRaw, etc.
      if (typeof prop === "string" && prop.startsWith("$")) {
        if (prop === "$extends") {
          return (..._args: unknown[]) => mock; // chain return self
        }
        return async () => undefined;
      }
      // Modèle (User, Organization, Project, ...) → renvoie un sous-proxy
      return new Proxy({}, {
        get(_t, op) {
          // findMany/findFirst/findUnique
          if (op === "findMany") return async () => [];
          if (op === "findFirst" || op === "findUnique") return async () => null;
          if (op === "count") return async () => 0;
          if (op === "aggregate") return async () => ({ _count: 0 });
          if (op === "groupBy") return async () => [];
          // create / update / delete / upsert
          if (op === "create" || op === "update" || op === "upsert") return async (args: { data?: unknown } = {}) => ({ id: "mock", ...(args.data as object ?? {}) });
          if (op === "delete") return async () => ({ id: "mock" });
          if (op === "createMany" || op === "updateMany" || op === "deleteMany") return async () => ({ count: 0 });
          return async () => undefined;
        },
      });
    },
  };
  const mock = new Proxy({}, handler) as unknown as PrismaClient;
  return mock;
}

function basePrisma(): PrismaClient {
  // Si DATABASE_URL absent en dev → mock safe, sinon crée le vrai client
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[prisma] DATABASE_URL absent → mock Proxy actif (dev only).");
      return createMockPrisma();
    }
    // En prod, on laisse Prisma crash explicitement
  }
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["error", "warn"],
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[prisma] Init failed in dev → mock Proxy actif.", err);
      return createMockPrisma();
    }
    throw err;
  }
}

const _prisma = globalForPrisma.prisma ?? basePrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma;

// Extension : injection automatique du filtre tenant (skip si mock)
export const prisma = (typeof (_prisma as PrismaClient & { $extends?: unknown }).$extends === "function"
  ? _prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const ctx = orgContext.getStore();
            const isTenant = model && TENANT_MODELS.has(model);
            if (
              isTenant &&
              ctx?.organizationId &&
              ["findFirst", "findMany", "findUnique", "count", "aggregate", "groupBy", "deleteMany", "updateMany"].includes(operation)
            ) {
              // @ts-expect-error - merge dynamique
              args.where = { ...(args.where || {}), organizationId: ctx.organizationId };
            }
            if (
              isTenant &&
              ctx?.organizationId &&
              ["create"].includes(operation) &&
              // @ts-expect-error
              args.data && typeof args.data === "object" && !Array.isArray(args.data)
            ) {
              // @ts-expect-error
              if (!args.data.organizationId) args.data.organizationId = ctx.organizationId;
            }
            return query(args);
          },
        },
      },
    })
  : _prisma) as unknown as PrismaClient;

export async function withOrgContext<T>(
  organizationId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return orgContext.run({ organizationId }, fn);
}
