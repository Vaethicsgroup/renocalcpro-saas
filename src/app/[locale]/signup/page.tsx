// app/[locale]/signup/page.tsx — Fallback legacy : redirige vers /auth/signup.
import { redirect } from "next/navigation";

interface Props { params: Promise<{ locale: string }> }

export default async function LegacySignupRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/auth/signup`);
}
