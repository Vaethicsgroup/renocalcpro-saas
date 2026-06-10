// src/lib/compliance/storage.ts
// Persistance MVP via localStorage. Pas de DB pour ce sprint.
// Côté client uniquement — les helpers retournent null en SSR.

"use client";

import type { ComplianceData } from "./professional-compliance";

const PREFIX = "renocalc.compliance.";

export function loadComplianceData(orgId: string): ComplianceData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + orgId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "fields" in parsed) {
      return parsed as ComplianceData;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveComplianceData(orgId: string, data: ComplianceData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + orgId, JSON.stringify(data));
  } catch {
    // Quota / mode privé strict — fail silencieux
  }
}

export function clearComplianceData(orgId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + orgId);
  } catch {
    /* noop */
  }
}
