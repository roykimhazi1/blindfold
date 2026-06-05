import type {
  LlmClient,
  ToolDef,
  ContentBlock,
  ConversationMessage,
  ToolResultBlock,
} from "./llm.ts";

// ── Agent runtime ────────────────────────────────────────────────────
// A small, safe tool-use loop. An agent is given tools (its hands) and must
// finish by calling a terminal `submit` tool that yields a TYPED result. If
// there's no tool-capable model, or the model misbehaves / runs long, we fall
// back to a deterministic policy — so the agent layer is reproducible and never
// blocks the product. The model only ever *chooses*; the tool executors (code)
// own the real data and the price.

export interface AgentSpec<T> {
  /** Domain-scoped system prompt. */
  system: string;
  /** The opening task message. */
  task: string;
  /** Tools the model may call (search/get + the terminal submit tool). */
  tools: ToolDef[];
  /** Executors for non-terminal tools: name → (input) → JSON string result. */
  executors: Record<string, (input: unknown) => Promise<string>>;
  /** Name of the terminal tool that ends the loop with the answer. */
  submitToolName: string;
  /** Parse/validate the submit payload into the typed result (null = invalid). */
  parseSubmit: (input: unknown) => T | null;
  /** Deterministic fallback when there's no model (or it misbehaves). */
  mock: () => Promise<T | null>;
  /** Max model turns before forcing the fallback. */
  maxSteps?: number;
}

function toolUses(content: ContentBlock[]): Array<Extract<ContentBlock, { type: "tool_use" }>> {
  return content.filter((b): b is Extract<ContentBlock, { type: "tool_use" }> => b.type === "tool_use");
}

export async function runAgent<T>(llm: LlmClient, spec: AgentSpec<T>): Promise<T | null> {
  // No tool-capable model ⇒ deterministic policy (mock mode, tests, offline).
  if (llm.mode !== "anthropic" || typeof llm.runConversation !== "function") {
    return spec.mock();
  }

  const messages: ConversationMessage[] = [{ role: "user", content: spec.task }];
  const maxSteps = spec.maxSteps ?? 6;

  for (let step = 0; step < maxSteps; step++) {
    let turn;
    try {
      turn = await llm.runConversation({
        system: spec.system,
        messages,
        tools: spec.tools,
        maxTokens: 1024,
      });
    } catch {
      return spec.mock();
    }

    messages.push({ role: "assistant", content: turn.content });
    const calls = toolUses(turn.content);
    if (calls.length === 0) break; // model stopped without submitting

    const submit = calls.find((c) => c.name === spec.submitToolName);
    if (submit) {
      const parsed = spec.parseSubmit(submit.input);
      return parsed ?? spec.mock();
    }

    // Run the requested tools and feed results back for the next turn.
    const results: ToolResultBlock[] = [];
    for (const call of calls) {
      const exec = spec.executors[call.name];
      const out = exec ? await exec(call.input) : `Unknown tool: ${call.name}`;
      results.push({ type: "tool_result", tool_use_id: call.id, content: out });
    }
    messages.push({ role: "user", content: results });
  }

  return spec.mock(); // ran long or stalled — keep the product moving
}
