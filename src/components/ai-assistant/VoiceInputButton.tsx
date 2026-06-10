"use client";
// components/ai-assistant/VoiceInputButton.tsx
// Bouton micro pour saisir la question vocalement.
// Utilise MediaRecorder API navigateur → upload vers /api/ai-assistant/transcribe.

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  /** Callback appelé avec le texte transcrit */
  onTranscription: (text: string) => void;
  /** Locale pour Whisper (fr, en, es, de, pt) */
  locale?: string;
  /** Désactivé (en cours d'envoi par exemple) */
  disabled?: boolean;
}

type State = "idle" | "recording" | "transcribing" | "error";

export function VoiceInputButton({ onTranscription, locale = "fr", disabled }: Props) {
  const t = useTranslations("voiceInput");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = handleStop;
      recorder.start();
      setState("recording");
    } catch (e) {
      setErrorMsg(t("errorMic"));
      setState("error");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  async function handleStop() {
    setState("transcribing");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (blob.size === 0) {
      setState("idle");
      return;
    }

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("locale", locale);

    try {
      const resp = await fetch("/api/ai-assistant/transcribe", { method: "POST", body: formData });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${resp.status}`);
      }
      const data = await resp.json() as { transcription: string };
      onTranscription(data.transcription);
      setState("idle");
    } catch (e) {
      setErrorMsg(t("errorTranscribe") + " " + (e as Error).message);
      setState("error");
    }
  }

  if (state === "recording") {
    return (
      <button
        type="button"
        onClick={stopRecording}
        className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-rose-700 animate-pulse"
        aria-label={t("ariaStop")}
      >
        <span aria-hidden>⏹</span>
        <span>{t("btnStop")}</span>
      </button>
    );
  }

  if (state === "transcribing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-3 py-1 text-xs text-stone-600">
        <span aria-hidden className="inline-block h-2 w-2 animate-pulse rounded-full bg-teal-600" />
        {t("transcribing")}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled || state === "error"}
        className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700 hover:border-teal-500 hover:text-teal-700 disabled:opacity-50"
        aria-label={t("ariaRecord")}
        title={t("tipRecord")}
      >
        <span aria-hidden>🎤</span>
        <span>{t("btnRecord")}</span>
      </button>
      {errorMsg && (
        <p className="mt-1 text-[10px] text-rose-600" role="alert">{errorMsg}</p>
      )}
    </>
  );
}
