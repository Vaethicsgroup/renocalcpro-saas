// app/[locale]/admin/health/page.tsx
// Dashboard health globale temps réel — toutes briques externes monitorées.

import { probeAll } from "@/lib/health/probes";
import { HealthLiveMonitor } from "@/components/admin/HealthLiveMonitor";

export default async function HealthAdminPage() {
  // Première charge SSR pour first-paint instant
  const initialProbes = await probeAll();

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Ops · Health</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900" style={{ fontFamily: "Source Serif 4, Lora, serif" }}>
          Health globale
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Monitoring temps réel de toutes les briques externes : DB, Redis, S3, Stripe, Anthropic, Resend, Webhooks. Auto-refresh toutes les 10 secondes.
        </p>
      </header>

      <HealthLiveMonitor initialProbes={initialProbes} />
    </div>
  );
}
