// components/observability/PlausibleScript.tsx — Analytics Plausible (RGPD-safe).
// Safe no-op si NEXT_PUBLIC_PLAUSIBLE_DOMAIN n'est pas défini (dev local).
import Script from "next/script";

export function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";
  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      src={src}
      strategy="afterInteractive"
    />
  );
}

export default PlausibleScript;
