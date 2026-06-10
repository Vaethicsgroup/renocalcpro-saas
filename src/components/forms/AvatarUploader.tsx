// src/components/forms/AvatarUploader.tsx
// Composant avatar circulaire avec upload local (FileReader + localStorage).
// MVP : pas de backend, l'image est stockée en data URL côté navigateur. Quand
// le backend `/api/storage/upload` sera câblé, on remplacera juste la fonction
// `persistImage`.
//
// Direction Energy Trust : cercle blanc bord cream-300, hover → vert énergie,
// icône Camera Lucide en surimpression, badge "Modifier" / "Ajouter".

"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Loader2, Trash2, User } from "lucide-react";

interface Props {
  /** Clé localStorage unique pour cet avatar — ex. `user-avatar`. */
  storageKey: string;
  /** Diamètre du cercle (px). */
  size?: number;
  /** Initiales à afficher si pas d'avatar (ex. "CL"). */
  initials?: string;
  /** Label accessible. */
  label?: string;
  /** Pas modifiable (lecture seule). */
  readOnly?: boolean;
  /** Callback quand l'image change (data URL ou null). */
  onChange?: (dataUrl: string | null) => void;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export function AvatarUploader({
  storageKey,
  size = 96,
  initials = "?",
  label,
  readOnly = false,
  onChange,
}: Props) {
  const t = useTranslations("avatarUpload");
  const effectiveLabel = label ?? t("defaultLabel");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate depuis localStorage au montage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setDataUrl(stored);
    } catch {
      // Storage indisponible (mode privé strict) — fail silencieux
    }
  }, [storageKey]);

  const persistImage = (url: string | null) => {
    try {
      if (url === null) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, url);
      }
    } catch {
      // Quota ou storage indisponible — on garde l'image en mémoire seulement
    }
    onChange?.(url);
  };

  const handleFile = (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError(t("errFormat"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("errTooLarge"));
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
      setError(t("errReadFailed"));
      setPending(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setDataUrl(null);
    persistImage(null);
  };

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className="relative shrink-0 overflow-hidden rounded-full border border-cream-300 bg-white shadow-soft"
        style={{ width: size, height: size }}
      >
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={effectiveLabel}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-cream-100 text-night-800">
            {initials.length <= 3 ? (
              <span
                className="font-serif font-bold"
                style={{ fontSize: size * 0.36 }}
              >
                {initials}
              </span>
            ) : (
              <User
                className="text-stone-400"
                style={{ width: size * 0.45, height: size * 0.45 }}
                strokeWidth={1.5}
                aria-hidden
              />
            )}
          </div>
        )}

        {!readOnly && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            aria-label={effectiveLabel}
            className="absolute inset-0 flex items-center justify-center bg-night-900/0 text-white opacity-0 transition-opacity hover:bg-night-900/55 hover:opacity-100 focus-visible:bg-night-900/55 focus-visible:opacity-100 focus-visible:outline-none"
          >
            {pending ? (
              <Loader2
                className="h-6 w-6 animate-spin"
                strokeWidth={2}
                aria-hidden
              />
            ) : (
              <Camera
                className="h-6 w-6"
                strokeWidth={1.75}
                aria-hidden
              />
            )}
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
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2 text-2xs">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md border border-cream-300 bg-white px-2 py-1 font-semibold text-night-800 transition-colors hover:bg-cream-50 disabled:opacity-60"
          >
            <Camera className="h-3 w-3" strokeWidth={1.75} aria-hidden />
            {dataUrl ? t("btnEdit") : t("btnAdd")}
          </button>
          {dataUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1 rounded-md border border-cream-300 bg-white px-2 py-1 font-semibold text-stone-600 transition-colors hover:bg-error-50 hover:text-error-700"
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.75} aria-hidden />
              {t("btnRemove")}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="max-w-[200px] text-center text-2xs text-error-700">
          {error}
        </p>
      )}
    </div>
  );
}
