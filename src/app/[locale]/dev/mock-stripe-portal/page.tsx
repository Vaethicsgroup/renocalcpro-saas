// app/[locale]/dev/mock-stripe-portal/page.tsx
// Simule visuellement le Stripe Customer Portal pour tester sans Stripe réel.

import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orgId?: string }>;
}

export default async function MockStripePortal({ params, searchParams }: Props) {
  const { locale } = await params;
  const { orgId } = await searchParams;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-2xl border-2 border-dashed border-violet-400 bg-violet-50 p-6">
        <p className="font-semibold text-violet-900">🧪 Stripe Customer Portal — MOCK</p>
        <p className="mt-1 text-sm text-violet-800">
          Cette page simule visuellement le portail Stripe pour tester sans Stripe réel.
          En prod (`STRIPE_MOCK=false` + Stripe configuré), le bouton ouvre `https://billing.stripe.com/...`.
        </p>
      </div>

      <h1 className="mt-8 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
        Manage your subscription
      </h1>
      <p className="mt-2 text-sm text-stone-500">Organisation : {orgId ?? "—"}</p>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Current plan */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Plan</h2>
          <p className="mt-2 font-serif text-2xl font-bold text-teal-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>Pro</p>
          <p className="mt-1 text-sm text-stone-700">149 € HT / mois</p>
          <button className="mt-4 w-full rounded-lg border border-violet-400 bg-white px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-50">
            Update plan
          </button>
          <button className="mt-2 w-full rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-50">
            Cancel subscription
          </button>
        </div>

        {/* Payment method */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Payment method</h2>
          <p className="mt-2 font-mono text-sm">VISA •••• 4242</p>
          <p className="mt-1 text-xs text-stone-500">Expires 12 / 28</p>
          <button className="mt-4 w-full rounded-lg border border-violet-400 bg-white px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-50">
            Update card
          </button>
        </div>

        {/* Billing info */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Billing details</h2>
          <p className="mt-2 text-sm text-stone-700">VA Ethics Group<br />2 rue Kellermann<br />59100 Roubaix, France<br />TVA FR 12 345 678 901</p>
          <button className="mt-4 w-full rounded-lg border border-violet-400 bg-white px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-50">
            Update billing info
          </button>
        </div>

        {/* Invoices */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Invoices</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <li className="flex justify-between"><span>01/05/2026</span><a href="#" className="text-violet-700 hover:underline">149 € PDF</a></li>
            <li className="flex justify-between"><span>01/04/2026</span><a href="#" className="text-violet-700 hover:underline">149 € PDF</a></li>
            <li className="flex justify-between"><span>01/03/2026</span><a href="#" className="text-violet-700 hover:underline">149 € PDF</a></li>
          </ul>
        </div>
      </section>

      <Link href="/o/billing" className="mt-10 inline-block text-sm text-teal-700 hover:underline">← Retour à la facturation</Link>
    </div>
  );
}
