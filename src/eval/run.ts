import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { evalCases, type EvalCase } from "./cases";
import { runReconciliationAgent, type AgentRunResult, type TraceStep } from "../lib/agent";

// The six buckets from the failure taxonomy. "correct" isn't a failure, it's
// the sixth possible verdict — every case lands in exactly one of these.
type Bucket =
  | "correct"
  | "wrong-tool"
  | "right-tool-wrong-args"
  | "no-tool-called"
  | "hallucinated-data"
  | "incomplete";

export type GradedResult = {
  caseId: string;
  message: string;
  category: EvalCase["category"];
  knownLimitation: boolean;
  bucket: Bucket | "run-error";
  reasoning: string;
  toolCallCount: number;
  turnCount: number;
  elapsedMs: number;
  items: AgentRunResult["items"];
  trace: AgentRunResult["trace"];
};

const BUCKETS: Bucket[] = [
  "correct",
  "wrong-tool",
  "right-tool-wrong-args",
  "no-tool-called",
  "hallucinated-data",
  "incomplete",
];

const GRADER_SYSTEM_PROMPT = `You are grading a single run of a planning-reconciliation agent against a hand-written expectation. You will be given the eval case (input message, category, expectedBehavior, watchFor, whether it's a known limitation) and what the agent actually did (its tool calls and final submitted items).

Pick exactly one bucket:
- "correct": behavior is defensible and matches expectedBehavior, even if not a perfect match to the example wording.
- "wrong-tool": called a tool that doesn't fit the situation (e.g. fabricated a submit_reconciliation item for a creation-request or off-topic message that described no real activity).
- "right-tool-wrong-args": called reasonable tools, but arguments are wrong (bad taskId/goalId match, wrong duration, wrong outcome).
- "no-tool-called": failed to call a tool it needed to call — most commonly skipping get_recent_events, or never calling submit_reconciliation at all (hit max turns without finalizing).
- "hallucinated-data": invented a taskId or goalId that was never returned by search_tasks/search_goals, or invented activity the user never described.
- "incomplete": partially right but missing something — merged distinct activities into fewer items, wrong/missing effectiveDate, dropped an activity from a multi-activity report, or (for known-limitation duplicate cases) failed to note the overlap in its explanation.

If knownLimitation is true, grade what actually happened but don't be harsher than the case's own expectedBehavior asks for — these are cases we already know the system can't fully solve.

Call the grade tool exactly once with your verdict.`;

const GRADER_TOOL: Anthropic.Tool = {
  name: "grade",
  description: "Record the grading verdict for this eval case.",
  input_schema: {
    type: "object",
    properties: {
      bucket: {
        type: "string",
        enum: BUCKETS,
        description: "The single best-fitting bucket.",
      },
      reasoning: {
        type: "string",
        description: "One or two sentences citing the specific tool call(s) or field value(s) that drove this verdict.",
      },
    },
    required: ["bucket", "reasoning"],
  },
};

function isToolCallStep(step: TraceStep): step is Extract<TraceStep, { type: "tool_call" }> {
  return step.type === "tool_call";
}

async function gradeCase(
  client: Anthropic,
  model: string,
  evalCase: EvalCase,
  result: AgentRunResult
): Promise<{ bucket: Bucket; reasoning: string }> {
  const toolCalls = result.trace.filter(isToolCallStep).map((step) => ({ name: step.name, input: step.input }));

  const payload = {
    message: evalCase.message,
    category: evalCase.category,
    expectedBehavior: evalCase.expectedBehavior,
    watchFor: evalCase.watchFor,
    knownLimitation: evalCase.knownLimitation ?? false,
    toolCallsMade: toolCalls,
    finalItems: result.items,
  };

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    system: GRADER_SYSTEM_PROMPT,
    tools: [GRADER_TOOL],
    tool_choice: { type: "tool", name: "grade" },
    messages: [{ role: "user", content: JSON.stringify(payload, null, 2) }],
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Grader did not return a tool_use block.");
  }
  return block.input as { bucket: Bucket; reasoning: string };
}

async function main() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  const filterIds = process.argv.slice(2);
  const casesToRun = filterIds.length > 0 ? evalCases.filter((c) => filterIds.includes(c.id)) : evalCases;

  if (casesToRun.length === 0) {
    console.error(`No cases matched: ${filterIds.join(", ")}`);
    process.exit(1);
  }

  const results: GradedResult[] = [];

  for (const evalCase of casesToRun) {
    const start = Date.now();
    process.stdout.write(`${evalCase.id.padEnd(32)} `);

    try {
      const result = await runReconciliationAgent(evalCase.message);
      const grade = await gradeCase(client, model, evalCase, result);

      results.push({
        caseId: evalCase.id,
        message: evalCase.message,
        category: evalCase.category,
        knownLimitation: evalCase.knownLimitation ?? false,
        bucket: grade.bucket,
        reasoning: grade.reasoning,
        toolCallCount: result.toolCallCount,
        turnCount: result.turnCount,
        elapsedMs: result.elapsedMs,
        items: result.items,
        trace: result.trace,
      });

      console.log(`${grade.bucket.padEnd(22)} (${Date.now() - start}ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        caseId: evalCase.id,
        message: evalCase.message,
        category: evalCase.category,
        knownLimitation: evalCase.knownLimitation ?? false,
        bucket: "run-error",
        reasoning: message,
        toolCallCount: 0,
        turnCount: 0,
        elapsedMs: Date.now() - start,
        items: null,
        trace: [],
      });
      console.log(`run-error (${message})`);
    }
  }

  const counts: Record<string, number> = {};
  for (const r of results) counts[r.bucket] = (counts[r.bucket] ?? 0) + 1;

  console.log("\n=== Summary ===");
  for (const bucket of [...BUCKETS, "run-error"]) {
    if (counts[bucket]) console.log(`${bucket.padEnd(22)} ${counts[bucket]}/${results.length}`);
  }

  const realFailures = results.filter((r) => r.bucket !== "correct" && !r.knownLimitation);
  const knownLimitationMisses = results.filter((r) => r.bucket !== "correct" && r.knownLimitation);

  console.log(`\n${realFailures.length} unexpected failure(s):`);
  for (const r of realFailures) {
    console.log(`  [${r.bucket}] ${r.caseId} — ${r.reasoning}`);
  }

  if (knownLimitationMisses.length > 0) {
    console.log(`\n${knownLimitationMisses.length} known-limitation miss(es) (not counted above):`);
    for (const r of knownLimitationMisses) {
      console.log(`  [${r.bucket}] ${r.caseId} — ${r.reasoning}`);
    }
  }

  const outPath = resolve(process.cwd(), "src/eval/results.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${results.length} result(s) to src/eval/results.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
