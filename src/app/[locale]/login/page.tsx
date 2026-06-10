// app/[locale]/login/page.tsx — Fallback legacy : redirige vers la vraie route /auth/signin.
// Évite les 404 sur tout lien historique pointant vers /[locale]/login.

import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyLoginRedirect({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const redirectParam = typeof sp.redirect === "string" ? `?redirect=${encodeURIComponent(sp.redirect)}` : "";
  redirect(`/${locale}/auth/signin${redirectParam}`);
}
