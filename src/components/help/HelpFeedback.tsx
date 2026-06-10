"use client";
// components/help/HelpFeedback.tsx — « Cet article a-t-il été utile ? » → Plausible.

import { useState } from "react";
import { trackClientEvent } from "@/lib/analytics/plausible.client";

interface Props { slug: string; locale: string; labels: { question: string; yes: string; no: string; thanks: string } }

export function HelpFeedback({ slug, locale, labels }: Props) {
  const [voted, setVoted] = useState<null | "yes" | "no">(null);

  function vote(useful: boolean) {
    setVoted(useful ? "yes" : "no");
    trackClientEvent("help_article_useful", { slug, locale, useful: useful ? "yes" : "no" });
  }

  if (voted) {
    return (
      <div role="status" className="rounded-lg bg-teal-50 p-4 text-sm text-teal-900">
        ✓ {labels.thanks}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-medium text-stone-900">{labels.question}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => vote(true)}
          className="rounded-md border border-teal-600 bg-white px-4 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
        >
          👍 {labels.yes}
        </button>
        <button
          type="button"
          onClick={() => vote(false)}
          className="rounded-md border border-stone-300 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-700"
        >
          👎 {labels.no}
        </button>
      </div>
    </div>
  );
}
