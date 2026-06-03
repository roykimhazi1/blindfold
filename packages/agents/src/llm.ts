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

export interface LlmClient {
  readonly mode: "mock" | "anthropic";
  complete(req: LlmRequest): Promise<string>;
}

class MockLlmClient implements LlmClient {
  readonly mode = "mock" as const;
  async complete(req: LlmRequest): Promise<string> {
    // Deterministic: echo the hint the caller prepared. Real agents pass a
    // sensible fallback string via mockHint, so output is always coherent.
    return req.mockHint ?? "";
  }
}

class AnthropicLlmClient implements LlmClient {
  readonly mode = "anthropic" as const;
  #apiKey: string;
  #model: string;
  constructor(apiKey: string, model = "claude-opus-4-8") {
    this.#apiKey = apiKey;
    this.#model = model;
  }
  async complete(req: LlmRequest): Promise<string> {
    // Lazy import keeps the SDK an optional dependency. If it isn't installed,
    // fall back to the mock hint rather than crashing the pipeline.
    let Anthropic: any;
    try {
      // @ts-ignore optional dependency — only present when AI features are enabled
      ({ default: Anthropic } = await import(/* webpackIgnore: true */ "@anthropic-ai/sdk"));
    } catch {
      return req.mockHint ?? "";
    }
    const client = new Anthropic({ apiKey: this.#apiKey });
    const res = await client.messages.create({
      model: this.#model,
      max_tokens: req.maxTokens ?? 400,
      system: [
        { type: "text", text: req.system, cache_control: { type: "ephemeral" } },
      ],
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const block = res.content?.find((b: any) => b.type === "text");
    return block?.text ?? req.mockHint ?? "";
  }
}

export function createLlmClient(): LlmClient {
  const key = typeof process !== "undefined" ? process.env?.ANTHROPIC_API_KEY : undefined;
  return key ? new AnthropicLlmClient(key) : new MockLlmClient();
}
