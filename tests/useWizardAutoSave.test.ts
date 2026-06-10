// tests/useWizardAutoSave.test.ts
// ════════════════════════════════════════════════════════════════════════════
// Tests des utilitaires purs du hook auto-save wizard.
// On ne teste pas le hook React lui-même (pas de jsdom configuré pour ce
// projet) : on cible les fonctions extraites (`buildAutoSaveKey`,
// `isValidPayload`, `loadAutoSavePayload`, `saveAutoSavePayload`,
// `clearAutoSavePayload`) qui sont 100 % de la logique critique.
//
// Pour simuler localStorage, on utilise un mock minimal de l'interface
// `Storage` (in-memory + Throwable flag pour simuler quota / Safari private).
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import {
  WIZARD_AUTOSAVE_VERSION,
  buildAutoSaveKey,
  isValidPayload,
  loadAutoSavePayload,
  saveAutoSavePayload,
  clearAutoSavePayload,
  type WizardAutoSavePayload,
} from "@/hooks/useWizardAutoSave";

// ────────────────────────────────────────────────────────────────────────────
// Mock localStorage
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────────────────────

function makeValidPayload(
  overrides: Partial<WizardAutoSavePayload> = {},
): WizardAutoSavePayload {
  return {
    version: WIZARD_AUTOSAVE_VERSION,
    savedAt: "2026-06-06T10:00:00.000Z",
    currentStep: 2,
    data: {
      // On garde des shapes simples — le hook ne valide pas le contenu
      // métier (c'est le rôle du moteur calc à la soumission).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form: { projectName: "Test wizard" } as any,
      location: {
        addressLabel: "12 rue de Paris",
        postalCode: "75001",
        city: "Paris",
        latitude: 48.8566,
        longitude: 2.3522,
      },
      customScenario: null,
    },
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("buildAutoSaveKey", () => {
  it("retourne la clé anonyme si pas d'userId", () => {
    expect(buildAutoSaveKey()).toBe("renocalc.wizard.anonymous");
    expect(buildAutoSaveKey(null)).toBe("renocalc.wizard.anonymous");
    expect(buildAutoSaveKey(undefined)).toBe("renocalc.wizard.anonymous");
    expect(buildAutoSaveKey("")).toBe("renocalc.wizard.anonymous");
  });

  it("retourne la clé scoped par userId", () => {
    expect(buildAutoSaveKey("usr_abc123")).toBe("renocalc.wizard.usr_abc123");
    expect(buildAutoSaveKey("clxyz9pq00012abcdef12345")).toBe(
      "renocalc.wizard.clxyz9pq00012abcdef12345",
    );
  });

  it("sanitise les caractères pathologiques", () => {
    expect(buildAutoSaveKey("user/with/slash")).toBe(
      "renocalc.wizard.userwithslash",
    );
    expect(buildAutoSaveKey("user; DROP TABLE--")).toBe(
      "renocalc.wizard.userDROPTABLE--",
    );
    // Caractères unicode exotiques retirés
    expect(buildAutoSaveKey("user🚀id")).toBe("renocalc.wizard.userid");
  });

  it("retombe sur anonymous si l'userId sanitisé est vide", () => {
    expect(buildAutoSaveKey("///")).toBe("renocalc.wizard.anonymous");
    expect(buildAutoSaveKey("🚀🚀🚀")).toBe("renocalc.wizard.anonymous");
  });

  it("tronque les userId très longs (>64 chars)", () => {
    const longId = "a".repeat(200);
    const key = buildAutoSaveKey(longId);
    expect(key.length).toBeLessThanOrEqual("renocalc.wizard.".length + 64);
  });
});

describe("isValidPayload", () => {
  it("accepte un payload valide", () => {
    expect(isValidPayload(makeValidPayload())).toBe(true);
  });

  it("rejette null/undefined/primitive", () => {
    expect(isValidPayload(null)).toBe(false);
    expect(isValidPayload(undefined)).toBe(false);
    expect(isValidPayload("string")).toBe(false);
    expect(isValidPayload(42)).toBe(false);
    expect(isValidPayload([])).toBe(false);
  });

  it("rejette une version inconnue", () => {
    expect(isValidPayload(makeValidPayload({ version: 0 as never }))).toBe(false);
    expect(isValidPayload(makeValidPayload({ version: 999 as never }))).toBe(
      false,
    );
    expect(isValidPayload(makeValidPayload({ version: "1" as never }))).toBe(
      false,
    );
  });

  it("rejette si savedAt manque ou n'est pas une string", () => {
    expect(isValidPayload(makeValidPayload({ savedAt: 123 as never }))).toBe(
      false,
    );
  });

  it("rejette si currentStep n'est pas un nombre fini", () => {
    expect(
      isValidPayload(makeValidPayload({ currentStep: "2" as never })),
    ).toBe(false);
    expect(
      isValidPayload(makeValidPayload({ currentStep: NaN as never })),
    ).toBe(false);
    expect(
      isValidPayload(makeValidPayload({ currentStep: Infinity as never })),
    ).toBe(false);
  });

  it("rejette si data.form ou data.location absent", () => {
    expect(
      isValidPayload(
        makeValidPayload({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { form: null, location: {}, customScenario: null } as any,
        }),
      ),
    ).toBe(false);
    expect(
      isValidPayload(
        makeValidPayload({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { form: {}, location: null, customScenario: null } as any,
        }),
      ),
    ).toBe(false);
  });

  it("accepte customScenario null", () => {
    expect(
      isValidPayload(makeValidPayload({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form: {} as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          location: {} as any,
          customScenario: null,
        },
      })),
    ).toBe(true);
  });

  it("rejette customScenario primitif non-null", () => {
    expect(
      isValidPayload(makeValidPayload({
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form: {} as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          location: {} as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customScenario: "expert" as any,
        },
      })),
    ).toBe(false);
  });
});

