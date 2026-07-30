"use client";

import { useEffect, useState } from "react";
import type { GradedResult } from "@/eval/run";
import TraceView from "./TraceView";

const BUCKET_ORDER = [
  "correct",
  "wrong-tool",
  "right-tool-wrong-args",
  "no-tool-called",
  "hallucinated-data",
  "incomplete",
  "run-error",
];

const BUCKET_DOT: Record<string, string> = {
  correct: "bg-emerald-500",
  "wrong-tool": "bg-red-500",
  "right-tool-wrong-args": "bg-orange-500",
  "no-tool-called": "bg-yellow-500",
  "hallucinated-data": "bg-pink-500",
  incomplete: "bg-blue-500",
  "run-error": "bg-zinc-500",
};

export default function EvalDashboard() {
  const [results, setResults] = useState<GradedResult[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/eval")
      .then((res) => res.json())
      .then(setResults);
  }, []);

  if (results === null) {
    return <p className="text-sm text-zinc-500">Loading eval results...</p>;
  }

  if (results.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No eval results yet. Run <code className="font-mono">npm run eval</code> to generate{" "}
        <code className="font-mono">src/eval/results.json</code>.
      </p>
    );
  }

  const counts: Record<string, number> = {};
  for (const r of results) counts[r.bucket] = (counts[r.bucket] ?? 0) + 1;
  const realFailures = results.filter((r) => r.bucket !== "correct" && !r.knownLimitation).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {BUCKET_ORDER.filter((b) => counts[b]).map((bucket) => (
          <div
            key={bucket}
            className="flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-800"
          >
            <span className={`h-2 w-2 rounded-full ${BUCKET_DOT[bucket] ?? "bg-zinc-400"}`} />
            <span className="font-mono">{bucket}</span>
            <span className="font-semibold">
              {counts[bucket]}/{results.length}
            </span>
          </div>
        ))}
        <span className="ml-auto text-xs text-zinc-500">
          {realFailures} unexpected failure{realFailures === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {results.map((r) => {
          const expanded = expandedId === r.caseId;
          return (
            <div key={r.caseId} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : r.caseId)}
                className="flex w-full items-start justify-between gap-3 p-3 text-left"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${BUCKET_DOT[r.bucket] ?? "bg-zinc-400"}`} />
                    <span className="font-mono text-sm font-medium">{r.caseId}</span>
                    <span className="text-xs text-zinc-500">{r.category}</span>
                    {r.knownLimitation && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-900">
                        known limitation
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">&ldquo;{r.message}&rdquo;</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-zinc-500">{r.bucket}</span>
              </button>
              {expanded && (
                <div className="flex flex-col gap-3 border-t border-zinc-200 p-3 dark:border-zinc-800">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold">Grader reasoning:</span> {r.reasoning}
                  </p>
                  <div className="flex gap-4 font-mono text-xs text-zinc-500">
                    <span>{r.toolCallCount} tool calls</span>
                    <span>{r.turnCount} turns</span>
                    <span>{r.elapsedMs}ms</span>
                  </div>
                  <TraceView trace={r.trace} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
