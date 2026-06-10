"use client";
// components/ai-assistant/AssistantPanel.tsx
// Panneau latéral assistant IA — pliable, avec historique, badge confidence,
// sources cliquables, raccourcis QuickActions, feedback inline.

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAssistant } from "./AssistantProvider";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { QuickActions } from "./QuickActions";
import { VoiceInputButton } from "./VoiceInputButton";

export function AssistantPanel() {
  const t = useTranslations("assistant");
  const {
    isOpen,
    close,
    messages,
    isLoading,
    sendMessage,
    persona,
    contextType,
    contextRef,
    sectionLabel,
    fieldLabel,
    followUpSuggestions,
    sendFeedback,
  } = useAssistant();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll bas quand nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isLoading]);

  // A11y Sprint 29 — Échap pour fermer le panel
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInput("");
  }

  return (
    <aside
      role="complementary"
      aria-label={t("ariaLabel")}
      className="fixed right-0 top-0 z-40 flex h-screen w-full max-w-md flex-col border-l border-stone-200 bg-white shadow-2xl"
    >
      {/* Header */}
      <header className="flex items-start justify-between border-b border-stone-200 bg-gradient-to-br from-teal-50 to-white p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              {t("headerLabel")}
            </p>
            {messages.some(m => m.role === "assistant" && m.guardsTriggered?.includes("degraded_mode_no_llm")) && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800"
                title={t("degradedTooltip")}
                role="status"
              >
                <span aria-hidden>⚠</span>
                <span>{t("degradedMode")}</span>
              </span>
            )}
          </div>
          <h2 className="mt-2 text-base font-semibold text-stone-900">
            {fieldLabel || sectionLabel || t("defaultTitle")}
          </h2>
          <p className="mt-1 text-xs text-stone-600">
            {labelForContext(contextType, t)} · {t("subtitleSuffix")} <span className="font-medium">{labelForPersona(persona, t)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t("ariaClose")}
          className="ml-2 rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
        >
          ✕
        </button>
      </header>

      {/* Quick actions */}
      <div className="border-b border-stone-200 bg-stone-50 p-3">
        <QuickActions contextRef={contextRef} />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <EmptyState contextRef={contextRef} sectionLabel={sectionLabel} fieldLabel={fieldLabel} t={t} />
        )}

        {messages.map((m, i) => (
          <div key={i}>
            {m.role === "user" ? (
              <UserBubble content={m.content} />
            ) : (
              <AssistantBubble
                content={m.content}
                confidence={m.confidence}
                sources={m.sources}
                guardsTriggered={m.guardsTriggered}
                onFeedback={(helpful, kind) => sendFeedback({ messageIndex: i, helpful, issueKind: kind })}
                t={t}
              />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-stone-500" role="status" aria-live="polite">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-teal-600" />
            <span>{t("thinking")}</span>
          </div>
        )}

        {!isLoading && followUpSuggestions.length > 0 && (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              {t("followUpTitle")}
            </p>
            <ul className="mt-2 space-y-1">
              {followUpSuggestions.slice(0, 3).map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => sendMessage(s)}
                    className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-left text-sm text-teal-700 hover:bg-teal-50 hover:text-teal-900"
                  >
                    💡 {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Input + Voice */}
      <form onSubmit={handleSubmit} className="border-t border-stone-200 bg-white p-3">
        <label htmlFor="assistant-input" className="sr-only">{t("inputAria")}</label>
        <div className="flex gap-2">
          <input
            id="assistant-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t("inputPh")}
            className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            disabled={isLoading}
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("btnSend")}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <VoiceInputButton
            onTranscription={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))}
            locale="fr"
            disabled={isLoading}
          />
          <p className="text-[10px] text-stone-500 flex-1 text-right">
            {t("warningInfo")}
          </p>
        </div>
      </form>
    </aside>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-700 px-4 py-2 text-sm text-white">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({
  content,
  confidence,
  sources,
  guardsTriggered,
  onFeedback,
  t,
}: {
  content: string;
  confidence?: string;
  sources: Array<{ kind: string; ref: string; label: string }>;
  guardsTriggered?: string[];
  onFeedback: (helpful: boolean, kind?: string) => void;
  t: (key: string) => string;
}) {
  const [feedbackGiven, setFeedbackGiven] = useState<null | "yes" | "no">(null);

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        <div className="rounded-2xl rounded-tl-sm bg-stone-100 px-4 py-3 text-sm text-stone-900">
          <div className="whitespace-pre-wrap leading-relaxed">{content}</div>

          {confidence && (
            <div className="mt-2 flex items-center gap-2">
              <ConfidenceBadge level={confidence} />
            </div>
          )}

          {sources.length > 0 && (
            <div className="mt-3 border-t border-stone-200 pt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                {t("sourcesLabel")}
              </p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {sources.map((s, i) => (
                  <li key={i} className="text-stone-600">
                    <span className="font-mono text-stone-400">[{s.kind}]</span> {s.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {guardsTriggered && guardsTriggered.length > 0 && guardsTriggered.includes("expert_verification_added") && (
            <p className="mt-2 text-[10px] italic text-stone-500">
              {t("expertVerified")}
            </p>
          )}
        </div>

        {/* Feedback */}
        {feedbackGiven === null ? (
          <div className="flex gap-2 px-2 text-xs">
            <span className="text-stone-500">{t("feedbackPrompt")}</span>
            <button
              type="button"
              onClick={() => { setFeedbackGiven("yes"); onFeedback(true); }}
              className="rounded px-2 py-0.5 hover:bg-emerald-50 hover:text-emerald-700"
              aria-label={t("feedbackUseful")}
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => { setFeedbackGiven("no"); onFeedback(false, "incorrect"); }}
              className="rounded px-2 py-0.5 hover:bg-rose-50 hover:text-rose-700"
              aria-label={t("feedbackNotUseful")}
            >
              👎
            </button>
          </div>
        ) : (
          <p className="px-2 text-[10px] italic text-stone-500">{t("feedbackThanks")}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  contextRef,
  sectionLabel,
  fieldLabel,
  t,
}: {
  contextRef?: string;
  sectionLabel?: string;
  fieldLabel?: string;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-700">
      <p className="font-semibold">{t("welcome")}</p>
      <p className="mt-2">
        {t("welcomeIntro")}
      </p>
      <ul className="mt-2 list-disc pl-5 text-xs text-stone-600">
        <li>{t("topic1")}</li>
        <li>{t("topic2")}</li>
        <li>{t("topic3")}</li>
        <li>{t("topic4")}</li>
      </ul>
      {(fieldLabel || sectionLabel) && (
        <p className="mt-3 rounded-lg bg-teal-50 p-2 text-xs text-teal-900">
          {t("currentContext")} <strong>{fieldLabel ?? sectionLabel}</strong>
          {contextRef && <span className="ml-1 font-mono text-[10px] text-teal-700">({contextRef})</span>}
        </p>
      )}
    </div>
  );
}

function labelForContext(c: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    FORM_FIELD: "ctxFormField",
    FORM_SECTION: "ctxFormSection",
    CHOICE_HELP: "ctxChoiceHelp",
    RESULT_EXPLAIN: "ctxResultExplain",
    AID_EXPLAIN: "ctxAidExplain",
    MATERIAL_RECOGNIZE: "ctxMaterialRecognize",
    SYSTEM_RECOGNIZE: "ctxSystemRecognize",
    GENERAL: "ctxGeneral",
  };
  return t(map[c] ?? "ctxDefault");
}

function labelForPersona(p: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    INDIVIDUAL: "personaIndividual",
    PRO_AUDITEUR: "personaAuditeur",
    PRO_DIAGNOSTIQUEUR: "personaDiagnostiqueur",
    PRO_ARTISAN: "personaArtisan",
    PRO_BE: "personaBE",
    PRO_ACCOMPAGNATEUR: "personaAccompagnateur",
  };
  const key = map[p];
  return key ? t(key) : p.toLowerCase();
}
