"use client";

import { useState } from "react";
import type { AgentRunResult } from "@/lib/agent";
import TraceView from "@/components/TraceView";
import EvalTypesTab from "@/components/EvalTypesTab";
import EvalDashboard from "@/components/EvalDashboard";
import ToolsTab from "@/components/ToolsTab";
import PromptsTab from "@/components/PromptsTab";
import DatasetPanel from "@/components/DatasetPanel";

const TABS = ["trace", "evalTypes", "eval", "prompts", "tools"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  trace: "Trace",
  evalTypes: "Eval Taxonomy",
  eval: "Eval Dashboard",
  prompts: "Prompts",
  tools: "Tools",
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("trace");
  const [message, setMessage] = useState("I ran twenty minutes for my 5k.");
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAgent() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Agent run failed.");
      setResult(data as AgentRunResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent run failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Planning Agent Demo</h1>
        <p className="text-md">A Natalie Brewster Project</p>
        <p className="text-sm italic text-zinc-500">
          Forward: I had a life planning app with an agent in it that wasn&apos;t very good, so I
          set out to upgrade it to use tools — and needed a way to verify its tool use was
          actually correct.
        </p>
        <p className="text-sm text-zinc-500">
          Here&apos;s a demo of a simple agent that uses four tools to evaluate a user&apos;s
          request inside the life planning app, verified against a set of test data.
        </p>
      </header>

      <nav className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "border-b-2 border-black text-black dark:border-white dark:text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      {tab === "trace" && (
        <div className="flex flex-col gap-4">
          <DatasetPanel />

          <div className="flex flex-col gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Describe what you did..."
              className="w-full rounded-lg border border-zinc-300 bg-transparent p-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <button
              type="button"
              onClick={runAgent}
              disabled={loading || !message.trim()}
              className="self-start rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {loading ? "Running..." : "Run agent"}
            </button>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {result && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-4 font-mono text-xs text-zinc-500">
                <span>{result.toolCallCount} tool calls</span>
                <span>{result.turnCount} turns</span>
                <span>{result.elapsedMs}ms</span>
                <span>
                  {result.inputTokens}in / {result.outputTokens}out tokens
                </span>
              </div>
              <TraceView trace={result.trace} />
            </div>
          )}
        </div>
      )}

      {tab === "evalTypes" && <EvalTypesTab />}
      {tab === "eval" && <EvalDashboard />}
      {tab === "prompts" && <PromptsTab />}
      {tab === "tools" && <ToolsTab />}
    </div>
  );
}
