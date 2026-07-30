"use client";

import { EVAL_CATEGORIES, FAILURE_BUCKETS, OUTCOMES } from "@/eval/taxonomy";

export default function EvalTypesTab() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">Request types</h2>
          <p className="text-xs text-zinc-500">
            The {EVAL_CATEGORIES.length} shapes of input an eval case can be — what each one is designed to probe.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {EVAL_CATEGORIES.map((c) => (
            <div key={c.id} className="glass p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{c.label}</span>
                <span className="font-mono text-xs text-zinc-500">{c.id}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">Output outcomes</h2>
          <p className="text-xs text-zinc-500">
            The <code className="font-mono">outcome</code> field the agent sets on every submitted item (see{" "}
            <code className="font-mono">ProposedWork</code> in <code className="font-mono">src/lib/types.ts</code>).
            The raw value shown in parentheses is what the model actually returns — the label is a friendlier
            gloss on the same value, shown wherever a result appears. &quot;Unplanned&quot; is a single raw value
            that covers two different situations, split below by whether a goal was matched.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {OUTCOMES.map((o) => (
            <div key={o.key} className="glass p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{o.label}</span>
                <span className="font-mono text-xs text-zinc-500">({o.id})</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{o.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-base font-semibold">Failure buckets</h2>
          <p className="text-xs text-zinc-500">
            The {FAILURE_BUCKETS.length} verdicts a graded run can land in — &quot;correct&quot; is the only one
            that isn&apos;t a failure. These are exactly what the LLM grader in{" "}
            <code className="font-mono">src/eval/run.ts</code> is instructed to pick from.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {FAILURE_BUCKETS.map((b) => (
            <div key={b.id} className="glass p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold">{b.label}</span>
                <span className="font-mono text-xs text-zinc-500">{b.id}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{b.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
