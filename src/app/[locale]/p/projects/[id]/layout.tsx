// app/[locale]/p/projects/[id]/layout.tsx — Layout détail projet particulier
// v2.0 « Energy Trust » : MapPin Lucide pour la location, hover forest, no emoji.
import type { ReactNode } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ProjectTabs } from "@/components/p/ProjectTabs";

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string; id: string }>;
}

export default async function ProjectDetailLayout({ children, params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "pWorkspace" });
  // MVP : project mocké
  const project = { name: "Maison des Tilleuls", location: "87000 Limoges" };

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label={t("breadcrumbAria")} className="mb-3 text-xs text-stone-500">
        <Link
          href={`/${locale}/p/dashboard`}
          className="transition-colors hover:text-forest-700"
        >
          {t("breadcrumbDashboard")}
        </Link>
        {" › "}
        <Link
          href={`/${locale}/p/projects`}
          className="transition-colors hover:text-forest-700"
        >
          {t("breadcrumbProjects")}
        </Link>
        {" › "}
        <span className="text-stone-700">{project.name}</span>
      </nav>

      {/* Header projet */}
      <header className="mb-6">
        <h1
          className="font-serif text-3xl font-bold tracking-tight text-night-800 md:text-4xl"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          {project.name}
        </h1>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-stone-600">
          <MapPin
            className="h-4 w-4 text-stone-500"
            strokeWidth={1.75}
            aria-hidden
          />
          {project.location}
        </p>
      </header>

      {/* Onglets */}
      <ProjectTabs locale={locale} projectId={id} />

      <main className="mt-6">{children}</main>
    </div>
  );
}
