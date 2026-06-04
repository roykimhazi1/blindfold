import { test } from "node:test";
import assert from "node:assert/strict";
import { exampleParams, CATALOG, mockProviders } from "@sv/engine";
import { chooseFlight, allocateEnvelope } from "./specialists.ts";
import type { LlmClient, ConversationTurn } from "./llm.ts";

const dest = CATALOG.find((d) => d.id === "larnaca-cy")!;
const env = allocateEnvelope(2000);

// A fake tool-using model: turn 1 searches, turn 2 submits a valid offerId.
function scriptedAgent(): LlmClient {
  let turn = 0;
  return {
    mode: "anthropic",
    async complete() {
      return "";
    },
    async runConversation(): Promise<ConversationTurn> {
      turn++;
      if (turn === 1) {
        return {
          content: [{ type: "tool_use", id: "t1", name: "search_flights", input: {} }],
          stopReason: "tool_use",
        };
      }
      return {
        content: [
          {
            type: "tool_use",
            id: "t2",
            name: "submit_choice",
            input: { offerId: "fl_0", rationale: "cheapest, civilised times" },
          },
        ],
        stopReason: "tool_use",
      };
    },
  };
}

test("a specialist agent reasons via tools and submits a typed choice", async () => {
  const choice = await chooseFlight(dest, exampleParams(), env, mockProviders, scriptedAgent());
  assert.ok(choice, "expected a choice");
  assert.equal(choice!.quote.destinationId, dest.id, "code owns the real quote, not the model");
  assert.equal(choice!.rationale, "cheapest, civilised times", "the model's rationale is kept");
});

test("a model that never submits falls back to the deterministic policy", async () => {
  const chatty: LlmClient = {
    mode: "anthropic",
    async complete() {
      return "";
    },
    async runConversation() {
      return { content: [{ type: "text", text: "let me think..." }], stopReason: "end" };
    },
  };
  const choice = await chooseFlight(dest, exampleParams(), env, mockProviders, chatty);
  assert.ok(choice);
  assert.match(choice!.rationale, /flight envelope/, "fell back to the deterministic rationale");
});

test("an invalid offerId in submit falls back to the deterministic policy", async () => {
  const bogus: LlmClient = {
    mode: "anthropic",
    async complete() {
      return "";
    },
    async runConversation() {
      return {
        content: [{ type: "tool_use", id: "t", name: "submit_choice", input: { offerId: "nope" } }],
        stopReason: "tool_use",
      };
    },
  };
  const choice = await chooseFlight(dest, exampleParams(), env, mockProviders, bogus);
  assert.ok(choice);
  assert.match(choice!.rationale, /flight envelope/);
});