describe("loadAutoSavePayload", () => {
  let storage: MockStorage;
  const KEY = "renocalc.wizard.anonymous";

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("retourne null si storage est null/undefined", () => {
    expect(loadAutoSavePayload(null, KEY)).toBeNull();
    expect(loadAutoSavePayload(undefined, KEY)).toBeNull();
  });

  it("retourne null si la clé est absente", () => {
    expect(loadAutoSavePayload(storage, KEY)).toBeNull();
  });

  it("charge un payload valide", () => {
    const payload = makeValidPayload();
    storage.setItem(KEY, JSON.stringify(payload));
    const loaded = loadAutoSavePayload(storage, KEY);
    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe(WIZARD_AUTOSAVE_VERSION);
    expect(loaded?.currentStep).toBe(2);
    expect(loaded?.data.location.postalCode).toBe("75001");
  });

  it("retourne null sur JSON corrompu", () => {
    storage.setItem(KEY, "{not json");
    expect(loadAutoSavePayload(storage, KEY)).toBeNull();
  });

  it("retourne null si version inconnue (forward-compat)", () => {
    const future = JSON.stringify({
      ...makeValidPayload(),
      version: 99,
    });
    storage.setItem(KEY, future);
    expect(loadAutoSavePayload(storage, KEY)).toBeNull();
  });

  it("ne throw pas si storage.getItem throw", () => {
    storage.__throwOnGet = true;
    expect(() => loadAutoSavePayload(storage, KEY)).not.toThrow();
    expect(loadAutoSavePayload(storage, KEY)).toBeNull();
  });

  it("restaure correctement currentStep", () => {
    storage.setItem(KEY, JSON.stringify(makeValidPayload({ currentStep: 5 })));
    const loaded = loadAutoSavePayload(storage, KEY);
    expect(loaded?.currentStep).toBe(5);
  });
});

