// app/[locale]/admin/page.tsx — Dashboard admin global v3 (vue opérationnelle)
// ════════════════════════════════════════════════════════════════════════════
// Page d'entrée `/admin`. Vue opérationnelle plateforme structurée en 7
// sections (A-G) cf. brief produit. Données entièrement mockées et déclarées
// comme telles via le bandeau de notice.
//
// La vue business (MRR/ARR/cohortes/funnel) reste disponible sur
// `/admin/dashboard` qui appelle réellement Prisma.
// ════════════════════════════════════════════════════════════════════════════

import { setRequestLocale } from "next-intl/server";
import { AdminGlobalDashboard } from "@/components/admin/AdminGlobalDashboard";
import { ADMIN_GLOBAL_MOCK } from "@/lib/admin/admin-dashboard.mock";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminHomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminGlobalDashboard locale={locale} data={ADMIN_GLOBAL_MOCK} />;
}
