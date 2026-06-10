// tests/fingerprint.test.ts — anti-abus hashs déterministes (SHA-256 + sel).

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  __fingerprintInternals,
  hashDeviceComposite,
  hashDeviceId,
  hashIp,
  normalizeUserAgent,
} from "@/lib/security/fingerprint";

const STRONG_PREFIX = __fingerprintInternals.STRONG_PREFIX;
const WEAK_PREFIX = __fingerprintInternals.WEAK_PREFIX;

describe("hashDeviceId", () => {
  it("retourne chaîne vide si rawDeviceId vide / null / undefined", () => {
    expect(hashDeviceId("")).toBe("");
    expect(hashDeviceId(null)).toBe("");
    expect(hashDeviceId(undefined)).toBe("");
  });

  it("est déterministe (mêmes inputs → même output)", () => {
    const a = hashDeviceId("device-uuid-12345");
    const b = hashDeviceId("device-uuid-12345");
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("différents devices → différents hashs", () => {
    expect(hashDeviceId("aaa")).not.toBe(hashDeviceId("bbb"));
  });

  it("préfixe w$ en l'absence de FINGERPRINT_SALT", () => {
    const prev = process.env.FINGERPRINT_SALT;
    delete process.env.FINGERPRINT_SALT;
    const h = hashDeviceId("device-test");
    expect(h.startsWith(WEAK_PREFIX)).toBe(true);
    if (prev !== undefined) process.env.FINGERPRINT_SALT = prev;
  });

  it("préfixe s$ quand FINGERPRINT_SALT défini (≥ 16 chars)", () => {
    const prev = process.env.FINGERPRINT_SALT;
    process.env.FINGERPRINT_SALT = "a".repeat(32);
    const h = hashDeviceId("device-test");
    expect(h.startsWith(STRONG_PREFIX)).toBe(true);
    if (prev !== undefined) {
      process.env.FINGERPRINT_SALT = prev;
    } else {
      delete process.env.FINGERPRINT_SALT;
    }
  });
});

describe("hashIp", () => {
  it("retourne chaîne vide si vide", () => {
    expect(hashIp("")).toBe("");
    expect(hashIp(null)).toBe("");
  });

  it("est déterministe", () => {
    expect(hashIp("203.0.113.42")).toBe(hashIp("203.0.113.42"));
  });

  it("différentes IPs IPv4 → différents hashs", () => {
    expect(hashIp("1.2.3.4")).not.toBe(hashIp("5.6.7.8"));
  });

  it("ne contient PAS l'IP brute (paranoid check)", () => {
    const h = hashIp("203.0.113.42");
    expect(h).not.toContain("203");
    expect(h).not.toContain("113");
    expect(h).not.toContain(".");
  });

  it("normalise x-forwarded-for (prend la 1re IP)", () => {
    const a = hashIp("203.0.113.42, 10.0.0.1, 10.0.0.2");
    const b = hashIp("203.0.113.42");
    expect(a).toBe(b);
  });

  it("normalise IPv4 mappé IPv6 (::ffff:1.2.3.4 ≡ 1.2.3.4)", () => {
    expect(hashIp("::ffff:1.2.3.4")).toBe(hashIp("1.2.3.4"));
  });

  it("normalise IPv4:port (retire le port)", () => {
    expect(hashIp("1.2.3.4:5678")).toBe(hashIp("1.2.3.4"));
  });

  it("IPv6 : tronque au préfixe /64 (deux adresses du même /64 → même hash)", () => {
    const a = hashIp("2001:db8:abcd:0012:0:0:0:1");
    const b = hashIp("2001:db8:abcd:0012:beef:cafe:0:9999");
    expect(a).toBe(b);
  });

  it("vide → chaîne vide", () => {
    expect(hashIp("")).toBe("");
    expect(hashIp(null)).toBe("");
  });
});

describe("normalizeUserAgent", () => {
  it("vide → chaîne vide", () => {
    expect(normalizeUserAgent("")).toBe("");
    expect(normalizeUserAgent(null)).toBe("");
    expect(normalizeUserAgent(undefined)).toBe("");
  });

  it("lowercase + trim + retire versions mineures", () => {
    const ua = "Mozilla/5.0 Chrome/120.0.6099.234 Safari/537.36";
    const n = normalizeUserAgent(ua);
    expect(n).toBe(n.toLowerCase());
    // versions mineures retirées → on garde "5", "120", "537"
    expect(n).not.toContain("120.0");
    expect(n).not.toContain("6099.234");
  });

  it("regroupe Chrome 120.0.X et Chrome 120.1.Y sur la même empreinte", () => {
    const a = normalizeUserAgent("Chrome/120.0.6099.234");
    const b = normalizeUserAgent("Chrome/120.1.0.0");
    expect(a).toBe(b);
  });

  it("output borné à 256 chars", () => {
    const giant = "x".repeat(5000);
    expect(normalizeUserAgent(giant).length).toBeLessThanOrEqual(256);
  });
});

describe("hashDeviceComposite", () => {
  it("vide si device + UA vides", () => {
    expect(hashDeviceComposite(null, null)).toBe("");
    expect(hashDeviceComposite("", "")).toBe("");
  });

  it("est déterministe (mêmes device + UA → même hash)", () => {
    const a = hashDeviceComposite("d-1", "Chrome/120.0.0");
    const b = hashDeviceComposite("d-1", "Chrome/120.0.1");
    // les versions mineures sont normalisées → même UA normalisé → même hash
    expect(a).toBe(b);
  });

  it("hash change si device change", () => {
    expect(hashDeviceComposite("d-1", "Chrome/120")).not.toBe(
      hashDeviceComposite("d-2", "Chrome/120"),
    );
  });

  it("hash change si UA majeur change", () => {
    expect(hashDeviceComposite("d-1", "Chrome/120")).not.toBe(
      hashDeviceComposite("d-1", "Firefox/120"),
    );
  });
});
