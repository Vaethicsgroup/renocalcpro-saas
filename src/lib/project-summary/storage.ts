// src/lib/project-summary/storage.ts
// Persistance MVP via localStorage. Pas de DB pour ce sprint.
// Côté client uniquement — retourne null en SSR.

"use client";

import type { VisitNotes } from "./project-narrative";

const PREFIX = "renocalc.summary.";

export interface StoredSummary {
  visitNotes: VisitNotes;
  /** Texte final édité (markdown libre). */
  finalText?: string;
  /** Ton choisi à la dernière génération. */
  tone?: "client" | "professional" | "technical";
  /** Inclure les réserves dans le corps. */
  includeUncertainty?: boolean;
  /** Date de dernière modification (ISO). */
  updatedAt?: string;
}

export function loadProjectSummary(projectId: string): StoredSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + projectId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "visitNotes" in parsed) {
      return parsed as StoredSummary;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveProjectSummary(projectId: string, data: StoredSummary): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredSummary = { ...data, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(PREFIX + projectId, JSON.stringify(payload));
  } catch {
    /* quota / mode privé strict */
  }
}

export function clearProjectSummary(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + projectId);
  } catch {
    /* noop */
  }
}
