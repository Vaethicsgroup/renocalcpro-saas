// app/[locale]/o/projects/[id]/systemes/page.tsx
import { getTranslations } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

interface Props { params: Promise<{ locale: string; id: string }> }

export default async function SystemesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "oProjSystemes" });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-stone-600">{t("body")}</p>
      </CardContent>
    </Card>
  );
}
