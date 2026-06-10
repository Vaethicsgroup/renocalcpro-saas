// tests/usage-actions.test.ts — server actions usage + decisions DB-aware.

import { describe, it, expect, beforeEach } from "vitest";
import {
  __dumpUsageMem,
  __resetUsageMem,
  type AccountIdentity,
  type RequestContext,
  checkPdfExportAllowed,
  checkProjectCreationAllowed,
  recordUsageEvent,
} from "@/server/actions/usage";

const ctxFor = (overrides: Partial<RequestContext> = {}): RequestContext => ({
  rawDeviceId: "test-device-01",
  rawIp: "203.0.113.42",
  userAgent: "Mozilla/5.0 Chrome/120.0.0",
  ...overrides,
});

const acc = (
  overrides: Partial<AccountIdentity> = {},
): AccountIdentity => ({
  accountId: "acc-1",
  plan: "FREE",
  emailVerified: true,
  ...overrides,
});

beforeEach(() => {
  __resetUsageMem();
});

describe("FREE — quota projet", () => {
  it("FREE peut créer 1 projet", async () => {
    const d = await checkProjectCreationAllowed(acc(), ctxFor());
    expect(d.allowed).toBe(true);
  });

  it("FREE ne peut pas créer un 2e projet", async () => {
    // 1er projet créé
    await recordUsageEvent({
      account: acc(),
      kind: "PROJECT_CREATED",
      context: ctxFor(),
    });

    const d = await checkProjectCreationAllowed(acc(), ctxFor());
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("free_project_limit");
  });
});

describe("FREE — PDF exports", () => {
  it("FREE peut exporter un PDF aperçu filigrané", async () => {
    const d = await checkPdfExportAllowed(
      acc(),
      "watermarked_preview",
      ctxFor(),
    );
    expect(d.allowed).toBe(true);
    if (d.allowed) {
      expect(d.payload.effectiveMode).toBe("watermarked_preview");
      expect(d.payload.watermark).toBe(true);
    }
  });

  it("FREE NE PEUT PAS exporter un PDF complet", async () => {
    const d = await checkPdfExportAllowed(acc(), "full", ctxFor());
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("free_pdf_full_blocked");
  });

  it("serveur impose watermark=true même si le client passe 'full'", async () => {
    // Tentative client : full
    // → serveur refuse OU dégrade en watermarked_preview avec watermark=true
    const d = await checkPdfExportAllowed(acc(), "full", ctxFor());
    expect(d.allowed).toBe(false);
  });
});

describe("PRO — PDF exports", () => {
  it("PRO peut exporter un PDF complet sans filigrane", async () => {
    const d = await checkPdfExportAllowed(
      acc({ plan: "PRO" }),
      "full",
      ctxFor(),
    );
    expect(d.allowed).toBe(true);
    if (d.allowed) {
      expect(d.payload.effectiveMode).toBe("full");
      expect(d.payload.watermark).toBe(false);
    }
  });
});

describe("recordUsageEvent — anti-abus persistence", () => {
  it("ne stocke pas l'IP brute ni le UA brut (paranoid check)", async () => {
    const rawIp = "203.0.113.42";
    const rawUa = "Mozilla/5.0 Chrome/120.0.6099.234";
    const { record } = await recordUsageEvent({
      account: acc(),
      kind: "PROJECT_CREATED",
      context: { rawDeviceId: "d-1", rawIp, userAgent: rawUa },
    });

    // jamais l'IP brute
    expect(JSON.stringify(record)).not.toContain(rawIp);
    expect(JSON.stringify(record)).not.toContain("203.0");
    expect(JSON.stringify(record)).not.toContain("113.42");

    // jamais le UA brut complet (la version mineure est virée)
    expect(record.uaNormalized).not.toContain("120.0.6099.234");

    // hashs présents
    expect(record.ipHash.length).toBeGreaterThan(0);
    expect(record.deviceHash.length).toBeGreaterThan(0);
    expect(record.compositeHash.length).toBeGreaterThan(0);
  });

  it("retourne le mode de stockage actuellement utilisé", async () => {
    const { storage } = await recordUsageEvent({
      account: acc(),
      kind: "SIGNUP_ATTEMPT",
      context: ctxFor(),
    });
    expect(["memory", "prisma", "noop"]).toContain(storage);
  });
});

describe("anti-abus : device sur plusieurs comptes", () => {
  it("un device utilisé sur ≥3 comptes marque le 3e comme suspect", async () => {
    // 3 comptes différents, même device + même UA
    for (const id of ["acc-A", "acc-B", "acc-C"]) {
      await recordUsageEvent({
        account: acc({ accountId: id }),
        kind: "SIGNUP_ATTEMPT",
        context: ctxFor({ rawDeviceId: "shared-device-uuid" }),
      });
    }

    const d = await checkProjectCreationAllowed(
      acc({ accountId: "acc-C" }),
      ctxFor({ rawDeviceId: "shared-device-uuid" }),
    );
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.reason).toBe("suspicious_account");
  });

  it("un device utilisé sur 1 ou 2 comptes ne déclenche PAS la suspicion", async () => {
    // 2 comptes max, même device
    for (const id of ["acc-X", "acc-Y"]) {
      await recordUsageEvent({
        account: acc({ accountId: id }),
        kind: "SIGNUP_ATTEMPT",
        context: ctxFor({ rawDeviceId: "device-light" }),
      });
    }

    const d = await checkProjectCreationAllowed(
      acc({ accountId: "acc-Y" }),
      ctxFor({ rawDeviceId: "device-light" }),
    );
    expect(d.allowed).toBe(true);
  });
});

describe("__dumpUsageMem — pour debug / tests", () => {
  it("retourne le store in-memory courant", async () => {
    await recordUsageEvent({
      account: acc({ accountId: "acc-debug" }),
      kind: "PROJECT_CREATED",
      context: ctxFor(),
    });
    const mem = __dumpUsageMem();
    expect(mem.get("acc-debug")?.length).toBe(1);
  });
});
