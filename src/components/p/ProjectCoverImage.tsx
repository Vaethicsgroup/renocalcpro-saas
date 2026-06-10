// src/components/p/ProjectCoverImage.tsx
// Bannière image projet — composant client avec upload local (FileReader +
// localStorage). MVP : 1 image par projet, stockée en data URL côté
// navigateur. Quand backend `/api/storage/upload` câblé, on remplacera la
// fonction `persistImage`.
//
// Modes :
//   - "banner" : grande bannière 16:9 ou aspect-ratio donné (header projet)
//   - "thumb"  : vignette compacte (card projets liste)
//
// Direction Energy Trust : fond gradient cream/forest subtil quand pas
// d'image, hover overlay bleu nuit, bouton Camera Lucide.

"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Loader2, Trash2, ImagePlus } from "lucide-react";

interface Props {
  /** Identifiant unique du projet — sert de clé localStorage. */
  projectId: string;
  /** "banner" (full width) ou "thumb" (compact). */
  variant?: "banner" | "thumb";
  /** Ratio explicite (override). Ex : "16/9", "4/3". */
  aspectRatio?: string;
  /** Lecture seule. */
  readOnly?: boolean;
  /** Label accessible. */
  label?: string;
  /** Texte affiché en placeholder (pas d'image). */
  placeholderText?: string;
  /** Classes Tailwind additionnelles. */
  className?: string;
  /** Callback quand l'image change. */
  onChange?: (dataUrl: string | null) => void;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const storageKeyFor = (projectId: string) =>
  `project-cover:${projectId}`;

export function ProjectCoverImage({
  projectId,
  variant = "banner",
  aspectRatio,
  readOnly = false,
  label,
  placeholderText,
  className = "",
  onChange,
}: Props) {
  const t = useTranslations("projectCover");
  const effectiveLabel = label ?? t("defaultLabel");
  const effectivePlaceholder = placeholderText ?? t("defaultPlaceholder");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate depuis localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKeyFor(projectId));
      if (stored) setDataUrl(stored);
    } catch {
      // Storage indisponible — silent
    }
  }, [projectId]);

  const persistImage = (url: string | null) => {
    try {
      const key = storageKeyFor(projectId);
      if (url === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, url);
    } catch {
      // ignore
    }
    onChange?.(url);
  };

  const handleFile = (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Format non supporté (PNG, JPEG ou WebP).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image trop volumineuse (max 10 Mo).");
      return;
    }
    setPending(true);
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setDataUrl(url);
      persistImage(url);
      setPending(false);
    };
    reader.onerror = () => {
      setError("Lecture du fichier impossible.");
      setPending(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setDataUrl(null);
    persistImage(null);
  };

  const aspectStyle = aspectRatio
    ? { aspectRatio }
    : variant === "banner"
      ? { aspectRatio: "16/9" }
      : { aspectRatio: "4/3" };

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-cream-300 shadow-card",
        dataUrl
          ? "bg-stone-100"
          : "bg-gradient-to-br from-cream-100 via-cream-50 to-forest-50",
        className,
      ].join(" ")}
      style={aspectStyle}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={effectiveLabel}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-stone-500">
          <ImagePlus
            className="h-7 w-7 text-forest-600"
            strokeWidth={1.5}
            aria-hidden
          />
          {variant === "banner" && (
            <p className="text-xs text-stone-600">{effectivePlaceholder}</p>
          )}
        </div>
      )}

      {!readOnly && (
        <>
          {/* Overlay click-through */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            aria-label={effectiveLabel}
            className="absolute inset-0 flex items-center justify-center bg-night-900/0 text-white opacity-0 transition-opacity hover:bg-night-900/45 hover:opacity-100 focus-visible:bg-night-900/45 focus-visible:opacity-100 focus-visible:outline-none"
          >
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1.5 text-xs font-semibold text-night-800">
              {pending ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin text-forest-600"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : (
                <Camera
                  className="h-3.5 w-3.5 text-forest-700"
                  strokeWidth={1.75}
                  aria-hidden
                />
              )}
              {dataUrl ? t("edit") : t("addPhoto")}
            </span>
          </button>

          {/* Bouton supprimer flottant si image présente */}
          {dataUrl && (
            <button
              type="button"
              onClick={handleRemove}
              aria-label={t("ariaRemove")}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-700 opacity-0 shadow-card transition-opacity hover:bg-error-50 hover:text-error-700 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
            className="hidden"
            aria-hidden
          />
        </>
      )}

      {error && (
        <p
          role="alert"
          className="absolute inset-x-2 bottom-2 z-20 rounded-md bg-error-50 px-2 py-1 text-2xs text-error-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
