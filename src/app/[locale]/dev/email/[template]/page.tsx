// app/[locale]/dev/email/[template]/page.tsx — Preview détaillée d'un template.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { renderTemplate, type TemplateName, type TemplateProps, type Locale } from "@/lib/email/templates";
import { SendTestButton } from "@/components/dev/SendTestButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SAMPLE_PROPS: { [K in TemplateName]: TemplateProps[K] } = {
  "magic-link-login":      { url: "https://renocalcpro.fr/auth/callback?token=abc123",      userEmail: "demo@example.com" },
  "magic-link-signup":     { url: "https://renocalcpro.fr/auth/callback?token=xyz789",      userEmail: "newuser@example.com" },
  "welcome-individual":    { firstName: "Léo",   dashboardUrl: "https://renocalcpro.fr/p/dashboard" },
  "welcome-pro":           { firstName: "Marie", companyName: "Cabinet Aubert", dashboardUrl: "https://renocalcpro.fr/o/dashboard" },
  "trial-ending-soon":     { daysLeft: 3, planName: "Pro", upgradeUrl: "https://renocalcpro.fr/billing" },
  "trial-ended":           { planName: "Pro", pricingUrl: "https://renocalcpro.fr/pricing" },
  "payment-failed":        { amount: "149,00 €", updatePaymentUrl: "https://renocalcpro.fr/billing/payment" },
  "subscription-canceled": { planName: "Pro", until: "30 juin 2026", reactivateUrl: "https://renocalcpro.fr/billing" },
  "weekly-usage-report":   { reportsUsed: 23, reportsLimit: 100, weekStart: "5 mai 2026" },
};

interface PageProps {
  params: Promise<{ locale: string; template: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export default async function EmailPreview({ params, searchParams }: PageProps) {
  const { locale, template } = await params;
  const { lang = "fr" } = await searchParams;
  setRequestLocale(locale);

  if (process.env.NODE_ENV !== "development") {
    const session = await auth();
    if (!isAdmin(session?.user?.id)) notFound();
  }
  if (!(template in SAMPLE_PROPS)) notFound();

  const name = template as TemplateName;
  const props = SAMPLE_PROPS[name];
  const r = await renderTemplate(name, lang as Locale, props as never);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dev/email" className="text-sm text-teal-700 hover:underline">← Gallery</Link>
          <h1 className="mt-2 font-serif text-2xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
            📧 {name}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Locale : <code className="rounded bg-stone-100 px-1">{lang}</code> · Subject : <em>{r.subject}</em>
          </p>
        </div>
        <SendTestButton template={name} locale={lang as Locale} />
      </header>

      {/* Switcher de langue */}
      <nav aria-label="Locale switcher" className="mb-4 flex gap-2">
        {(["fr","en","es","de","pt"] as const).map(l => (
          <Link
            key={l}
            href={`/dev/email/${name}?lang=${l}`}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              lang === l ? "bg-teal-700 text-white" : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            {l.toUpperCase()}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* HTML rendering — iframe sandbox */}
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-4 py-2 text-xs font-semibold uppercase text-stone-500">
            HTML preview · viewport responsive
          </div>
          <iframe
            srcDoc={r.html}
            sandbox="allow-same-origin"
            className="block h-[800px] w-full border-0"
            title={`Aperçu email ${name}`}
          />
        </div>

        {/* Plain text + props */}
        <div className="space-y-4">
          <details className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm" open>
            <summary className="cursor-pointer text-xs font-semibold uppercase text-stone-500">Plain text fallback</summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-stone-50 p-3 text-xs text-stone-700">{r.text}</pre>
          </details>

          <details className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-xs font-semibold uppercase text-stone-500">Props utilisées</summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-stone-50 p-3 text-xs">{JSON.stringify(props, null, 2)}</pre>
          </details>

          <details className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-xs font-semibold uppercase text-stone-500">HTML source</summary>
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-stone-50 p-3 text-[10px]">{r.html}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}
