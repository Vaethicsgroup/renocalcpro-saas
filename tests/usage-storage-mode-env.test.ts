// tests/usage-storage-mode-env.test.ts — étape G
// Vérifie que `readStorageModeFromEnv` mappe correctement la variable
// d'environnement `USAGE_STORAGE` vers un mode de stockage valide.
// Posture FAIL-SAFE : tout cas inattendu retombe sur "memory".
//
// Test purement fonctionnel — pas d'effet de bord sur le mode actif du module
// (on injecte l'env dans la fonction).

import { describe, it, expect } from "vitest";
import { readStorageModeFromEnv } from "@/server/actions/usage";

describe("readStorageModeFromEnv — valeurs reconnues", () => {
  it("USAGE_STORAGE='prisma' → 'prisma'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "prisma" })).toBe("prisma");
  });
  it("USAGE_STORAGE='noop' → 'noop'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "noop" })).toBe("noop");
  });
  it("USAGE_STORAGE='memory' → 'memory' (explicite)", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "memory" })).toBe("memory");
  });
});

describe("readStorageModeFromEnv — normalisation", () => {
  it("USAGE_STORAGE='PRISMA' (uppercase) → 'prisma'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "PRISMA" })).toBe("prisma");
  });
  it("USAGE_STORAGE='  prisma  ' (espaces) → 'prisma'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "  prisma  " })).toBe(
      "prisma",
    );
  });
  it("USAGE_STORAGE='Prisma' (mixed case) → 'prisma'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "Prisma" })).toBe("prisma");
  });
});

describe("readStorageModeFromEnv — fail-safe sur valeurs invalides", () => {
  it("USAGE_STORAGE undefined → 'memory'", () => {
    expect(readStorageModeFromEnv({})).toBe("memory");
  });
  it("USAGE_STORAGE='' → 'memory'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "" })).toBe("memory");
  });
  it("USAGE_STORAGE='   ' (espaces seuls) → 'memory'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "   " })).toBe("memory");
  });
  it("USAGE_STORAGE='postgres' (non reconnu) → 'memory'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "postgres" })).toBe("memory");
  });
  it("USAGE_STORAGE='1' → 'memory'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "1" })).toBe("memory");
  });
  it("USAGE_STORAGE='true' → 'memory'", () => {
    expect(readStorageModeFromEnv({ USAGE_STORAGE: "true" })).toBe("memory");
  });
});

describe("readStorageModeFromEnv — par défaut (process.env réel)", () => {
  it("retourne un mode valide sans argument (lecture process.env)", () => {
    const mode = readStorageModeFromEnv();
    expect(["memory", "prisma", "noop"]).toContain(mode);
  });
});
