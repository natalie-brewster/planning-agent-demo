import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { evalCases, type EvalCase } from "./cases";
import { FAILURE_BUCKETS, type FailureBucket } from "./taxonomy";
import { runReconciliationAgent, type AgentRunResult, type TraceStep } from "../lib/agent";
import { activeVersion, getVersion } from "../lib/versions";

export type VersionScoreEntry = {
  versionId: string;
  label: string;
  toolsChanged: boolean;
  correct: number;
  total: number;
  counts: Record<string, number>;
  /** case ids this score actually covers — lets the UI flag stale/partial coverage when new cases are added later. */
  caseIds: string[];
  timestamp: string;
};

export type GradedResult = {
  caseId: string;
  message: string;
  category: EvalCase["category"];
  knownLimitation: boolean;
  bucket: FailureBucket | "run-error";
  reasoning: string;
  toolCallCount: number;
  turnCount: number;
  elapsedMs: number;
  items: AgentRunResult["items"];
  trace: AgentRunResult["trace"];
};

const BUCKETS: FailureBucket[] = FAILURE_BUCKETS.map((b) => b.id);

const GRADER_SYSTEM_PROMPT = `You are grading a single run of a planning-reconciliation agent against a hand-written expectation. You will be given the eval case (input message, category, expectedBehavior, watchFor, whether it's a known limitation) and what the agent actually did (its tool calls and final submitted items).

Pick exactly one bucket:
${FAILURE_BUCKETS.map((b) => `- "${b.id}": ${b.description}`).join("\n")}

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
): Promise<{ bucket: FailureBucket; reasoning: string }> {
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
  return block.input as { bucket: FailureBucket; reasoning: string };
}

async function main() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

  // Usage: npm run eval [-- --version <id>] [caseId ...]
  const rawArgs = process.argv.slice(2);
  let versionId: string | undefined;
  const filterIds: string[] = [];
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--version") {
      versionId = rawArgs[++i];
    } else {
      filterIds.push(rawArgs[i]);
    }
  }
  const version = versionId ? getVersion(versionId) : activeVersion;

  const casesToRun = filterIds.length > 0 ? evalCases.filter((c) => filterIds.includes(c.id)) : evalCases;

  if (casesToRun.length === 0) {
    console.error(`No cases matched: ${filterIds.join(", ")}`);
    process.exit(1);
  }

  console.log(`Running against version "${version.label}" (${version.id})\n`);

  const results: GradedResult[] = [];

  for (const evalCase of casesToRun) {
    const start = Date.now();
    process.stdout.write(`${evalCase.id.padEnd(32)} `);

    try {
      const result = await runReconciliationAgent(evalCase.message, version.id);
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

  // Only the full suite produces a score that's fair to compare across
  // versions — a filtered run (npm run eval -- some-case-id) would record a
  // misleading "1/1" against this version, so skip it in that case.
  if (filterIds.length === 0) {
    const scoresPath = resolve(process.cwd(), "src/eval/version-scores.json");
    let scores: VersionScoreEntry[] = [];
    try {
      scores = JSON.parse(readFileSync(scoresPath, "utf-8"));
    } catch {
      scores = [];
    }

    const entry: VersionScoreEntry = {
      versionId: version.id,
      label: version.label,
      toolsChanged: version.toolsChanged,
      correct: counts["correct"] ?? 0,
      total: results.length,
      counts,
      caseIds: casesToRun.map((c) => c.id),
      timestamp: new Date().toISOString(),
    };

    const existingIndex = scores.findIndex((s) => s.versionId === entry.versionId);
    if (existingIndex >= 0) scores[existingIndex] = entry;
    else scores.push(entry);

    writeFileSync(scoresPath, JSON.stringify(scores, null, 2));
    console.log(`Recorded score for "${version.label}": ${entry.correct}/${entry.total} correct`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
