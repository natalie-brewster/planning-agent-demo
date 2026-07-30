"use client";

import { EVAL_CATEGORIES, FAILURE_BUCKETS } from "@/eval/taxonomy";

export default function EvalTypesTab() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Request types</h2>
          <p className="text-xs text-zinc-500">
            The {EVAL_CATEGORIES.length} shapes of input an eval case can be — what each one is designed to probe.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {EVAL_CATEGORIES.map((c) => (
            <div key={c.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{c.label}</span>
                <span className="font-mono text-xs text-zinc-500">{c.id}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Failure buckets</h2>
          <p className="text-xs text-zinc-500">
            The {FAILURE_BUCKETS.length} verdicts a graded run can land in — &quot;correct&quot; is the only one
            that isn&apos;t a failure. These are exactly what the LLM grader in{" "}
            <code className="font-mono">src/eval/run.ts</code> is instructed to pick from.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {FAILURE_BUCKETS.map((b) => (
            <div key={b.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{b.label}</span>
                <span className="font-mono text-xs text-zinc-500">{b.id}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{b.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