describe("saveAutoSavePayload", () => {
  let storage: MockStorage;
  const KEY = "renocalc.wizard.anonymous";

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("sauvegarde un payload valide → retourne ok", () => {
    const payload = makeValidPayload();
    expect(saveAutoSavePayload(storage, KEY, payload)).toBe("ok");
    const raw = storage.getItem(KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.version).toBe(WIZARD_AUTOSAVE_VERSION);
    expect(parsed.currentStep).toBe(2);
  });

  it("retourne error si storage est null", () => {
    expect(saveAutoSavePayload(null, KEY, makeValidPayload())).toBe("error");
  });

  it("retourne error si storage throw (quota / private mode)", () => {
    storage.__throwOnSet = true;
    expect(saveAutoSavePayload(storage, KEY, makeValidPayload())).toBe("error");
    // Aucune exception propagée
  });

  it("écrase un payload existant", () => {
    saveAutoSavePayload(storage, KEY, makeValidPayload({ currentStep: 1 }));
    saveAutoSavePayload(storage, KEY, makeValidPayload({ currentStep: 4 }));
    const loaded = loadAutoSavePayload(storage, KEY);
    expect(loaded?.currentStep).toBe(4);
  });
});

describe("clearAutoSavePayload", () => {
  let storage: MockStorage;
  const KEY = "renocalc.wizard.anonymous";

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("supprime la clé existante", () => {
    saveAutoSavePayload(storage, KEY, makeValidPayload());
    expect(storage.getItem(KEY)).not.toBeNull();
    clearAutoSavePayload(storage, KEY);
    expect(storage.getItem(KEY)).toBeNull();
  });

  it("ne throw pas si la clé est absente", () => {
    expect(() => clearAutoSavePayload(storage, KEY)).not.toThrow();
  });

  it("ne throw pas si storage est null", () => {
    expect(() => clearAutoSavePayload(null, KEY)).not.toThrow();
  });

  it("ne throw pas si storage.removeItem throw", () => {
    storage.__throwOnRemove = true;
    expect(() => clearAutoSavePayload(storage, KEY)).not.toThrow();
  });
});

describe("Scénario d'intégration : cycle complet", () => {
  it("save → load → modify → save → load → clear", () => {
    const storage = createMockStorage();
    const userId = "user_abc";
    const key = buildAutoSaveKey(userId);

    // 1. Premier save
    expect(saveAutoSavePayload(storage, key, makeValidPayload({ currentStep: 0 }))).toBe(
      "ok",
    );

    // 2. Load
    const first = loadAutoSavePayload(storage, key);
    expect(first?.currentStep).toBe(0);

    // 3. Modification + nouveau save
    expect(
      saveAutoSavePayload(storage, key, makeValidPayload({ currentStep: 3 })),
    ).toBe("ok");

    // 4. Load à nouveau
    const second = loadAutoSavePayload(storage, key);
    expect(second?.currentStep).toBe(3);

    // 5. Clear
    clearAutoSavePayload(storage, key);
    expect(loadAutoSavePayload(storage, key)).toBeNull();
  });

  it("ne pollue pas les clés anonymes/scoped", () => {
    const storage = createMockStorage();
    saveAutoSavePayload(
      storage,
      buildAutoSaveKey("user_a"),
      makeValidPayload({ currentStep: 1 }),
    );
    saveAutoSavePayload(
      storage,
      buildAutoSaveKey(null),
      makeValidPayload({ currentStep: 7 }),
    );

    expect(
      loadAutoSavePayload(storage, buildAutoSaveKey("user_a"))?.currentStep,
    ).toBe(1);
    expect(
      loadAutoSavePayload(storage, buildAutoSaveKey(null))?.currentStep,
    ).toBe(7);

    // Clear du user_a ne touche pas anonymous
    clearAutoSavePayload(storage, buildAutoSaveKey("user_a"));
    expect(loadAutoSavePayload(storage, buildAutoSaveKey("user_a"))).toBeNull();
    expect(
      loadAutoSavePayload(storage, buildAutoSaveKey(null))?.currentStep,
    ).toBe(7);
  });
});
