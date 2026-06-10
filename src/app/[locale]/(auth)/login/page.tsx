// app/[locale]/(auth)/login/page.tsx — Page connexion magic-link + OAuth.
import { setRequestLocale, getTranslations } from "next-intl/server";
import { signIn } from "@/lib/auth/config";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { callbackUrl, error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  async function loginAction(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    await signIn("email", { email, callbackUrl: callbackUrl ?? "/p/dashboard", redirect: false });
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          {t("signIn")}
        </h1>
        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">
            {error === "EmailSignin"
              ? "L'envoi de l'email a échoué. Réessayez ou utilisez un autre fournisseur."
              : "Une erreur est survenue. Réessayez."}
          </div>
        )}
        <form action={loginAction} className="mt-6">
          <label className="block text-sm">
            <span className="font-medium text-stone-700">{t("email")}</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
            />
          </label>
          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-teal-800 px-6 py-3 text-base font-semibold text-white transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
          >
            {t("signIn")}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-stone-500">
          {t("magicLinkSentSubtitle")}
        </p>
      </div>
    </div>
  );
}
