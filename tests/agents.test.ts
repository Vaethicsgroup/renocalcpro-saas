// tests/agents.test.ts — Tests sur l'orchestrator + agents (mock Anthropic SDK).

import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.FEATURE_AGENTS_ENABLED = "true";
process.env.ANTHROPIC_API_KEY = "sk-test-mock";

// ─── Mock du SDK Anthropic ────────────────────────────────────────────────
const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class FakeAnthropic {
      messages = { create: mockCreate };
    },
  };
});

// Pas de Redis dans les tests
vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: () => null },
}));

import { invokeClaude } from "@/lib/agents/client";
import { orchestrate } from "@/lib/agents/orchestrator";
import { buildingAgent } from "@/lib/agents/agents/buildingAgent";

beforeEach(() => {
  mockCreate.mockReset();
});

// ─── invokeClaude — comportement de base ──────────────────────────────────
describe("invokeClaude", () => {
  it("retourne text + tokens depuis la réponse Anthropic", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "{\"ok\":true}" }],
      usage: { input_tokens: 50, output_tokens: 12 },
    });

    const r = await invokeClaude({ model: "claude-haiku-4-5-20251001", system: "sys", user: "u" });
    expect(r.text).toBe("{\"ok\":true}");
    expect(r.inputTokens).toBe(50);
    expect(r.outputTokens).toBe(12);
    expect(r.cached).toBe(false);
    expect(r.modelUsed).toBe("claude-haiku-4-5-20251001");
  });

  it("réessaie sur 429 puis réussit", async () => {
    const err: Error & { status?: number } = new Error("Too many requests");
    err.status = 429;
    mockCreate
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "ok" }],
        usage: { input_tokens: 1, output_tokens: 1 },
      });

    const r = await invokeClaude({ model: "m", system: "s", user: "u" });
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(r.text).toBe("ok");
  });

  it("propage l'erreur après 3 tentatives sur 500", async () => {
    const err: Error & { status?: number } = new Error("server crash");
    err.status = 500;
    mockCreate.mockRejectedValue(err);

    await expect(invokeClaude({ model: "m", system: "s", user: "u" }))
      .rejects.toThrow("server crash");
    expect(mockCreate).toHaveBeenCalledTimes(3);
  }, 30_000);

  it("ne réessaie pas sur 400 (erreur client)", async () => {
    const err: Error & { status?: number } = new Error("bad request");
    err.status = 400;
    mockCreate.mockRejectedValue(err);
    await expect(invokeClaude({ model: "m", system: "s", user: "u" })).rejects.toThrow();
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("respecte AbortSignal", async () => {
    const ac = new AbortController();
    ac.abort();
    mockCreate.mockRejectedValueOnce(Object.assign(new Error("aborted"), { status: 0 }));
    await expect(invokeClaude({ model: "m", system: "s", user: "u", signal: ac.signal }))
      .rejects.toThrow();
  });
});

// ─── buildingAgent — parse + prompt ────────────────────────────────────────
describe("buildingAgent", () => {
  it("buildPrompt inclut année + adresse", () => {
    const p = buildingAgent.buildPrompt(
      { yearBuilt: 1980, surfaceM2: 110, city: "Lyon", postalCode: "69001" },
      { projectId: "proj1", organizationId: "org1" },
    );
    expect(p).toContain("1980");
    expect(p).toContain("Lyon");
    expect(p).toContain("69001");
  });

  it("parseOutput accepte un JSON propre", () => {
    const r = buildingAgent.parseOutput(JSON.stringify({
      era: "1948_1974",
      probableConstruction: { walls: { material: "x", thickness_cm_estimate: 30, u_estimate: 1.8, comment: "" }, floor: { material: "x", insulation: "none", comment: "" }, roof: { material: "x", insulation: "none", comment: "" }, windows: { type: "x", u_estimate: 4.2, comment: "" } },
      pathologyRisks: [],
      heritageConstraints: { abf: false, spr: false, mh: false, iteAllowed: true, notes: "" },
      urbanConstraints: { mitoyennete: false, cosLimit: false, notes: "" },
      recommendedNextChecks: [],
    }));
    expect(r.era).toBe("1948_1974");
  });

  it("parseOutput accepte du JSON entouré de markdown", () => {
    const raw = "```json\n{\"era\":\"post_2012\"}\n```";
    const r = buildingAgent.parseOutput(raw);
    expect(r.era).toBe("post_2012");
  });

  it("parseOutput jette si pas de JSON", () => {
    expect(() => buildingAgent.parseOutput("plain text")).toThrow();
  });
});

