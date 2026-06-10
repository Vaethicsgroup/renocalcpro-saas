// app/[locale]/offline/page.tsx — Page hors-ligne servie par le SW.
import { setRequestLocale } from "next-intl/server";

export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="text-center">
        <div aria-hidden className="text-7xl">📡</div>
        <h1 className="mt-6 font-serif text-4xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Connexion perdue
        </h1>
        <p className="mt-3 text-stone-600">
          La connexion à internet est indisponible. Vos données saisies sont conservées localement
          et synchronisées dès le retour en ligne.
        </p>
        <p className="mt-6 text-sm text-stone-500">
          Vous pouvez continuer à consulter les pages déjà visitées.
        </p>
      </div>
    </div>
  );
}
