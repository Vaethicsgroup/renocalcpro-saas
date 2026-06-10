// app/[locale]/admin/layout.tsx — Layout super-admin v2.6 (bandeau démo + sidebar forest)
// v2.6 — Ajout du DemoAdminBanner qui apparaît automatiquement si l'accès
//        provient du bypass dev local ou du cookie démo admin (cf.
//        src/lib/auth/demo-admin.ts). Pour un vrai admin, aucun bandeau.
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { SidebarAdmin } from "@/components/layout/SidebarAdmin";
import { DemoAdminBanner } from "@/components/admin/DemoAdminBanner";

// Force-dynamic : évite static pre-rendering qui crash sur Prisma/auth en dev
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Note : la navigation effective est rendue par SidebarAdmin. La constante NAV
// précédemment déclarée ici n'était pas utilisée et a été retirée pour i18n.

interface Props { children: ReactNode; params: Promise<{ locale: string }> }

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  await requireAdmin(locale);

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {/* v2.6 — Bandeau démo/dev affiché en permanence en haut pour éviter
          toute confusion avec un vrai accès admin. N'apparaît pas pour les
          véritables admin (ADMIN_USER_IDS). */}
      <DemoAdminBanner locale={locale} />
      <div className="flex flex-1">
        <SidebarAdmin locale={locale} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
