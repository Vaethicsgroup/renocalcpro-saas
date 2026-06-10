// tests/webhooks.test.ts — Couverture signature HMAC + retry backoff.
import { describe, it, expect, vi } from "vitest";
import {
  signWebhookPayload,
  buildSignatureHeader,
  verifySignature,
  nextRetryDelaySec,
  RETRY_BACKOFF_SEC,
  generateWebhookSecret,
} from "@/lib/webhooks/signature";

describe("signWebhookPayload", () => {
  it("retourne un hash hex de 64 chars (SHA-256)", () => {
    const sig = signWebhookPayload("whsec_test", "{}", 1700000000);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("est déterministe pour les mêmes inputs", () => {
    const a = signWebhookPayload("s", "p", 100);
    const b = signWebhookPayload("s", "p", 100);
    expect(a).toBe(b);
  });

  it("change si secret change", () => {
    const a = signWebhookPayload("s1", "p", 100);
    const b = signWebhookPayload("s2", "p", 100);
    expect(a).not.toBe(b);
  });

  it("change si payload change", () => {
    const a = signWebhookPayload("s", "p1", 100);
    const b = signWebhookPayload("s", "p2", 100);
    expect(a).not.toBe(b);
  });

  it("change si timestamp change", () => {
    const a = signWebhookPayload("s", "p", 100);
    const b = signWebhookPayload("s", "p", 101);
    expect(a).not.toBe(b);
  });
});

describe("buildSignatureHeader", () => {
  it("formate le header `t=<ts>,v1=<sig>`", () => {
    const h = buildSignatureHeader("s", "{}", 1700000000);
    expect(h).toMatch(/^t=1700000000,v1=[0-9a-f]{64}$/);
  });
});

describe("verifySignature", () => {
  const secret = "whsec_abc123";
  const payload = JSON.stringify({ event: "test", data: { id: 1 } });
  const ts = 1700000000;

  it("accepte une signature valide dans la tolérance", () => {
    const header = buildSignatureHeader(secret, payload, ts);
    expect(verifySignature(secret, payload, header, ts)).toBe(true);
  });

  it("rejette si secret différent", () => {
    const header = buildSignatureHeader(secret, payload, ts);
    expect(verifySignature("whsec_wrong", payload, header, ts)).toBe(false);
  });

  it("rejette si payload modifié", () => {
    const header = buildSignatureHeader(secret, payload, ts);
    expect(verifySignature(secret, payload + "modified", header, ts)).toBe(false);
  });

  it("rejette si timestamp en dehors de la tolérance (> 5 min)", () => {
    const header = buildSignatureHeader(secret, payload, ts);
    expect(verifySignature(secret, payload, header, ts + 301)).toBe(false);
    expect(verifySignature(secret, payload, header, ts - 301)).toBe(false);
  });

  it("accepte un timestamp à la limite (5 min)", () => {
    const header = buildSignatureHeader(secret, payload, ts);
    expect(verifySignature(secret, payload, header, ts + 299)).toBe(true);
  });

  it("rejette un header malformé", () => {
    expect(verifySignature(secret, payload, "garbage")).toBe(false);
    expect(verifySignature(secret, payload, "t=100")).toBe(false);
    expect(verifySignature(secret, payload, "v1=abc")).toBe(false);
    expect(verifySignature(secret, payload, "")).toBe(false);
  });

  it("rejette une signature de longueur incorrecte (timing-safe friendly)", () => {
    expect(verifySignature(secret, payload, `t=${ts},v1=deadbeef`, ts)).toBe(false);
  });

  it("supporte plusieurs signatures v1 (rotation de secret)", () => {
    const sig1 = signWebhookPayload("old_secret", payload, ts);
    const sig2 = signWebhookPayload(secret, payload, ts);
    const header = `t=${ts},v1=${sig1},v1=${sig2}`;
    expect(verifySignature(secret, payload, header, ts)).toBe(true);
  });
});

describe("nextRetryDelaySec", () => {
  it("retourne les paliers attendus", () => {
    expect(nextRetryDelaySec(0)).toBe(60);       // 1 min
    expect(nextRetryDelaySec(1)).toBe(300);      // 5 min
    expect(nextRetryDelaySec(2)).toBe(1800);     // 30 min
    expect(nextRetryDelaySec(3)).toBe(7200);     // 2 h
    expect(nextRetryDelaySec(4)).toBe(21600);    // 6 h
    expect(nextRetryDelaySec(5)).toBe(86400);    // 24 h
  });

  it("retourne null après le 6e retry (épuisé)", () => {
    expect(nextRetryDelaySec(6)).toBeNull();
    expect(nextRetryDelaySec(100)).toBeNull();
  });

  it("rejette les valeurs négatives", () => {
    expect(nextRetryDelaySec(-1)).toBeNull();
  });

  it("la séquence est croissante", () => {
    for (let i = 0; i < RETRY_BACKOFF_SEC.length - 1; i++) {
      expect(RETRY_BACKOFF_SEC[i + 1]).toBeGreaterThan(RETRY_BACKOFF_SEC[i]);
    }
  });
});

describe("generateWebhookSecret", () => {
  it("retourne un secret au format whsec_<32hex>", () => {
    const s = generateWebhookSecret();
    expect(s).toMatch(/^whsec_[0-9a-f]{32}$/);
  });

  it("génère des secrets uniques (pas de collision dans 100 essais)", () => {
    const set = new Set(Array.from({ length: 100 }, () => generateWebhookSecret()));
    expect(set.size).toBe(100);
  });
});
