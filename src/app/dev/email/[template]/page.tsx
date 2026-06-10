// app/dev/email/[template]/page.tsx — Pré-vue HTML des templates email.
// Réservé au mode développement (Next.js bloque par notFound() en prod).

import { notFound } from "next/navigation";
import { renderTemplate, type TemplateName, type TemplateProps, type Locale } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

const SAMPLE_PROPS: { [K in TemplateName]: TemplateProps[K] } = {
  "magic-link-login":      { url: "https://renocalcpro.fr/auth/callback?token=abc", userEmail: "demo@example.com" },
  "magic-link-signup":     { url: "https://renocalcpro.fr/auth/callback?token=xyz", userEmail: "newuser@example.com" },
  "welcome-individual":    { firstName: "Léo", dashboardUrl: "https://renocalcpro.fr/p/dashboard" },
  "welcome-pro":           { firstName: "Marie", companyName: "Cabinet Aubert", dashboardUrl: "https://renocalcpro.fr/o/dashboard" },
  "trial-ending-soon":     { daysLeft: 3, planName: "Pro", upgradeUrl: "https://renocalcpro.fr/billing" },
  "trial-ended":           { planName: "Pro", pricingUrl: "https://renocalcpro.fr/pricing" },
  "payment-failed":        { amount: "149,00 €", updatePaymentUrl: "https://renocalcpro.fr/billing/payment" },
  "subscription-canceled": { planName: "Pro", until: "30 juin 2026", reactivateUrl: "https://renocalcpro.fr/billing" },
  "weekly-usage-report":   { reportsUsed: 23, reportsLimit: 100, weekStart: "5 mai 2026" },
};

interface PageProps {
  params: Promise<{ template: string }>;
  searchParams: Promise<{ locale?: string }>;
}

export default async function EmailPreview({ params, searchParams }: PageProps) {
  if (process.env.NODE_ENV === "production") notFound();

  const { template } = await params;
  const { locale = "fr" } = await searchParams;

  if (!(template in SAMPLE_PROPS)) notFound();
  const name = template as TemplateName;
  const props = SAMPLE_PROPS[name];
  const r = await renderTemplate(name, locale as Locale, props as never);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>📧 {name}</h1>
        <p style={{ color: "#666" }}>locale={locale} • subject = <em>{r.subject}</em></p>
        <nav style={{ marginTop: 8 }}>
          {(["fr","en","es","de","pt"] as const).map(l => (
            <a key={l} href={`?locale=${l}`} style={{ marginRight: 8, padding: "4px 10px", border: "1px solid #ddd", borderRadius: 6 }}>{l.toUpperCase()}</a>
          ))}
        </nav>
      </header>
      <iframe
        srcDoc={r.html}
        style={{ width: "100%", height: 800, border: "1px solid #ddd", borderRadius: 8, background: "#fff" }}
        title={`Aperçu email ${name}`}
      />
      <details style={{ marginTop: 24 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Plain text version</summary>
        <pre style={{ background: "#f5f5f4", padding: 16, borderRadius: 8, whiteSpace: "pre-wrap" }}>{r.text}</pre>
      </details>
    </div>
  );
}
