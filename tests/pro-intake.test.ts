// tests/pro-intake.test.ts
// ════════════════════════════════════════════════════════════════════════════
// Tests des utilitaires purs de l'intake pro (load/save/clear/isValid).
// On utilise un mock localStorage in-memory + flags throw pour simuler les
// erreurs (private mode, quota).
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import {
  PRO_INTAKE_KEY,
  PRO_INTAKE_VERSION,
  isValidProIntake,
  loadProIntake,
  saveProIntake,
  clearProIntake,
  type ProIntakeData,
} from "@/lib/profiles/pro-intake";

interface MockStorage extends Storage {
  __throwOnSet?: boolean;
  __throwOnGet?: boolean;
  __throwOnRemove?: boolean;
}

function createMockStorage(): MockStorage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((this as any).__throwOnGet) throw new Error("DOMException");
      return data.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((this as any).__throwOnRemove) throw new Error("DOMException");
      data.delete(key);
    },
    setItem(key: string, value: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((this as any).__throwOnSet) throw new Error("QuotaExceededError");
      data.set(key, value);
    },
  } as MockStorage;
}

function makeValidIntake(overrides: Partial<ProIntakeData> = {}): ProIntakeData {
  return {
    version: PRO_INTAKE_VERSION,
    createdAt: "2026-06-10T10:00:00.000Z",
    dossierName: "Audit Maison Martin",
    missionType: "AUDIT_ENERGETIQUE",
    clientContext: "PARTICULIER",
    priority: "NORMAL",
    clientName: "Pierre Martin",
    propertyAddress: "12 rue de la République",
    propertyPostalCode: "13100",
    propertyCity: "Aix-en-Provence",
    ...overrides,
  };
}

describe("isValidProIntake", () => {
  it("accepte un payload valide minimal", () => {
    expect(isValidProIntake(makeValidIntake())).toBe(true);
  });

  it("rejette null/undefined/primitives", () => {
    expect(isValidProIntake(null)).toBe(false);
    expect(isValidProIntake(undefined)).toBe(false);
    expect(isValidProIntake("string")).toBe(false);
    expect(isValidProIntake(42)).toBe(false);
    expect(isValidProIntake([])).toBe(false);
  });

  it("rejette version inconnue", () => {
    expect(
      isValidProIntake(makeValidIntake({ version: 0 as never })),
    ).toBe(false);
    expect(
      isValidProIntake(makeValidIntake({ version: 99 as never })),
    ).toBe(false);
    expect(
      isValidProIntake(makeValidIntake({ version: "1" as never })),
    ).toBe(false);
  });

  it("rejette si champs requis manquent", () => {
    expect(
      isValidProIntake(makeValidIntake({ dossierName: undefined as never })),
    ).toBe(false);
    expect(
      isValidProIntake(makeValidIntake({ clientName: undefined as never })),
    ).toBe(false);
    expect(
      isValidProIntake(makeValidIntake({ propertyAddress: undefined as never })),
    ).toBe(false);
    expect(
      isValidProIntake(makeValidIntake({ propertyPostalCode: undefined as never })),
    ).toBe(false);
    expect(
      isValidProIntake(makeValidIntake({ propertyCity: undefined as never })),
    ).toBe(false);
  });

  it("accepte les champs optionnels", () => {
    expect(
      isValidProIntake(
        makeValidIntake({
          clientEmail: "client@example.fr",
          clientPhone: "06 12 34 56 78",
          notes: "Notes internes",
        }),
      ),
    ).toBe(true);
  });
});

describe("saveProIntake / loadProIntake", () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("save puis load = même payload", () => {
    const payload = makeValidIntake();
    expect(saveProIntake(storage, payload)).toBe("ok");
    const loaded = loadProIntake(storage);
    expect(loaded).not.toBeNull();
    expect(loaded?.dossierName).toBe("Audit Maison Martin");
    expect(loaded?.missionType).toBe("AUDIT_ENERGETIQUE");
    expect(loaded?.propertyPostalCode).toBe("13100");
  });

  it("load retourne null si clé absente", () => {
    expect(loadProIntake(storage)).toBeNull();
  });

  it("save retourne error si storage null", () => {
    expect(saveProIntake(null, makeValidIntake())).toBe("error");
  });

  it("save retourne error si storage throw (quota / private mode)", () => {
    storage.__throwOnSet = true;
    expect(saveProIntake(storage, makeValidIntake())).toBe("error");
  });

  it("load retourne null si JSON corrompu", () => {
    storage.setItem(PRO_INTAKE_KEY, "{not json");
    expect(loadProIntake(storage)).toBeNull();
  });

  it("load retourne null si version inconnue (forward-compat)", () => {
    storage.setItem(
      PRO_INTAKE_KEY,
      JSON.stringify({ ...makeValidIntake(), version: 999 }),
    );
    expect(loadProIntake(storage)).toBeNull();
  });

  it("load ne throw pas si getItem throw", () => {
    storage.__throwOnGet = true;
    expect(() => loadProIntake(storage)).not.toThrow();
    expect(loadProIntake(storage)).toBeNull();
  });
});

describe("clearProIntake", () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("supprime la clé existante", () => {
    saveProIntake(storage, makeValidIntake());
    expect(storage.getItem(PRO_INTAKE_KEY)).not.toBeNull();
    clearProIntake(storage);
    expect(storage.getItem(PRO_INTAKE_KEY)).toBeNull();
  });

  it("ne throw pas si clé absente", () => {
    expect(() => clearProIntake(storage)).not.toThrow();
  });

  it("ne throw pas si storage null", () => {
    expect(() => clearProIntake(null)).not.toThrow();
  });

  it("ne throw pas si removeItem throw", () => {
    storage.__throwOnRemove = true;
    expect(() => clearProIntake(storage)).not.toThrow();
  });
});

describe("Scénario intégration : intake → wizard consume", () => {
  it("cycle complet : save → load → clear, le wizard ne re-lit pas après clear", () => {
    const storage = createMockStorage();
    const payload = makeValidIntake({
      dossierName: "Audit Copro Tilleuls",
      clientName: "Foncia Aix",
      clientContext: "COPRO",
      priority: "HIGH",
      propertyAddress: "15 avenue Mozart",
      propertyPostalCode: "13090",
      propertyCity: "Aix-en-Provence",
    });

    // 1. Sauvegarde côté intake form
    expect(saveProIntake(storage, payload)).toBe("ok");

    // 2. Le wizard lit l'intake au mount
    const loaded = loadProIntake(storage);
    expect(loaded).not.toBeNull();
    expect(loaded?.dossierName).toBe("Audit Copro Tilleuls");
    expect(loaded?.clientName).toBe("Foncia Aix");

    // 3. Le wizard consomme et supprime l'intake
    clearProIntake(storage);

    // 4. Re-mount → plus de pré-remplissage
    expect(loadProIntake(storage)).toBeNull();
  });
});
