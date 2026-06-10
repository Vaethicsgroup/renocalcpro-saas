// app/[locale]/p/layout.tsx — Layout Particulier v3.0 « Energy Trust »
// Fond principal : cream-50 (#FFFDF7 spec) au lieu de cream-100 (beige plus
// chaud). La sidebar est désormais bleu nuit profond (cf. SidebarParticulier
// v4.0), le contenu principal reste sur un fond blanc chaud très clair.
import type { ReactNode } from "react";
import { SidebarParticulier } from "@/components/layout/SidebarParticulier";

// Force-dynamic : évite tout pre-rendering qui pourrait crash sur Prisma/auth
// en dev.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ParticulierLayout({ children, params }: Props) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen bg-cream-50">
      <SidebarParticulier locale={locale} />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
