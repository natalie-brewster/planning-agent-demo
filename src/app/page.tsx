"use client";

import { useState } from "react";
import type { AgentRunResult } from "@/lib/agent";
import TraceView from "@/components/TraceView";
import EvalTypesTab from "@/components/EvalTypesTab";
import EvalDashboard from "@/components/EvalDashboard";
import ToolsTab from "@/components/ToolsTab";
import ABTestingTab from "@/components/ABTestingTab";
import DatasetPanel from "@/components/DatasetPanel";

const TABS = ["trace", "evalTypes", "eval", "abTesting", "tools"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  trace: "Trace",
  evalTypes: "Eval Taxonomy",
  eval: "Eval Dashboard",
  abTesting: "AB Testing",
  tools: "Tools",
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("trace");
  const [message, setMessage] = useState("I ran twenty minutes for my 5k.");
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowCredit, setLowCredit] = useState(false);

  async function runAgent() {
    setLoading(true);
    setError(null);
    setLowCredit(false);
    setResult(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.lowCredit) setLowCredit(true);
        throw new Error(data.error ?? "Agent run failed.");
      }
      setResult(data as AgentRunResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Agent run failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1 px-6 py-5">
        <h1 className="font-display text-3xl font-bold">Planning Agent Demo</h1>
        <p className="text-md">A Natalie Brewster Project</p>
        <p className="text-sm italic text-zinc-600">
          Forward: I had a life planning app with an agent in it that wasn&apos;t very good, so I
          set out to upgrade it to use tools — and needed a way to verify its tool use was
          actually correct.
        </p>
        <p className="text-sm text-zinc-600">
          Here&apos;s a demo of a simple agent that uses four tools to evaluate a user&apos;s
          request inside the life planning app, verified against a set of test data.
        </p>
      </header>

      <nav className="glass inline-flex w-fit gap-1 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "glass-inset text-black"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>

      {tab === "trace" && (
        <div className="flex flex-col gap-4">
          <DatasetPanel />

          <div className="glass flex flex-col gap-3 px-5 py-5">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Describe what you did..."
              className="glass-inset w-full p-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={runAgent}
              disabled={loading || !message.trim()}
              className="self-start rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Running..." : "Run agent"}
            </button>
          </div>

          {lowCredit && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              ⚠️ Low or insufficient Anthropic API credits. Add credits to your Anthropic account
              to keep running the agent.
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {result && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 font-mono text-xs text-zinc-600">
                <span className="glass-inset px-3 py-1">{result.toolCallCount} tool calls</span>
                <span className="glass-inset px-3 py-1">{result.turnCount} turns</span>
                <span className="glass-inset px-3 py-1">{result.elapsedMs}ms</span>
                <span className="glass-inset px-3 py-1">
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
      {tab === "abTesting" && <ABTestingTab />}
      {tab === "tools" && <ToolsTab />}
    </div>
  );
}
