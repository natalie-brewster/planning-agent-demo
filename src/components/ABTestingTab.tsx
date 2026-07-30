"use client";

import { useEffect, useState } from "react";
import { diffWords } from "@/lib/diffWords";

type ToolDef = { name: string; description: string; input_schema: unknown };

// Renders text with word-level diff highlighting against the previous
// version: green for added/changed-in words, red strikethrough for words
// that were removed. `prevText` null means there's nothing to compare
// against (the first version) — render plain.
function DiffText({ prevText, text, className }: { prevText: string | null; text: string; className?: string }) {
  if (prevText === null) return <div className={className}>{text}</div>;
  const tokens = diffWords(prevText, text);
  return (
    <div className={className}>
      {tokens.map((t, i) => {
        if (t.type === "equal") return <span key={i}>{t.text}</span>;
        if (t.type === "insert")
          return (
            <span key={i} className="rounded bg-emerald-400/30 text-emerald-950">
              {t.text}
            </span>
          );
        return (
          <span key={i} className="rounded bg-red-400/30 text-red-950 line-through decoration-red-700/50">
            {t.text}
          </span>
        );
      })}
    </div>
  );
}

type VersionWithScore = {
  id: string;
  label: string;
  changeNotes: string;
  prompt: string;
  tools: ToolDef[];
  toolsChanged: boolean;
  active: boolean;
  score: {
    correct: number;
    total: number;
    counts: Record<string, number>;
    timestamp: string;
  } | null;
  coverage: { covered: number; total: number; missingCaseIds: string[] } | null;
};

export default function ABTestingTab() {
  const [versions, setVersions] = useState<VersionWithScore[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedToolsId, setExpandedToolsId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/versions")
      .then((res) => res.json())
      .then(setVersions);
  }, []);

  if (versions === null) {
    return <p className="text-sm text-zinc-500">Loading versions...</p>;
  }

  const best = versions.reduce<number>((max, v) => Math.max(max, v.score?.correct ?? -1), -1);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-500">
        Each candidate is a full <span className="font-medium text-zinc-700">version</span> — a system prompt AND a
        tool schema, either of which can change between versions (see e.g. v5, which fixes a search-retry bug via
        the tool description instead of the prompt). Edit{" "}
        <code className="font-mono">src/lib/versions.ts</code>, flip <code className="font-mono">ACTIVE_VERSION_ID</code>,
        and run <code className="font-mono">npm run eval -- --version &lt;id&gt;</code> to add or refresh a comparison
        point. A score only reflects the case set it was actually run against — a version scored before new eval
        cases were added shows a coverage badge instead of implying a false apples-to-apples comparison.
      </p>

      {versions.map((v, index) => {
        const prevVersion = index > 0 ? versions[index - 1] : null;
        const expanded = expandedId === v.id;
        const toolsExpanded = expandedToolsId === v.id;
        const isBest = v.score !== null && v.score.correct === best;
        const stale = v.coverage !== null && v.coverage.missingCaseIds.length > 0;
        return (
          <div key={v.id} className={`glass p-3 ${v.active ? "border-black/40" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{v.label}</span>
                  {v.active && (
                    <span className="rounded bg-black px-1.5 py-0.5 text-[10px] text-white">active</span>
                  )}
                  {isBest && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800">
                      best score
                    </span>
                  )}
                  {v.toolsChanged && (
                    <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-800">
                      tool change
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-600">{v.changeNotes}</p>
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

            {v.coverage && (
              <div className="mt-2">
                {stale ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                    ran against {v.coverage.covered}/{v.coverage.total} current cases — missing{" "}
                    {v.coverage.missingCaseIds.length} newer case{v.coverage.missingCaseIds.length === 1 ? "" : "s"}
                  </span>
                ) : (
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                    ran against all {v.coverage.total} current cases
                  </span>
                )}
              </div>
            )}

            {v.score && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(v.score.counts).map(([bucket, count]) => (
                  <span key={bucket} className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px]">
                    {bucket}: {count}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : v.id)}
                className="text-xs text-zinc-500 underline"
              >
                {expanded ? "Hide" : "Show"} full prompt
              </button>
              <button
                type="button"
                onClick={() => setExpandedToolsId(toolsExpanded ? null : v.id)}
                className="text-xs text-zinc-500 underline"
              >
                {toolsExpanded ? "Hide" : "Show"} tool schema{v.toolsChanged ? " (changed)" : ""}
              </button>
              {prevVersion && (expanded || toolsExpanded) && (
                <span className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <span className="rounded bg-emerald-400/30 px-1">added</span>
                  <span className="rounded bg-red-400/30 px-1 line-through">removed</span>
                  vs {prevVersion.label}
                </span>
              )}
            </div>
            {expanded && (
              <DiffText
                prevText={prevVersion?.prompt ?? null}
                text={v.prompt}
                className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-zinc-50 p-2 text-xs font-mono text-zinc-600"
              />
            )}
            {toolsExpanded && (
              <div className="mt-2 flex flex-col gap-2">
                {v.tools.map((tool) => {
                  const prevTool = prevVersion?.tools.find((t) => t.name === tool.name) ?? null;
                  return (
                    <div key={tool.name} className="rounded bg-zinc-50 p-2">
                      <div className="font-mono text-xs font-semibold">{tool.name}</div>
                      <DiffText
                        prevText={prevTool?.description ?? null}
                        text={tool.description}
                        className="mt-1 whitespace-pre-wrap text-xs text-zinc-600"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
