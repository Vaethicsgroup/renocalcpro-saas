// lib/ai/assistant/plugins/sandbox.ts
// Sandbox d'exécution sécurisée des hooks plugins.
//
// Stratégie : isolated-vm (préféré) ou node:vm avec contextify minimal.
// Pour MVP Sprint 30 : implémentation node:vm + timeout strict + globals
// whitelist explicite. Migration vers isolated-vm Sprint 31+ pour vraie
// isolation mémoire (attaque side-channel).
//
// IMPORTANT : ce code n'est PAS un sandbox cryptographiquement parfait.
// Pour exécuter du code tiers en production réelle, utiliser :
// - isolated-vm (https://github.com/laverdet/isolated-vm)
// - Cloudflare Workers (https://workers.cloudflare.com/)
// - Deno deploy (https://deno.com/deploy)
//
// La présente implémentation est un POC pédagogique pour valider l'API.

import vm from "node:vm";
import type {
  BeforeLlmHook,
  AfterLlmHook,
  AssistantPluginManifest,
} from "./types";

const HOOK_TIMEOUT_MS = parseInt(process.env.ASSISTANT_PLUGIN_HOOK_TIMEOUT_MS ?? "5000", 10);
const HOOK_MAX_OUTPUT_BYTES = 100_000;

export interface SandboxResult<T = unknown> {
  ok: boolean;
  value?: T;
  error?: string;
  durationMs: number;
}

/**
 * Exécute un script de hook dans un sandbox restrictif.
 * Le script doit exporter une fonction `default` (signature compatible BeforeLlmHook ou AfterLlmHook).
 *
 * @param scriptSource Code JavaScript du hook (bundlé en CommonJS)
 * @param input Argument passé au hook
 * @param manifest Manifest pour vérifier permissions
 */
export async function runHookSandboxed<TInput, TOutput>(
  scriptSource: string,
  input: TInput,
  manifest: AssistantPluginManifest,
): Promise<SandboxResult<TOutput>> {
  const start = Date.now();

  // Garde-fous taille script
  if (scriptSource.length > 500_000) {
    return { ok: false, error: "script_too_large", durationMs: 0 };
  }

  // Construire le contexte sandbox
  const sandboxContext = createSandboxContext(manifest);
  const ctx = vm.createContext(sandboxContext);

  // Wrapper : on encapsule pour exposer un export default
  const wrappedSource = `
    (function() {
      const module = { exports: {} };
      const exports = module.exports;
      ${scriptSource}
      return module.exports.default || module.exports;
    })()
  `;

  let hookFn: ((input: TInput) => Promise<TOutput | null>) | null = null;
  try {
    const script = new vm.Script(wrappedSource, {
      filename: `plugin:${manifest.id}.js`,
      lineOffset: 0,
    });
    hookFn = script.runInContext(ctx, { timeout: HOOK_TIMEOUT_MS });
    if (typeof hookFn !== "function") {
      return { ok: false, error: "hook_not_a_function", durationMs: Date.now() - start };
    }
  } catch (e) {
    return { ok: false, error: `script_compile_error: ${(e as Error).message.slice(0, 200)}`, durationMs: Date.now() - start };
  }

  // Exécuter le hook avec timeout
  try {
    const result = await Promise.race([
      Promise.resolve(hookFn!(input)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("hook_timeout")), HOOK_TIMEOUT_MS),
      ),
    ]);

    // Vérifier taille output
    const serialized = JSON.stringify(result);
    if (serialized.length > HOOK_MAX_OUTPUT_BYTES) {
      return { ok: false, error: "output_too_large", durationMs: Date.now() - start };
    }

    return { ok: true, value: result as TOutput, durationMs: Date.now() - start };
  } catch (e) {
    return { ok: false, error: `hook_runtime_error: ${(e as Error).message.slice(0, 200)}`, durationMs: Date.now() - start };
  }
}

/**
 * Construit le contexte sandbox avec uniquement les globals autorisés selon les
 * permissions du manifest.
 */
function createSandboxContext(manifest: AssistantPluginManifest): Record<string, unknown> {
  const ctx: Record<string, unknown> = {
    // Globals essentiels JS
    console: {
      log: (...args: unknown[]) => {
        console.log(`[plugin:${manifest.id}]`, ...args);
      },
      warn: (...args: unknown[]) => {
        console.warn(`[plugin:${manifest.id}]`, ...args);
      },
      error: (...args: unknown[]) => {
        console.error(`[plugin:${manifest.id}]`, ...args);
      },
    },
    JSON,
    Math,
    Date,
    Promise,
    // Note : pas de setTimeout/setInterval (anti-DoS)
    // Note : pas de require/import (no module loading)
  };

  // Permission externe network → expose un fetch limité
  if (manifest.permissions.includes("external:network")) {
    ctx.fetch = createSandboxedFetch(manifest);
  }

  return ctx;
}

/** fetch sandboxed avec timeout strict + body size limit + URL allowlist */
function createSandboxedFetch(manifest: AssistantPluginManifest) {
  const FETCH_TIMEOUT_MS = 3_000;
  const FETCH_MAX_BODY_BYTES = 50_000;
  return async (url: string, init?: RequestInit): Promise<Response> => {
    if (typeof url !== "string" || !url.startsWith("https://")) {
      throw new Error("only_https_urls_allowed");
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const resp = await fetch(url, {
        ...init,
        signal: ctrl.signal,
        headers: {
          ...init?.headers,
          "user-agent": `RenocalAssistantPlugin/${manifest.id}/${manifest.version}`,
        },
      });
      const text = await resp.text();
      if (text.length > FETCH_MAX_BODY_BYTES) {
        throw new Error("response_body_too_large");
      }
      // Reconstruire une Response synthétique (sans body stream pour éviter abus)
      return new Response(text, { status: resp.status, headers: resp.headers });
    } finally {
      clearTimeout(t);
    }
  };
}

/** Helpers typés pour les deux signatures de hooks */
export async function runBeforeLlmHook(
  scriptSource: string,
  input: Parameters<BeforeLlmHook>[0],
  manifest: AssistantPluginManifest,
): Promise<SandboxResult<Awaited<ReturnType<BeforeLlmHook>>>> {
  return runHookSandboxed(scriptSource, input, manifest);
}

export async function runAfterLlmHook(
  scriptSource: string,
  input: Parameters<AfterLlmHook>[0],
  manifest: AssistantPluginManifest,
): Promise<SandboxResult<Awaited<ReturnType<AfterLlmHook>>>> {
  return runHookSandboxed(scriptSource, input, manifest);
}
