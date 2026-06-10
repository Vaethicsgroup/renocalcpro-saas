"use client";
// components/ai-assistant/useFieldIdleSuggestion.ts
// Détecte l'inactivité utilisateur sur un champ formulaire (focus + pas de saisie
// pendant N secondes) et propose discrètement d'ouvrir l'assistant.
//
// Utilisation :
//   const ref = useFieldIdleSuggestion({
//     fieldRef: "envelope.walls.materialKey",
//     fieldLabel: "Matériau des murs",
//     idleMs: 30_000,
//   });
//   <input ref={ref} ... />
//
// Le hook ouvre une "popover" non-intrusive ("Besoin d'aide ?") via un toast.
// Click → ouvre l'assistant en FORM_FIELD avec ref précachée.

import { useCallback, useEffect, useRef } from "react";
import { useAssistant } from "./AssistantProvider";

export interface IdleSuggestionArgs {
  fieldRef: string;
  fieldLabel?: string;
  /** Durée d'inactivité après focus avant suggestion (défaut 30s) */
  idleMs?: number;
  /** Ne pas redéclencher dans la même session après dismiss */
  rememberDismiss?: boolean;
}

const SESSION_KEY = "renocal.assistant.dismissed_fields";

function isDismissed(fieldRef: string): boolean {
  try {
    const arr = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]");
    return Array.isArray(arr) && arr.includes(fieldRef);
  } catch {
    return false;
  }
}

function markDismissed(fieldRef: string): void {
  try {
    const arr = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]");
    const set = new Set(Array.isArray(arr) ? arr : []);
    set.add(fieldRef);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
  } catch {
    /* silent */
  }
}

export function useFieldIdleSuggestion({
  fieldRef,
  fieldLabel,
  idleMs = 30_000,
  rememberDismiss = true,
}: IdleSuggestionArgs) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { open, isOpen } = useAssistant();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const triggerSuggestion = useCallback(() => {
    if (isOpen) return;
    if (rememberDismiss && isDismissed(fieldRef)) return;

    // Mini toast non-bloquant
    const toast = document.createElement("div");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText = `
      position: fixed; bottom: 100px; right: 24px; z-index: 50;
      background: white; border: 2px solid rgb(20 184 166);
      border-radius: 12px; padding: 12px 16px;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2);
      max-width: 320px; font-family: system-ui, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    toast.innerHTML = `
      <p style="font-size: 13px; font-weight: 600; color: rgb(15 118 110); margin: 0;">
        🤖 Besoin d'aide ?
      </p>
      <p style="font-size: 12px; color: rgb(68 64 60); margin: 4px 0 8px 0;">
        Je peux vous aider à remplir <strong>${fieldLabel ?? fieldRef}</strong>.
      </p>
      <div style="display: flex; gap: 6px;">
        <button id="assistant-toast-yes" style="
          flex: 1; padding: 6px 12px; border: none; border-radius: 6px;
          background: rgb(15 118 110); color: white; font-size: 12px;
          font-weight: 600; cursor: pointer;
        ">Aidez-moi</button>
        <button id="assistant-toast-no" style="
          padding: 6px 12px; border: 1px solid rgb(214 211 209);
          border-radius: 6px; background: white; color: rgb(87 83 78);
          font-size: 12px; cursor: pointer;
        ">Non merci</button>
      </div>
    `;
    document.body.appendChild(toast);

    const cleanup = () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    };

    document.getElementById("assistant-toast-yes")?.addEventListener("click", () => {
      open({ contextType: "FORM_FIELD", contextRef: fieldRef, contextLabel: fieldLabel });
      cleanup();
    });
    document.getElementById("assistant-toast-no")?.addEventListener("click", () => {
      if (rememberDismiss) markDismissed(fieldRef);
      cleanup();
    });

    // Auto-cleanup après 15s
    setTimeout(cleanup, 15_000);
  }, [fieldLabel, fieldRef, isOpen, open, rememberDismiss]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const handleFocus = () => {
      clearTimer();
      timerRef.current = setTimeout(triggerSuggestion, idleMs);
    };
    const handleInput = () => {
      // Reset timer à chaque saisie
      clearTimer();
      timerRef.current = setTimeout(triggerSuggestion, idleMs);
    };
    const handleBlur = () => clearTimer();

    el.addEventListener("focus", handleFocus);
    el.addEventListener("input", handleInput);
    el.addEventListener("blur", handleBlur);

    return () => {
      el.removeEventListener("focus", handleFocus);
      el.removeEventListener("input", handleInput);
      el.removeEventListener("blur", handleBlur);
      clearTimer();
    };
  }, [clearTimer, idleMs, triggerSuggestion]);

  return inputRef;
}
