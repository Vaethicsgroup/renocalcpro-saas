"use client";
// components/settings/ApiKeyRow.tsx — Ligne d'un tableau API keys avec bouton révocation.

import { useTransition } from "react";
import { revokeApiKeyAction } from "@/server/actions/apiKeys";

interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  scope: "BASIC" | "FULL";
  allowedOrigins: string[];
  lastUsedAt: Date | null;
  lastUsedIp: string | null;
  revokedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

function relativeTime(d: Date | null): string {
  if (!d) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} h`;
  return `${Math.floor(sec / 86400)} j`;
}

export function ApiKeyRow({ orgId, apiKey }: { orgId: string; apiKey: ApiKey }) {
  const [pending, startTransition] = useTransition();

  const isRevoked = !!apiKey.revokedAt;
  const isExpired = apiKey.expiresAt && apiKey.expiresAt < new Date();
  const status = isRevoked ? "revoked" : isExpired ? "expired" : "active";

  return (
    <tr className={isRevoked || isExpired ? "opacity-50" : ""}>
      <td className="px-4 py-2.5 font-medium text-stone-900">{apiKey.name}</td>
      <td className="px-4 py-2.5 font-mono text-xs text-stone-700">{apiKey.prefix}</td>
      <td className="px-4 py-2.5">
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${apiKey.scope === "FULL" ? "bg-rose-100 text-rose-900" : "bg-teal-100 text-teal-900"}`}>
          {apiKey.scope}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-stone-600">
        {apiKey.lastUsedAt ? `il y a ${relativeTime(apiKey.lastUsedAt)}` : "jamais utilisée"}
        {apiKey.lastUsedIp && <span className="ml-1 text-stone-400">· {apiKey.lastUsedIp}</span>}
      </td>
      <td className="px-4 py-2.5 text-xs">
        {status === "active" && <span className="inline-flex items-center gap-1 text-emerald-700">● active</span>}
        {status === "revoked" && <span className="inline-flex items-center gap-1 text-rose-700">● révoquée</span>}
        {status === "expired" && <span className="inline-flex items-center gap-1 text-amber-700">● expirée</span>}
      </td>
      <td className="px-4 py-2.5 text-right">
        {!isRevoked && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Révoquer définitivement la clé « ${apiKey.name} » ? Les requêtes en cours échoueront immédiatement.`)) return;
              startTransition(() => revokeApiKeyAction(orgId, apiKey.id));
            }}
            className="rounded-md border border-rose-600 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            {pending ? "…" : "Révoquer"}
          </button>
        )}
      </td>
    </tr>
  );
}
