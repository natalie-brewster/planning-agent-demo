"use client";

import { useEffect, useState } from "react";

type PromptVersionWithScore = {
  id: string;
  label: string;
  changeNotes: string;
  prompt: string;
  active: boolean;
  score: {
    correct: number;
    total: number;
    counts: Record<string, number>;
    timestamp: string;
  } | null;
};

export default function PromptsTab() {
  const [versions, setVersions] = useState<PromptVersionWithScore[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prompts")
      .then((res) => res.json())
      .then(setVersions);
  }, []);

  if (versions === null) {
    return <p className="text-sm text-zinc-500">Loading prompt versions...</p>;
  }

  const best = versions.reduce<number>((max, v) => Math.max(max, v.score?.correct ?? -1), -1);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-500">
        Each version&apos;s score is from the last full <code className="font-mono">npm run eval</code> while it was
        active — edit <code className="font-mono">src/lib/prompts.ts</code>, flip{" "}
        <code className="font-mono">ACTIVE_PROMPT_ID</code>, and rerun to add a comparison point.
      </p>

      {versions.map((v) => {
        const expanded = expandedId === v.id;
        const isBest = v.score !== null && v.score.correct === best;
        return (
          <div
            key={v.id}
            className={`rounded-lg border p-3 ${
              v.active ? "border-black dark:border-white" : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{v.label}</span>
                  {v.active && (
                    <span className="rounded bg-black px-1.5 py-0.5 text-[10px] text-white dark:bg-white dark:text-black">
                      active
                    </span>
                  )}
                  {isBest && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      best score
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{v.changeNotes}</p>
              </div>
              <div className="shrink-0 text-right">
                {v.score ? (
                  <>
                    <div className="font-mono text-lg font-semibold">
                      {v.score.correct}/{v.score.total}
                    </div>
                    <div className="text-xs text-zinc-500">correct</div>
                  </>
                ) : (
                  <div className="text-xs text-zinc-500">not run yet</div>
                )}
              </div>
            </div>

            {v.score && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(v.score.counts).map(([bucket, count]) => (
                  <span key={bucket} className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] dark:bg-zinc-900">
                    {bucket}: {count}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : v.id)}
              className="mt-2 text-xs text-zinc-500 underline"
            >
              {expanded ? "Hide" : "Show"} full prompt
            </button>
            {expanded && (
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-zinc-50 p-2 text-xs font-mono text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                {v.prompt}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
