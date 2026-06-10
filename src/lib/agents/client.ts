// src/lib/agents/client.ts
// Client Anthropic + helpers cache + retry. Fail-closed : si ANTHROPIC_API_KEY
// manque, l'appel jette une erreur claire (l'orchestrateur peut désactiver les
// agents proprement via FEATURE_AGENTS_ENABLED).

import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { Redis } from "@upstash/redis";

const apiKey = process.env.ANTHROPIC_API_KEY || "";
let _client: Anthropic | null = null;

export function anthropicClient(): Anthropic {
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY manquante — agents Claude indisponibles");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });
  }
  return _client;
}

const redis = process.env.REDIS_URL ? Redis.fromEnv() : null;
const CACHE_TTL_SEC = 60 * 60 * 24; // 24 h

function cacheKey(model: string, system: string, user: string): string {
  const h = createHash("sha256")
    .update(model)
    .update("\x00")
    .update(system)
    .update("\x00")
    .update(user)
    .digest("hex")
    .slice(0, 32);
  return `claude:cache:${h}`;
}

interface InvokeArgs {
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
  noCache?: boolean;
}

interface InvokeResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  cached: boolean;
  modelUsed: string;
}

export async function invokeClaude({
  model, system, user, maxTokens = 4096, temperature = 0.2,
  signal, noCache = false,
}: InvokeArgs): Promise<InvokeResult> {
  const t0 = Date.now();

  // 1. Cache lookup
  if (!noCache && redis) {
    const key = cacheKey(model, system, user);
    const cached = await redis.get<InvokeResult>(key);
    if (cached) {
      return { ...cached, cached: true, durationMs: Date.now() - t0 };
    }
  }

  // 2. Appel Claude avec retry exponentiel (3 tentatives sur 429/5xx)
  const client = anthropicClient();
  let resp: Awaited<ReturnType<typeof client.messages.create>>;
  let attempt = 0;
  for (;;) {
    try {
      resp = await client.messages.create(
        {
          model,
          max_tokens: maxTokens,
          temperature,
          system,
          messages: [{ role: "user", content: user }],
        },
        { signal },
      );
      break;
    } catch (err: unknown) {
      attempt++;
      const e = err as { status?: number; message?: string };
      const retriable = e.status === 429 || (e.status != null && e.status >= 500);
      if (!retriable || attempt >= 3 || signal?.aborted) throw err;
      // Backoff exponentiel : 500 ms, 2 s, 8 s + jitter
      const delay = 500 * Math.pow(4, attempt - 1) + Math.floor(Math.random() * 250);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  const textBlock = resp.content.find((c) => c.type === "text");
  const text = textBlock?.type === "text" ? textBlock.text : "";

  const result: InvokeResult = {
    text,
    inputTokens: resp.usage.input_tokens,
    outputTokens: resp.usage.output_tokens,
    durationMs: Date.now() - t0,
    cached: false,
    modelUsed: model,
  };

  // 3. Cache write
  if (!noCache && redis) {
    const key = cacheKey(model, system, user);
    await redis.setex(key, CACHE_TTL_SEC, JSON.stringify(result));
  }

  return result;
}
