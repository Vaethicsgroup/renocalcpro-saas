"use client";
// components/ai-assistant/useAssistantStream.ts
// Hook bas-niveau pour consommer l'endpoint SSE /api/ai-assistant/stream.
// Le Provider (AssistantProvider) peut l'utiliser à la place du POST sync
// quand `useStreaming: true` est passé.

import { useCallback, useRef, useState } from "react";

export interface StreamCallbacks {
  onReady?: (conversationId: string) => void;
  onDelta?: (chunk: string) => void;
  onMeta?: (meta: { confidence: string; sources: Array<{ kind: string; ref: string; label: string }>; guardsTriggered: string[] }) => void;
  onDone?: (final: { messageId: string; tokensRemaining: number; followUpSuggestions: string[] }) => void;
  onError?: (message: string) => void;
}

export interface StreamArgs {
  apiUrl: string;
  body: Record<string, unknown>;
  callbacks: StreamCallbacks;
}

export function useAssistantStream() {
  const abortRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const start = useCallback(async ({ apiUrl, body, callbacks }: StreamArgs) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setIsStreaming(true);
    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "text/event-stream" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!resp.ok || !resp.body) {
        callbacks.onError?.(`HTTP ${resp.status}`);
        return;
      }
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
          let eventName = "message";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventName = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataStr += line.slice(6);
          }
          if (!dataStr) continue;
          handleEvent(eventName, dataStr, callbacks);
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        callbacks.onError?.((e as Error).message);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { start, stop, isStreaming };
}

function handleEvent(name: string, dataStr: string, cb: StreamCallbacks) {
  try {
    switch (name) {
      case "ready":
        cb.onReady?.(JSON.parse(dataStr).conversationId);
        break;
      case "delta":
        // delta est juste du texte (pas JSON pour minimiser overhead)
        cb.onDelta?.(dataStr);
        break;
      case "meta":
        cb.onMeta?.(JSON.parse(dataStr));
        break;
      case "done":
        cb.onDone?.(JSON.parse(dataStr));
        break;
      case "error":
        cb.onError?.(JSON.parse(dataStr).message ?? "unknown");
        break;
    }
  } catch {
    // ignore parsing errors silently
  }
}
