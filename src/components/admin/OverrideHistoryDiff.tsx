// components/admin/OverrideHistoryDiff.tsx
// Affichage de l'historique des modifications d'un override avec diff visuel JSON.

interface HistoryEntry {
  id: string;
  previousPatch: unknown;
  newPatch: unknown;
  changedByUserId: string;
  changeReason: string;
  createdAt: Date;
}

function diffKeys(prev: unknown, next: unknown): { added: string[]; modified: string[]; removed: string[] } {
  const a = (prev && typeof prev === "object") ? (prev as Record<string, unknown>) : {};
  const b = (next && typeof next === "object") ? (next as Record<string, unknown>) : {};
  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];
  for (const k of Object.keys(b)) {
    if (!(k in a)) added.push(k);
    else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) modified.push(k);
  }
  for (const k of Object.keys(a)) if (!(k in b)) removed.push(k);
  return { added, modified, removed };
}

export function OverrideHistoryDiff({ history }: { history: HistoryEntry[] }) {
  return (
    <ul className="space-y-3">
      {history.map(h => {
        const diff = diffKeys(h.previousPatch, h.newPatch);
        const total = diff.added.length + diff.modified.length + diff.removed.length;
        return (
          <li key={h.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-stone-500">{h.createdAt.toLocaleString("fr-FR")}</span>
              <span className="text-xs text-stone-700">{total} modification(s)</span>
            </div>
            <p className="mt-1 text-sm text-stone-900">{h.changeReason}</p>

            <div className="mt-3 grid gap-1 text-xs">
              {diff.added.length > 0 && (
                <div>
                  <span className="font-semibold text-emerald-700">+ Ajout :</span>{" "}
                  <code className="text-stone-600">{diff.added.join(", ")}</code>
                </div>
              )}
              {diff.modified.length > 0 && (
                <div>
                  <span className="font-semibold text-amber-700">~ Modifié :</span>{" "}
                  <code className="text-stone-600">{diff.modified.join(", ")}</code>
                </div>
              )}
              {diff.removed.length > 0 && (
                <div>
                  <span className="font-semibold text-rose-700">− Retiré :</span>{" "}
                  <code className="text-stone-600">{diff.removed.join(", ")}</code>
                </div>
              )}
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-stone-600 hover:text-stone-900">Voir le diff complet</summary>
              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <p className="mb-1 font-semibold text-stone-700">Avant</p>
                  <pre className="max-h-48 overflow-auto rounded bg-rose-50 p-2 text-[10px] text-rose-900">{JSON.stringify(h.previousPatch, null, 2)}</pre>
                </div>
                <div>
                  <p className="mb-1 font-semibold text-stone-700">Après</p>
                  <pre className="max-h-48 overflow-auto rounded bg-emerald-50 p-2 text-[10px] text-emerald-900">{JSON.stringify(h.newPatch, null, 2)}</pre>
                </div>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
