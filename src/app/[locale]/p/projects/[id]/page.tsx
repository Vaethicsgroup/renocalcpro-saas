// app/[locale]/p/projects/[id]/page.tsx — redirection vers Synthèse
import { redirect } from "next/navigation";
export default async function Index({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  redirect(`/${locale}/p/projects/${id}/synthese`);
}
