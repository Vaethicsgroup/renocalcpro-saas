// src/components/forms/AddressAutocomplete.tsx
// Champ d'adresse avec autocomplétion BAN (Base Adresse Nationale).
// Composant client, mobile-first, accessibilité clavier (↑↓ + Enter + Escape).
//
// Direction visuelle : Energy Trust — bordures cream, focus ring vert énergie,
// listbox blanche avec hover cream, items avec MapPin Lucide.
//
// Usage :
//   <AddressAutocomplete
//     value={address}
//     onChange={(text) => setAddress(text)}
//     onSelect={(feature) => {
//       setAddress(feature.label);
//       setPostalCode(feature.postcode);
//       ...
//     }}
//   />
//
// Comportement : déclenche l'API BAN après 300 ms de pause sur la saisie
// (debounce), affiche un menu déroulant de suggestions, sélection clavier ou
// souris. Pas d'erreur si l'API est indisponible (silencieux + listbox vide).

"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, X as ClearIcon } from "lucide-react";
import {
  searchAddresses,
  type BanFeature,
} from "@/lib/geo/banGeocoding";

interface Props {
  /** Valeur affichée (texte saisi). */
  value: string;
  /** Mise à jour du texte saisi (chaque keystroke). */
  onChange: (text: string) => void;
  /** Callback après sélection d'une suggestion. */
  onSelect: (feature: BanFeature) => void;
  /** Placeholder du champ. */
  placeholder?: string;
  /** id du champ pour l'aria-label / l'attache label. */
  id?: string;
  /** Désactive le composant. */
  disabled?: boolean;
  /** Délai debounce avant recherche (ms). */
  debounceMs?: number;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Saisissez une adresse — ex : 12 rue des Vignes Bordeaux",
  id = "address-autocomplete",
  disabled = false,
  debounceMs = 300,
}: Props) {
  const [suggestions, setSuggestions] = useState<BanFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = window.setTimeout(async () => {
      const results = await searchAddresses(q, 8);
      setSuggestions(results);
      setLoading(false);
      setHighlight(0);
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [value, debounceMs]);

  // Outside click → close
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleSelect(feature: BanFeature) {
    onSelect(feature);
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      const target = suggestions[highlight];
      if (target) {
        e.preventDefault();
        handleSelect(target);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  const showList = open && (suggestions.length > 0 || loading);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="street-address"
          disabled={disabled}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          aria-expanded={showList}
          role="combobox"
          className="h-10 w-full rounded-lg border border-cream-300 bg-white pl-9 pr-9 text-sm text-night-800 placeholder-stone-400 transition-colors focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200/40 disabled:bg-cream-100 disabled:text-stone-500"
        />
        {loading && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-forest-600"
            strokeWidth={2}
            aria-hidden
          />
        )}
        {!loading && value.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSuggestions([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Effacer l'adresse"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-cream-100 hover:text-stone-700"
          >
            <ClearIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-lg border border-cream-300 bg-white shadow-elevated"
        >
          {loading && suggestions.length === 0 && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-stone-500">
              <Loader2
                className="h-4 w-4 animate-spin text-forest-600"
                strokeWidth={2}
                aria-hidden
              />
              Recherche…
            </li>
          )}
          {suggestions.map((s, idx) => (
            <li
              key={`${s.label}-${idx}`}
              role="option"
              aria-selected={idx === highlight}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
              className={[
                "flex cursor-pointer items-start gap-2 px-3 py-2 text-sm transition-colors",
                idx === highlight
                  ? "bg-forest-50 text-night-800"
                  : "text-stone-700 hover:bg-cream-50",
              ].join(" ")}
            >
              <MapPin
                className={[
                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                  idx === highlight ? "text-forest-600" : "text-stone-400",
                ].join(" ")}
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="flex-1 leading-tight">{s.label}</span>
            </li>
          ))}
          {!loading && suggestions.length === 0 && value.trim().length >= 3 && (
            <li className="px-3 py-2 text-xs text-stone-500">
              Aucune adresse correspondante.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
