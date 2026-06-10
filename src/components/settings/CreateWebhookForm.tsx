"use client";
// components/settings/CreateWebhookForm.tsx — Création webhook + affichage one-time secret.

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createWebhookAction } from "@/server/actions/webhooks";
import type { WebhookEvent } from "@prisma/client";

const EVENT_GROUPS: { labelKey: string; events: { value: WebhookEvent; descKey: string }[] }[] = [
  {
    labelKey: "groupProjects",
    events: [
      { value: "PROJECT_CREATED",   descKey: "evtProjectCreated" },
      { value: "PROJECT_UPDATED",   descKey: "evtProjectUpdated" },
      { value: "PROJECT_ARCHIVED",  descKey: "evtProjectArchived" },
    ],
  },
  {
    labelKey: "groupReports",
    events: [
      { value: "REPORT_QUEUED",  descKey: "evtReportQueued" },
      { value: "REPORT_READY",   descKey: "evtReportReady" },
      { value: "REPORT_FAILED",  descKey: "evtReportFailed" },
    ],
  },
  {
    labelKey: "groupBilling",
    events: [
      { value: "PAYMENT_SUCCEEDED",     descKey: "evtPaymentSucceeded" },
      { value: "PAYMENT_FAILED",        descKey: "evtPaymentFailed" },
      { value: "SUBSCRIPTION_UPDATED",  descKey: "evtSubscriptionUpdated" },
    ],
  },
  {
    labelKey: "groupAi",
    events: [
      { value: "MATERIAL_IDENTIFIED", descKey: "evtMaterialIdentified" },
    ],
  },
  {
    labelKey: "groupCatalog",
    events: [
      { value: "CATALOG_OVERRIDE_ACTIVATED",   descKey: "evtCatalogActivated" },
      { value: "CATALOG_OVERRIDE_DEACTIVATED", descKey: "evtCatalogDeactivated" },
    ],
  },
];

export function CreateWebhookForm({ orgId }: { orgId: string }) {
  const t = useTranslations("webhookForm");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<Set<WebhookEvent>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ secret: string } | null>(null);

  function toggleEvent(e: WebhookEvent) {
    const next = new Set(events);
    if (next.has(e)) next.delete(e); else next.add(e);
    setEvents(next);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await createWebhookAction({
          organizationId: orgId,
          name,
          url,
          events: Array.from(events),
        });
        setCreated({ secret: res.secret });
        setName(""); setUrl(""); setEvents(new Set());
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown_error");
      }
    });
  }

  if (created) {
    return (
      <div className="mt-4 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-900">{t("secretTitle")}</h3>
        <p className="mt-1 text-xs text-amber-800">
          {t("secretDesc")}
        </p>
        <div className="mt-3 rounded-md bg-white p-3">
          <code className="block break-all font-mono text-sm text-stone-900">{created.secret}</code>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(created.secret)}
            className="rounded-md border border-amber-600 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            {t("btnCopy")}
          </button>
          <button
            type="button"
            onClick={() => setCreated(null)}
            className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
          >
            {t("btnAck")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-xs font-medium text-stone-700">{t("labelName")}</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("placeholderName")}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-stone-700">{t("labelUrl")}</span>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder={t("placeholderUrl")}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-stone-700">{t("legend", { count: events.size })}</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {EVENT_GROUPS.map(g => (
            <div key={g.labelKey} className="rounded-lg border border-stone-200 p-3">
              <h4 className="text-xs font-semibold text-stone-700">{t(g.labelKey)}</h4>
              <ul className="mt-2 space-y-1.5">
                {g.events.map(e => (
                  <li key={e.value}>
                    <label className="flex items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={events.has(e.value)}
                        onChange={() => toggleEvent(e.value)}
                        className="mt-0.5"
                      />
                      <span>
                        <code className="font-mono text-[10px] text-teal-700">{e.value}</code>
                        <span className="block text-stone-600">{t(e.descKey)}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </fieldset>

      <div>
        <button
          type="button"
          disabled={!name || !url || events.size === 0 || pending}
          onClick={submit}
          className="rounded-md bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t("btnCreating") : t("btnCreate")}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
          ✗ {error}
        </div>
      )}
    </div>
  );
}
