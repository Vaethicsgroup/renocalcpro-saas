// app/[locale]/p/projects/[id]/photos/page.tsx — Onglet Photos premium v2.0
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

const CATEGORY_KEYS = ["photoCatExterior", "photoCatLiving", "photoCatAttic", "photoCatHeating", "photoCatOther"];

export default function PhotosPage() {
  const t = useTranslations("pTabs");
  const [activeCategory, setActiveCategory] = useState(0);
  const photos = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, url: `/img/sample-${(i % 3) + 1}.jpg`, label: `Photo ${i + 1}` }));

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-6">
        <h2 className="font-serif text-2xl font-bold text-forest-900 sm:text-3xl" style={{ fontFamily: "Source Serif 4, Georgia, serif" }}>
          {t("photoTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-forest-900/65">{t("photoSubtitle")}</p>
      </header>

      {/* Tabs catégories */}
      <div role="tablist" className="mb-6 flex flex-wrap gap-1 border-b border-cream-300">
        {CATEGORY_KEYS.map((catKey, i) => (
          <button
            key={catKey}
            type="button"
            role="tab"
            aria-selected={activeCategory === i}
            onClick={() => setActiveCategory(i)}
            className={[
              "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeCategory === i
                ? "border-forest-700 text-forest-800"
                : "border-transparent text-forest-900/65 hover:border-cream-400 hover:text-forest-900",
            ].join(" ")}
          >
            {t(catKey)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Zone upload + conseils */}
        <div className="space-y-4">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cream-400 bg-white p-8 text-center transition hover:border-forest-400 hover:bg-forest-50/60"
          >
            <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-100 text-3xl text-forest-700">📷</span>
            <p className="mt-4 text-base font-semibold text-forest-900">{t("photoUploadTitle")}</p>
            <p className="mt-2 text-xs text-forest-900/60">{t("photoUploadDrop")}</p>
            <p className="text-xs text-forest-900/60">{t("photoUploadOr")} <button type="button" className="font-semibold text-forest-700 hover:underline">{t("photoUploadBrowse")}</button></p>
            <p className="mt-3 text-2xs text-forest-900/50">{t("photoUploadFormats")}</p>
          </div>

          <Card variant="default" className="bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-forest-900">{t("photoTipsTitle")}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-forest-900/75">{t("photoTipsText")}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Galerie */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-forest-900/55">
            {t("photoCategoryLabel")} <span className="text-forest-900">{t(CATEGORY_KEYS[activeCategory])}</span> · {photos.length} photos
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map(photo => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50 shadow-card">
                <button
                  type="button"
                  aria-label={t("photoDeleteAria", { label: photo.label })}
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-forest-800 opacity-0 shadow-card transition group-hover:opacity-100 hover:bg-error-50 hover:text-error-700"
                >
                  ✕
                </button>
                <span className="absolute bottom-2 left-2 rounded-md bg-forest-900/75 px-2 py-0.5 text-2xs text-cream-50">{photo.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
