// app/[locale]/(public)/pricing/page.tsx — Alias legacy → /tarifs.
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function PricingAliasPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/tarifs`);
}
