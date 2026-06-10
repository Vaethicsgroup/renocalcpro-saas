// app/[locale]/o/projects/[id]/page.tsx — redirect vers /identite
import { redirect } from "next/navigation";
export default async function Index({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  redirect(`/${locale}/o/projects/${id}/identite`);
}
