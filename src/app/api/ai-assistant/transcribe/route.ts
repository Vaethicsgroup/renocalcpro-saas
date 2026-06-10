// app/api/ai-assistant/transcribe/route.ts
// POST audio file (multipart) → transcription Whisper.
// MOCK-friendly : si ANTHROPIC_API_KEY ou OPENAI_API_KEY absent, renvoie message stub.
//
// Note : Anthropic n'a pas Whisper, on utilise l'API OpenAI Whisper (compatible).
// Pour usage 100% Anthropic, remplacer par un endpoint Anthropic ASR si disponible
// dans le futur, ou par un service tiers OVH (Vox, Coqui).

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB Whisper limit
const ALLOWED_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const audio = formData.get("audio");
  const locale = (formData.get("locale") as string) ?? "fr";

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "missing_audio_file" }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: "audio_too_large", maxBytes: MAX_AUDIO_SIZE }, { status: 413 });
  }
  if (audio.type && !ALLOWED_TYPES.includes(audio.type)) {
    return NextResponse.json({ error: "audio_type_not_supported", allowed: ALLOWED_TYPES }, { status: 415 });
  }

  // Mode MOCK : renvoyer une transcription stub
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      transcription: "(Mode démonstration — la transcription Whisper réelle sera activée avec OPENAI_API_KEY.)",
      durationS: Math.round(audio.size / 16000),
      mock: true,
      languageDetected: locale,
    });
  }

  // Whisper API
  try {
    const fwForm = new FormData();
    fwForm.append("file", audio, audio.name || `recording.${audio.type.split("/")[1] || "webm"}`);
    fwForm.append("model", "whisper-1");
    fwForm.append("response_format", "json");
    if (locale && locale !== "auto") {
      fwForm.append("language", locale);
    }

    const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: fwForm,
    });
    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ error: "whisper_failed", detail: err.slice(0, 200) }, { status: 502 });
    }
    const json = (await resp.json()) as { text: string };
    return NextResponse.json({
      transcription: json.text,
      languageDetected: locale,
      mock: false,
    });
  } catch (e) {
    return NextResponse.json({ error: "whisper_error", message: (e as Error).message }, { status: 502 });
  }
}
