// app/[locale]/o/layout.tsx — Layout Pro v2.5 (sidebar forest + safe dev)
import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { SidebarPro } from "@/components/layout/SidebarPro";

// Force-dynamic : évite tout pre-rendering qui pourrait crash sur Prisma/auth en dev
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ProLayout({ children, params }: Props) {
  const { locale } = await params;
  // ⚠ i18n server-side : déclare la locale active pour que `getTranslations`
  // dans les server components enfants de cette sous-arbre /o/* lise les
  // bonnes traductions. Sans cet appel, next-intl tombe sur la locale par
  // défaut et /fr/o/* rend en EN sur les server components.
  setRequestLocale(locale);
  // v2.5 — Suppression des dépendances auth()/prisma() au boot du layout.
  // L'assistant IA et l'ImpersonationBanner sont chargés dynamiquement page-par-page,
  // évitant tout crash si NextAuth/Prisma ne sont pas provisionnés en dev local.

  return (
    <div className="flex min-h-screen bg-cream-100">
      <SidebarPro locale={locale} />
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
