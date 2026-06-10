// app/[locale]/dev/email/page.tsx — Index gallery des 8 templates email.
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";

interface Props { params: Promise<{ locale: string }> }

const TEMPLATES = [
  { id: "magic-link-login",      label: "Magic link · Login",       category: "Auth",     emoji: "🔑" },
  { id: "magic-link-signup",     label: "Magic link · Signup",      category: "Auth",     emoji: "✉️" },
  { id: "welcome-individual",    label: "Welcome · Particulier",    category: "Onboarding", emoji: "🏠" },
  { id: "welcome-pro",           label: "Welcome · Pro",            category: "Onboarding", emoji: "💼" },
  { id: "trial-ending-soon",     label: "Trial ending soon",        category: "Lifecycle", emoji: "⏳" },
  { id: "trial-ended",           label: "Trial ended",              category: "Lifecycle", emoji: "🛑" },
  { id: "payment-failed",        label: "Payment failed",           category: "Billing",   emoji: "⚠️" },
  { id: "subscription-canceled", label: "Subscription canceled",    category: "Billing",   emoji: "❌" },
  { id: "weekly-usage-report",   label: "Weekly usage report",      category: "Engagement", emoji: "📊" },
] as const;

export default async function EmailGallery({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (process.env.NODE_ENV !== "development") {
    const session = await auth();
    if (!isAdmin(session?.user?.id)) notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900">DEV / ADMIN ONLY</span>
        <h1 className="mt-3 font-serif text-4xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Email templates gallery
        </h1>
        <p className="mt-2 text-stone-600">
          {TEMPLATES.length} templates × 5 langues = {TEMPLATES.length * 5} rendus disponibles.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map(t => (
          <Link
            key={t.id}
            href={`/dev/email/${t.id}`}
            className="group flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-teal-500 hover:shadow-lg"
          >
            <div aria-hidden className="text-3xl">{t.emoji}</div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{t.category}</p>
              <h3 className="mt-1 font-serif text-lg font-semibold text-teal-900 group-hover:text-teal-700" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
                {t.label}
              </h3>
              <p className="mt-2 font-mono text-xs text-stone-500">{t.id}</p>
            </div>
            <span aria-hidden className="text-stone-400 group-hover:text-teal-700">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
