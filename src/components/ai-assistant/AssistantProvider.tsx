"use client";
// components/ai-assistant/AssistantProvider.tsx
// Context React pour l'assistant IA métier.
// Expose : isOpen, open(), close(), sendMessage(), messages, persona, etc.
//
// Utilisation :
//   <AssistantProvider initialPersona="INDIVIDUAL">
//     {children}
//     <AssistantPanel />
//     <AssistantFloater />
//   </AssistantProvider>

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  AssistantPersona,
  AssistantContextType,
  AssistantContextPayload,
  AssistantMessage,
  AssistantSource,
  AssistantConfidence,
} from "@/lib/ai/assistant/types";

interface OpenArgs {
  contextType: AssistantContextType;
  contextRef?: string;
  contextLabel?: string;
  payload?: AssistantContextPayload;
}

interface AssistantContextValue {
  isOpen: boolean;
  open: (args: OpenArgs) => void;
  close: () => void;
  toggle: () => void;
  persona: AssistantPersona;
  setPersona: (p: AssistantPersona) => void;
  contextType: AssistantContextType;
  contextRef?: string;
  sectionLabel?: string;
  fieldLabel?: string;
  messages: Array<
    | { role: "user"; content: string }
    | {
        role: "assistant";
        content: string;
        confidence?: AssistantConfidence;
        sources: AssistantSource[];
        guardsTriggered?: string[];
      }
  >;
  followUpSuggestions: string[];
  isLoading: boolean;
  conversationId?: string;
  sendMessage: (text: string) => Promise<void>;
  sendFeedback: (args: { messageIndex: number; helpful: boolean; issueKind?: string; comment?: string }) => Promise<void>;
  resetConversation: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

interface ProviderProps {
  children: React.ReactNode;
  initialPersona?: AssistantPersona;
  /** Locale courante (fr, en, es, de, pt) */
  locale?: string;
  /** Projet courant (ID) si l'assistant est ouvert depuis une fiche projet */
  projectId?: string;
  /** URL du endpoint API (par défaut /api/ai-assistant) */
  apiUrl?: string;
  /**
   * Active le streaming SSE des réponses (UX réactive).
   * Si non précisé : true pour les pros, false pour les particuliers.
   */
  useStreaming?: boolean;
}

export function AssistantProvider({
  children,
  initialPersona = "INDIVIDUAL",
  locale = "fr",
  projectId,
  apiUrl = "/api/ai-assistant",
  useStreaming,
}: ProviderProps) {
  const t = useTranslations("assistantErrors");
  // Default streaming policy : Pro = true (besoin de réactivité), Particulier = false
  // (économise tokens et évite les ré-affichages partiels qui peuvent perturber).
  const streamingEnabled =
    useStreaming ?? initialPersona !== "INDIVIDUAL";
  const [isOpen, setIsOpen] = useState(false);
  const [persona, setPersona] = useState<AssistantPersona>(initialPersona);
  const [contextType, setContextType] = useState<AssistantContextType>("GENERAL");
  const [contextRef, setContextRef] = useState<string | undefined>(undefined);
  const [contextLabel, setContextLabel] = useState<string | undefined>(undefined);
  const [payloadRef, setPayloadRef] = useState<AssistantContextPayload | undefined>(undefined);
  const [messages, setMessages] = useState<AssistantContextValue["messages"]>([]);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const messageIdsRef = useRef<string[]>([]); // ID DB de chaque message ASSISTANT pour feedback

  const open = useCallback((args: OpenArgs) => {
    setContextType(args.contextType);
    setContextRef(args.contextRef);
    setContextLabel(args.contextLabel);
    setPayloadRef(args.payload);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(o => !o), []);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setFollowUpSuggestions([]);
    setConversationId(undefined);
    messageIdsRef.current = [];
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isLoading) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages(prev => [...prev, { role: "user", content: trimmed }]);
      setIsLoading(true);
      setFollowUpSuggestions([]);

      // ── Mode streaming SSE ─────────────────────────────────────────────
      if (streamingEnabled) {
        // Insert un message assistant vide qu'on remplira progressivement
        setMessages(prev => [...prev, { role: "assistant", content: "", sources: [] }]);
        let accumulated = "";
        try {
          const resp = await fetch(`${apiUrl}/stream`, {
            method: "POST",
            headers: { "content-type": "application/json", accept: "text/event-stream" },
            body: JSON.stringify({
              conversationId, persona, contextType, contextRef, payload: payloadRef,
              userMessage: trimmed, locale, projectId,
            }),
          });
          if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";
            for (const block of events) {
              const lines = block.split("\n");
              let eventName = "message", dataStr = "";
              for (const line of lines) {
                if (line.startsWith("event: ")) eventName = line.slice(7).trim();
                else if (line.startsWith("data: ")) dataStr += line.slice(6);
              }
              if (eventName === "ready" && !conversationId) {
                try { setConversationId(JSON.parse(dataStr).conversationId); } catch {}
              } else if (eventName === "delta") {
                accumulated += dataStr;
                setMessages(prev => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last?.role === "assistant") {
                    copy[copy.length - 1] = { ...last, content: accumulated };
                  }
                  return copy;
                });
              } else if (eventName === "meta") {
                try {
                  const meta = JSON.parse(dataStr);
                  setMessages(prev => {
                    const copy = [...prev];
                    const last = copy[copy.length - 1];
                    if (last?.role === "assistant") {
                      copy[copy.length - 1] = { ...last, confidence: meta.confidence, sources: meta.sources ?? [], guardsTriggered: meta.guardsTriggered };
                    }
                    return copy;
                  });
                } catch {}
              } else if (eventName === "done") {
                try {
                  const done = JSON.parse(dataStr);
                  messageIdsRef.current.push(done.messageId);
                  setFollowUpSuggestions(done.followUpSuggestions ?? []);
                } catch {}
              } else if (eventName === "error") {
                try { throw new Error(JSON.parse(dataStr).message); }
                catch (e) { throw e instanceof Error ? e : new Error("stream_error"); }
              }
            }
          }
        } catch (e) {
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant" && !accumulated) {
              copy[copy.length - 1] = {
                role: "assistant",
                content: `Erreur streaming : ${(e as Error).message}. Réessayez.`,
                confidence: "UNKNOWN",
                sources: [],
                guardsTriggered: ["stream_error"],
              };
            }
            return copy;
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // ── Mode synchrone (default Particulier) ────────────────────────────
      try {
        const resp = await fetch(apiUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            conversationId,
            persona,
            contextType,
            contextRef,
            payload: payloadRef,
            userMessage: trimmed,
            locale,
            projectId,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setMessages(prev => [
            ...prev,
            {
              role: "assistant",
              content: err.message ?? t("errSorry"),
              confidence: "UNKNOWN",
              sources: [],
              guardsTriggered: ["api_error"],
            },
          ]);
          return;
        }

        const data = (await resp.json()) as {
          conversationId: string;
          messageId: string;
          message: {
            content: string;
            confidence?: AssistantConfidence;
            sources: AssistantSource[];
            guardsTriggered?: string[];
          };
          followUpSuggestions: string[];
        };

        if (!conversationId) setConversationId(data.conversationId);
        messageIdsRef.current.push(data.messageId);

        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: data.message.content,
            confidence: data.message.confidence,
            sources: data.message.sources ?? [],
            guardsTriggered: data.message.guardsTriggered,
          },
        ]);
        setFollowUpSuggestions(data.followUpSuggestions ?? []);
      } catch (e) {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: t("errNetwork"),
            confidence: "UNKNOWN",
            sources: [],
            guardsTriggered: ["network_error"],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, conversationId, contextRef, contextType, isLoading, locale, payloadRef, persona, projectId, streamingEnabled, t],
  );

  const sendFeedback = useCallback(
    async ({ messageIndex, helpful, issueKind, comment }: { messageIndex: number; helpful: boolean; issueKind?: string; comment?: string }) => {
      if (!conversationId) return;
      // Trouver le messageId DB associé : on suppose ordre = ordre des messages assistant
      const assistantIndex = messages
        .slice(0, messageIndex + 1)
        .filter(m => m.role === "assistant").length - 1;
      const messageId = messageIdsRef.current[assistantIndex];
      try {
        await fetch(`${apiUrl}/feedback`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ conversationId, messageId, helpful, issueKind, comment }),
        });
      } catch {
        // silent fail — feedback n'est pas critique
      }
    },
    [apiUrl, conversationId, messages],
  );

  const value = useMemo<AssistantContextValue>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      persona,
      setPersona,
      contextType,
      contextRef,
      sectionLabel: contextType === "FORM_SECTION" ? contextLabel : undefined,
      fieldLabel: contextType === "FORM_FIELD" ? contextLabel : undefined,
      messages,
      followUpSuggestions,
      isLoading,
      conversationId,
      sendMessage,
      sendFeedback,
      resetConversation,
    }),
    [
      isOpen, open, close, toggle, persona, contextType, contextRef, contextLabel,
      messages, followUpSuggestions, isLoading, conversationId, sendMessage, sendFeedback, resetConversation,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error(
      "useAssistant() doit être utilisé à l'intérieur de <AssistantProvider>. Wrappez votre layout.",
    );
  }
  return ctx;
}
