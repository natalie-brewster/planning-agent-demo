"use client";

import type { TraceStep } from "@/lib/agent";
import { outcomeLabel } from "@/eval/taxonomy";

const ACCENT_CLASSES: Record<string, string> = {
  user: "border-l-zinc-400",
  assistant: "border-l-blue-400",
  tool_call: "border-l-amber-400",
  tool_result: "border-l-emerald-400",
  final: "border-l-purple-400",
  error: "border-l-red-400",
};

const BADGE_CLASSES: Record<string, string> = {
  user: "bg-zinc-200 text-zinc-800",
  assistant: "bg-blue-100 text-blue-800",
  tool_call: "bg-amber-100 text-amber-800",
  tool_result: "bg-emerald-100 text-emerald-800",
  final: "bg-purple-200 text-purple-900",
  error: "bg-red-200 text-red-900",
};

function Badge({ tone, label }: { tone: string; label: string }) {
  return (
    <span className={`w-fit rounded px-2 py-0.5 font-mono text-xs font-medium ${BADGE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}

export default function TraceView({ trace }: { trace: TraceStep[] }) {
  if (trace.length === 0) {
    return <p className="text-sm text-zinc-500">No trace steps.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {trace.map((step, i) => {
        switch (step.type) {
          case "user_message":
            return (
              <div key={i} className={`glass flex flex-col gap-1 border-l-4 p-3 ${ACCENT_CLASSES.user}`}>
                <Badge tone="user" label="user" />
                <p className="text-sm">{step.content}</p>
              </div>
            );
          case "assistant_text":
            return (
              <div key={i} className={`glass flex flex-col gap-1 border-l-4 p-3 ${ACCENT_CLASSES.assistant}`}>
                <Badge tone="assistant" label="assistant" />
                <p className="text-sm italic text-zinc-700">{step.content}</p>
              </div>
            );
          case "tool_call":
            return (
              <div key={i} className={`glass flex flex-col gap-1 border-l-4 p-3 ${ACCENT_CLASSES.tool_call}`}>
                <Badge tone="tool_call" label={`tool_call · ${step.name}`} />
                <pre className="overflow-x-auto text-xs font-mono text-zinc-600">
                  {JSON.stringify(step.input, null, 2)}
                </pre>
              </div>
            );
          case "tool_result":
            return (
              <div key={i} className={`glass flex flex-col gap-1 border-l-4 p-3 ${ACCENT_CLASSES.tool_result}`}>
                <Badge tone="tool_result" label={`tool_result · ${step.name}`} />
                <pre className="overflow-x-auto text-xs font-mono text-zinc-600">
                  {JSON.stringify(step.output, null, 2)}
                </pre>
              </div>
            );
          case "final_result":
            return (
              <div key={i} className={`glass flex flex-col gap-2 border-l-4 p-3 ${ACCENT_CLASSES.final}`}>
                <Badge tone="final" label="final_result" />
                {step.items.length === 0 ? (
                  <p className="text-xs text-zinc-500">No items submitted.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {step.items.map((item, j) => (
                      <div key={j} className="glass-inset p-2 text-xs font-mono">
                        <div>
                          <span className="text-zinc-500">outcome:</span> {outcomeLabel(item.outcome, item.goalId)}{" "}
                          <span className="text-zinc-500">({item.outcome})</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">taskId:</span> {item.taskId ?? "null"}
                        </div>
                        <div>
                          <span className="text-zinc-500">goalId:</span> {item.goalId ?? "null"}
                        </div>
                        <div>
                          <span className="text-zinc-500">effectiveDate:</span> {item.effectiveDate ?? "null"}
                        </div>
                        <div>
                          <span className="text-zinc-500">durationMinutes:</span> {item.durationMinutes ?? "null"}
                        </div>
                        <div>
                          <span className="text-zinc-500">confidence:</span> {item.confidence}
                        </div>
                        <div className="mt-1 font-sans text-zinc-700">{item.explanation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          case "error":
            return (
              <div key={i} className={`glass flex flex-col gap-1 border-l-4 p-3 ${ACCENT_CLASSES.error}`}>
                <Badge tone="error" label="error" />
                <p className="text-sm text-red-700">{step.message}</p>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
