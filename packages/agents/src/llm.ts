// Thin LLM abstraction so the agent layer runs with OR without an API key.
// When ANTHROPIC_API_KEY is set, `createLlmClient` returns a client backed by
// the Anthropic SDK (lazily imported). Otherwise it returns a deterministic
// mock so the whole product works offline and tests stay reproducible.

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmRequest {
  system: string;
  messages: LlmMessage[];
  maxTokens?: number;
  /** Used by the mock to produce deterministic, on-topic output. */
  mockHint?: string;
}

// ── Tool use (for the specialist agents) ─────────────────────────────
// A minimal mirror of Anthropic's tool-use shapes so `runAgent` can drive a
// search → compare → submit_choice loop. Only the `anthropic` client implements
// `runConversation`; mock clients omit it, so agents fall back to a deterministic
// policy (no model, fully reproducible).

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown };

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

export type ConversationMessage =
  | { role: "user"; content: string | ToolResultBlock[] }
  | { role: "assistant"; content: ContentBlock[] };

export interface ConversationTurn {
  content: ContentBlock[];
  stopReason: string;
}

export interface ConversationRequest {
  system: string;
  messages: ConversationMessage[];
  tools: ToolDef[];
  maxTokens?: number;
}

export interface LlmClient {
  readonly mode: "mock" | "anthropic";
  complete(req: LlmRequest): Promise<string>;
  /** One tool-aware turn. Present only on clients that support tool use. */
  runConversation?(req: ConversationRequest): Promise<ConversationTurn>;
}

class MockLlmClient implements LlmClient {
  readonly mode = "mock" as const;
  async complete(req: LlmRequest): Promise<string> {
    // Deterministic: echo the hint the caller prepared. Real agents pass a
    // sensible fallback string via mockHint, so output is always coherent.
    return req.mockHint ?? "";
  }
  // No runConversation → `runAgent` uses each specialist's deterministic policy.
}

class AnthropicLlmClient implements LlmClient {
  readonly mode = "anthropic" as const;
  #apiKey: string;
  #model: string;
  constructor(apiKey: string, model = "claude-opus-4-8") {
    this.#apiKey = apiKey;
    this.#model = model;
  }

  async #sdk(): Promise<any | null> {
    try {
      // @ts-ignore optional dependency — only present when AI features are enabled
      const mod = await import(/* webpackIgnore: true */ "@anthropic-ai/sdk");
      return mod.default;
    } catch {
      return null;
    }
  }

  async complete(req: LlmRequest): Promise<string> {
    const Anthropic = await this.#sdk();
    if (!Anthropic) return req.mockHint ?? "";
    const client = new Anthropic({ apiKey: this.#apiKey });
    const res = await client.messages.create({
      model: this.#model,
      max_tokens: req.maxTokens ?? 400,
      system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const block = res.content?.find((b: any) => b.type === "text");
    return block?.text ?? req.mockHint ?? "";
  }

  async runConversation(req: ConversationRequest): Promise<ConversationTurn> {
    const Anthropic = await this.#sdk();
    if (!Anthropic) return { content: [], stopReason: "error" };
    const client = new Anthropic({ apiKey: this.#apiKey });
    const res = await client.messages.create({
      model: this.#model,
      max_tokens: req.maxTokens ?? 1024,
      system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
      tools: req.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      })),
      messages: req.messages as any,
    });
    const content: ContentBlock[] = (res.content ?? []).map((b: any) =>
      b.type === "tool_use"
        ? { type: "tool_use", id: b.id, name: b.name, input: b.input }
        : { type: "text", text: b.text ?? "" },
    );
    return { content, stopReason: res.stop_reason ?? "end" };
  }
}

export function createLlmClient(): LlmClient {
  const key = typeof process !== "undefined" ? process.env?.ANTHROPIC_API_KEY : undefined;
  return key ? new AnthropicLlmClient(key) : new MockLlmClient();
}
