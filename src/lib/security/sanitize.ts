// src/lib/security/sanitize.ts
// Sanitisation HTML pour les rares cas où on accepte du contenu riche
// (commentaires libres dans rapports, descriptions photos longues).
// React encode par défaut les chaînes ; ce module n'est utilisé que pour les
// champs où on rend du HTML via dangerouslySetInnerHTML.

import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"];
const ALLOWED_ATTR = ["href", "title", "rel", "target"];

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "meta", "link"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"],
    SAFE_FOR_TEMPLATES: true,
    USE_PROFILES: { html: true },
  });
}

/**
 * Échappe des caractères pour insertion dans une URL (paramètre query).
 * Préfère URLSearchParams pour la construction.
 */
export function safeQueryParam(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Échappe pour insertion dans un attribut HTML.
 */
export function safeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
