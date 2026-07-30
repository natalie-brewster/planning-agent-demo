import Anthropic from "@anthropic-ai/sdk";
import { executeTool } from "./tools";
import { activeVersion, getVersion } from "./versions";
import type { ProposedWork } from "./types";

export type TraceStep =
  | { type: "user_message"; content: string; at: number }
  | { type: "assistant_text"; content: string; at: number }
  | { type: "tool_call"; id: string; name: string; input: unknown; at: number }
  | { type: "tool_result"; id: string; name: string; output: unknown; at: number }
  | { type: "final_result"; items: ProposedWork[]; at: number }
  | { type: "error"; message: string; at: number };

export type AgentRunResult = {
  trace: TraceStep[];
  items: ProposedWork[] | null;
  toolCallCount: number;
  turnCount: number;
  elapsedMs: number;
  inputTokens: number;
  outputTokens: number;
};

const MAX_TURNS = 6;

export async function runReconciliationAgent(
  userMessage: string,
  versionId?: string
): Promise<AgentRunResult> {
  const version = versionId ? getVersion(versionId) : activeVersion;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const started = Date.now();
  console.log("[agent] Starting runReconciliationAgent", { model, started, userMessage, versionId: version.id });

  const trace: TraceStep[] = [{ type: "user_message", content: userMessage, at: Date.now() - started }];
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }];
  console.log("[agent] Initial messages prepared", { messages });

  let items: ProposedWork[] | null = null;
  let toolCallCount = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let turn = 0;

  while (turn < MAX_TURNS && items === null) {
    turn += 1;
    console.log(`[agent] Beginning turn ${turn}`);
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: version.prompt,
      tools: version.tools,
      messages,
    });

    inputTokens += response.usage.input_tokens;
    outputTokens += response.usage.output_tokens;
    console.log(`[agent] Received assistant response for turn ${turn}`, {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      stop_reason: response.stop_reason,
    });
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) {
        console.log(`[agent] Assistant text block (turn ${turn}):`, block.text);
        trace.push({ type: "assistant_text", content: block.text, at: Date.now() - started });
      }
      if (block.type === "tool_use") {
        toolCallCount += 1;
        console.log(`[agent] Tool use requested (turn ${turn})`, { id: block.id, name: block.name, input: block.input });
        trace.push({ type: "tool_call", id: block.id, name: block.name, input: block.input, at: Date.now() - started });

        if (block.name === "submit_reconciliation") {
          const input = block.input as { items: ProposedWork[] };
          console.log(`[agent] Received submit_reconciliation with items:`, input.items);
          items = input.items;
          trace.push({ type: "final_result", items: input.items, at: Date.now() - started });
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: "Recorded." });
          continue;
        }

        try {
          console.log(`[agent] Executing tool ${block.name}`, { input: block.input });
          const output = executeTool(block.name, block.input as Record<string, unknown>);
          console.log(`[agent] Tool ${block.name} returned`, { output });
          trace.push({ type: "tool_result", id: block.id, name: block.name, output, at: Date.now() - started });
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(output) });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Tool execution failed.";
          console.error(`[agent] Error executing tool ${block.name}:`, message);
          trace.push({ type: "error", message, at: Date.now() - started });
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: message, is_error: true });
        }
      }
    }

    if (items !== null) break;
    if (response.stop_reason !== "tool_use") {
      console.log(`[agent] Stopping agent loop: stop_reason=${response.stop_reason}`);
      break; // model stopped without finalizing
    }
    messages.push({ role: "user", content: toolResults });
  }

  const result: AgentRunResult = {
    trace,
    items,
    toolCallCount,
    turnCount: turn,
    elapsedMs: Date.now() - started,
    inputTokens,
    outputTokens,
  };

  console.log("[agent] Finished runReconciliationAgent", {
    turnCount: result.turnCount,
    toolCallCount: result.toolCallCount,
    elapsedMs: result.elapsedMs,
    items: result.items,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return result;
}