// ─── orchestrate — séquencement & tokens ──────────────────────────────────
describe("orchestrate", () => {
  it("appelle envelope + systems en parallèle puis aids puis synthesis", async () => {
    // 4 réponses successives (envelope, systems, aids, synthesis)
    mockCreate
      .mockResolvedValueOnce({ content: [{ type: "text", text: "{\"diagnostic\":\"ok\",\"parois\":[]}" }], usage: { input_tokens: 100, output_tokens: 50 } })
      .mockResolvedValueOnce({ content: [{ type: "text", text: "{\"systems\":[]}" }], usage: { input_tokens: 80, output_tokens: 30 } })
      .mockResolvedValueOnce({ content: [{ type: "text", text: "{\"aids\":[]}" }], usage: { input_tokens: 200, output_tokens: 60 } })
      .mockResolvedValueOnce({ content: [{ type: "text", text: "{\"summary\":\"final\"}" }], usage: { input_tokens: 500, output_tokens: 800 } });

    const steps: Array<{ agent: string; status: string }> = [];
    const r = await orchestrate({
      projectId: "p1",
      organizationId: "o1",
      buildingData: { yearBuilt: 1980 },
      envelopeData: { walls: [] },
      systemsData: { heating: "gaz" },
      onStep: (s) => steps.push({ agent: s.agent, status: s.status }),
    });

    expect(mockCreate).toHaveBeenCalledTimes(4);
    expect(r.steps).toHaveLength(4);
    expect(r.steps.map(s => s.agent)).toEqual(["envelope", "systems", "aids", "synthesis"]);
    expect(r.totalTokensIn).toBe(100 + 80 + 200 + 500);
    expect(r.totalTokensOut).toBe(50 + 30 + 60 + 800);
    expect((r.finalOutput as { summary: string }).summary).toBe("final");

    // onStep callbacks : 4 starts + 4 dones
    expect(steps.filter(s => s.status === "started")).toHaveLength(4);
    expect(steps.filter(s => s.status === "done")).toHaveLength(4);
  });

  it("jette si FEATURE_AGENTS_ENABLED=false", async () => {
    process.env.FEATURE_AGENTS_ENABLED = "false";
    await expect(
      orchestrate({
        projectId: "p", organizationId: "o",
        buildingData: {}, envelopeData: {}, systemsData: {},
      })
    ).rejects.toThrow(/désactivée/);
    process.env.FEATURE_AGENTS_ENABLED = "true";
  });

  it("propage l'erreur d'un sub-agent", async () => {
    mockCreate
      .mockRejectedValueOnce(Object.assign(new Error("Anthropic 503"), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error("Anthropic 503"), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error("Anthropic 503"), { status: 503 }));

    await expect(
      orchestrate({
        projectId: "p", organizationId: "o",
        buildingData: {}, envelopeData: {}, systemsData: {},
      })
    ).rejects.toThrow();
  }, 30_000);

  it("respecte AbortSignal", async () => {
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 5);

    const err = Object.assign(new Error("aborted"), { name: "AbortError" });
    mockCreate.mockRejectedValue(err);

    await expect(
      orchestrate({
        projectId: "p", organizationId: "o",
        buildingData: {}, envelopeData: {}, systemsData: {},
        signal: ac.signal,
      })
    ).rejects.toThrow();
  });
});
