// components/admin/ImpersonationBanner.tsx
// Bandeau jaune affiché en haut quand un admin impersonifie un user.
// À monter dans les layouts /p/, /o/, et toute page applicative.

import { getActiveImpersonation, stopImpersonationAction } from "@/server/actions/admin";

export async function ImpersonationBanner() {
  const active = await getActiveImpersonation();
  if (!active) return null;

  const minutesLeft = Math.max(0, Math.round((active.expiresAt.getTime() - Date.now()) / 60_000));

  return (
    <div role="alert" className="sticky top-0 z-50 border-b-2 border-amber-500 bg-amber-100 px-6 py-2 text-sm text-amber-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-lg">🎭</span>
          <span>
            Mode <strong>impersonification</strong> actif — vous voyez l'app comme <strong>{active.targetEmail}</strong>.
            Toutes vos actions sont auditées et expirent dans <strong>{minutesLeft} min</strong>.
          </span>
        </div>
        <form action={async () => { "use server"; await stopImpersonationAction(); }}>
          <button
            type="submit"
            className="rounded-md border border-amber-600 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
          >
            Stop impersonation
          </button>
        </form>
      </div>
    </div>
  );
}
