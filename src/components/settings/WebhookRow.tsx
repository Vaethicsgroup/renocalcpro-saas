"use client";
// components/settings/WebhookRow.tsx — Carte webhook avec actions toggle/delete.

import { useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toggleWebhookAction, deleteWebhookAction } from "@/server/actions/webhooks";
import { SendTestWebhookButton } from "./SendTestWebhookButton";
import type { WebhookEvent } from "@prisma/client";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  active: boolean;
  consecutiveFailures: number;
  disabledAt: Date | null;
  disabledReason: string | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  createdAt: Date;
  _count: { deliveries: number };
}

export function WebhookRow({ orgId, webhook }: { orgId: string; webhook: Webhook }) {
  const t = useTranslations("webhookRow");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-stone-900">{webhook.name}</h3>
            {webhook.active ? (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">{t("active")}</span>
            ) : (
              <span className="rounded bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-700" title={webhook.disabledReason ?? t("disabledTooltip")}>
                {t("inactive")}
              </span>
            )}
            {webhook.consecutiveFailures > 0 && webhook.active && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                {t("failures", { count: webhook.consecutiveFailures })}
              </span>
            )}
          </div>
          <code className="mt-1 block break-all font-mono text-xs text-stone-600">{webhook.url}</code>
          <div className="mt-2 flex flex-wrap gap-1">
            {webhook.events.map(e => (
              <span key={e} className="rounded bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] text-teal-800">
                {e}
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-stone-500">
            {t("deliveriesCreated", { count: webhook._count.deliveries, date: webhook.createdAt.toLocaleDateString(locale) })}
            {webhook.lastSuccessAt && ` ${t("lastSuccess", { date: webhook.lastSuccessAt.toLocaleDateString(locale) })}`}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => toggleWebhookAction(orgId, webhook.id, !webhook.active))}
            className="rounded-md border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            {webhook.active ? t("btnDeactivate") : t("btnReactivate")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm(t("confirmDelete", { name: webhook.name }))) return;
              startTransition(() => deleteWebhookAction(orgId, webhook.id));
            }}
            className="rounded-md border border-rose-600 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            {t("btnDelete")}
          </button>
        </div>
      </div>

      {/* Bouton test webhook */}
      {webhook.active && (
        <SendTestWebhookButton orgId={orgId} webhookId={webhook.id} webhookName={webhook.name} />
      )}
    </div>
  );
}
