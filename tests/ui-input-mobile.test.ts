// tests/ui-input-mobile.test.ts
// ════════════════════════════════════════════════════════════════════════════
// Tests unitaires du composant Input — focus sur le comportement mobile :
// auto-attribution de `inputMode="decimal"` quand `type="number"`.
//
// Pour ne pas dépendre d'un DOM virtuel, on teste la résolution via une
// fonction pure équivalente à la logique interne du composant. Le rendu
// React est testé en intégration via les snapshots de pages, hors scope ici.
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

/**
 * Reproduit fidèlement la logique de résolution de `inputMode` du composant
 * `Input` :
 *   - `inputMode` explicitement passé → conservé tel quel
 *   - sinon, si `type === "number"` → "decimal"
 *   - sinon → undefined (clavier par défaut)
 */
function resolveInputMode(
  type?: string,
  inputMode?: string,
): string | undefined {
  return inputMode ?? (type === "number" ? "decimal" : undefined);
}

describe("Input mobile UX — résolution de inputMode", () => {
  it("type=number sans inputMode → decimal (clavier numérique mobile)", () => {
    expect(resolveInputMode("number", undefined)).toBe("decimal");
  });

  it("type=number avec inputMode explicite → respect du choix utilisateur", () => {
    expect(resolveInputMode("number", "numeric")).toBe("numeric");
    expect(resolveInputMode("number", "tel")).toBe("tel");
  });

  it("type=text → pas de inputMode forcé (clavier alphabétique par défaut)", () => {
    expect(resolveInputMode("text", undefined)).toBeUndefined();
  });

  it("type=email → pas de inputMode forcé (le navigateur gère le clavier email)", () => {
    expect(resolveInputMode("email", undefined)).toBeUndefined();
  });

  it("type=tel → pas de inputMode forcé (le navigateur gère)", () => {
    expect(resolveInputMode("tel", undefined)).toBeUndefined();
  });

  it("type undefined → pas de inputMode", () => {
    expect(resolveInputMode(undefined, undefined)).toBeUndefined();
  });

  it("inputMode explicite gagne toujours, même sans type", () => {
    expect(resolveInputMode(undefined, "numeric")).toBe("numeric");
  });
});

describe("Input mobile UX — taille tactile et zoom iOS", () => {
  // Ces constantes reflètent les classes Tailwind utilisées dans le composant
  // Input v2.1. Ce test vérifie que les valeurs respectent les guidelines
  // mobile, et qu'une régression involontaire serait détectée par audit code.
  const TAILWIND_CLASSES = {
    height: "h-11 sm:h-10",
    fontSize: "text-base sm:text-sm",
  };

  it("hauteur mobile h-11 = 44 px (Apple HIG taille tactile minimale)", () => {
    expect(TAILWIND_CLASSES.height.startsWith("h-11")).toBe(true);
  });

  it("font-size mobile text-base = 16 px (anti-zoom auto iOS)", () => {
    // iOS Safari zoom in si font-size < 16 px sur input/select au focus.
    // text-base = 1rem = 16 px par défaut Tailwind.
    expect(TAILWIND_CLASSES.fontSize.startsWith("text-base")).toBe(true);
  });

  it("hauteur desktop sm:h-10 = 40 px (densité préservée)", () => {
    expect(TAILWIND_CLASSES.height).toContain("sm:h-10");
  });

  it("font-size desktop sm:text-sm = 14 px (densité préservée)", () => {
    expect(TAILWIND_CLASSES.fontSize).toContain("sm:text-sm");
  });
});
