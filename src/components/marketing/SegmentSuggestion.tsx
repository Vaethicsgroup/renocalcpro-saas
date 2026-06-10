"use client";
// components/marketing/SegmentSuggestion.tsx
// Détecte UTM côté client → propose la landing segmentée appropriée en bandeau dismissible.
// Pas de redirect auto pour respecter le contrôle utilisateur (RGPD-friendly).

import { useEffect, useState } from "react";
import Link from "next/link";
import { detectSegmentFromUtm, SEGMENT_TARGETS, type LandingSegment } from "@/lib/marketing/utmFunnel";
import { trackClientEvent } from "@/lib/analytics/plausible.client";

interface Props { locale: string }

const DISMISS_KEY = "renocal.segment_suggestion_dismissed";

export function SegmentSuggestion({ locale }: Props) {
  const [segment, setSegment] = useState<LandingSegment | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const detected = detectSegmentFromUtm({
      source:   params.get("utm_source"),
      medium:   params.get("utm_medium"),
      campaign: params.get("utm_campaign"),
      content:  params.get("utm_content"),
    });

    if (detected) {
      setSegment(detected);
      trackClientEvent("utm_segment_detected", { segment: detected, utm_source: params.get("utm_source") ?? "" });
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    if (segment) {
      trackClientEvent("utm_suggestion_dismissed", { segment });
    }
  }

  function clickThrough() {
    if (segment) {
      trackClientEvent("utm_suggestion_clicked", { segment });
    }
  }

  if (!segment || dismissed) return null;

  const target = SEGMENT_TARGETS[segment];
  return (
    <aside
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-xl border-2 border-white/20 p-4 text-white shadow-2xl bg-gradient-to-br ${target.color}`}
    >
      <div className="flex items-start gap-4">
        <span aria-hidden className="text-2xl">👋</span>
        <div className="flex-1">
          <h2 className="font-semibold">{target.label}</h2>
          <p className="mt-1 text-sm opacity-90">{target.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/${locale}${target.url}`}
              onClick={clickThrough}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-100"
            >
              Voir la version dédiée →
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md border border-white/40 px-3 py-2 text-xs font-semibold hover:bg-white/10"
            >
              Non merci
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
