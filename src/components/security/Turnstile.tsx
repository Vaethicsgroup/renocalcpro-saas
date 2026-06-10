"use client";
// components/security/Turnstile.tsx
// Widget officiel Cloudflare Turnstile. Si site key absent : placeholder dev.

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: {
        sitekey: string;
        action?: string;
        callback?: (token: string) => void;
        "error-callback"?: () => void;
        "expired-callback"?: () => void;
        theme?: "auto" | "light" | "dark";
        size?: "normal" | "compact" | "invisible";
      }) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

interface TurnstileProps {
  /** Nom du champ caché ajouté au formulaire avec le token. */
  name?: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  onVerify?: (token: string) => void;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function Turnstile({ name = "cf-turnstile-response", action, theme = "auto", onVerify }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    if (typeof window === "undefined") return;

    // Charge le script Cloudflare une seule fois
    const SCRIPT_ID = "cf-turnstile-script";
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    function renderWidget() {
      if (!ref.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY!,
        action,
        theme,
        callback: (token) => {
          // Pose token dans un input hidden pour la soumission de form
          const input = ref.current?.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;
          if (input) input.value = token;
          onVerify?.(token);
        },
        "expired-callback": () => widgetIdRef.current && window.turnstile?.reset(widgetIdRef.current),
      });
    }

    if (window.turnstile) renderWidget();
    else {
      // Attente du load de l'API
      const interval = setInterval(() => {
        if (window.turnstile) { clearInterval(interval); renderWidget(); }
      }, 100);
      return () => clearInterval(interval);
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [action, theme, name, onVerify]);

  if (!SITE_KEY) {
    return (
      <div role="note" className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 text-xs text-stone-600">
        🤖 Anti-bot Cloudflare Turnstile désactivé en dev (pas de NEXT_PUBLIC_TURNSTILE_SITE_KEY).
      </div>
    );
  }

  return (
    <div className="my-3">
      <div ref={ref} aria-label="Anti-bot challenge" />
      <input type="hidden" name={name} value="" />
    </div>
  );
}
