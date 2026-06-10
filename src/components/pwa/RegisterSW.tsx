// components/pwa/RegisterSW.tsx — Registration service worker (PWA).
// Safe no-op en dev. En production, enregistre /sw.js si présent.
"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          /* silent — sw optionnel */
        });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}

export default RegisterSW;
