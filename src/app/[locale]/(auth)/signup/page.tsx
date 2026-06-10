// app/[locale]/(auth)/signup/page.tsx — Wizard onboarding 5 écrans.
import { setRequestLocale } from "next-intl/server";
import { SignupWizard } from "@/components/onboarding/SignupWizard";

interface SignupPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; plan?: string; step?: string }>;
}

export default async function SignupPage({ params, searchParams }: SignupPageProps) {
  const { locale } = await params;
  const { type, plan, step } = await searchParams;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl">
      <SignupWizard
        initialType={type === "individual" || type === "pro" ? type : null}
        initialPlan={plan ?? null}
        initialStep={Number(step ?? 1)}
      />
    </div>
  );
}
