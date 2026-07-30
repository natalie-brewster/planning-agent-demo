"use client";

import { useState } from "react";
import { goals, tasks } from "@/lib/fakeActivity";

export default function DatasetPanel() {
  const [open, setOpen] = useState(true);

  return (
    <div className="glass">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-display text-base font-semibold">
          Existing goals &amp; tasks{" "}
          <span className="font-sans text-sm font-normal text-zinc-500">
            — {goals.length} goals, {tasks.length} tasks
          </span>
        </span>
        <span className="text-zinc-500">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-[var(--glass-border)] p-5 pt-4">
          <p className="text-xs text-zinc-500">
            This is the dataset the agent runs against — use it as reference when writing a
            message to test.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {goals.map((goal) => {
              const goalTasks = tasks.filter((t) => t.goalId === goal.id);
              return (
                <div key={goal.id} className="glass-inset flex flex-col gap-1.5 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-semibold">{goal.title}</span>
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-zinc-600">
                      {goal.type} · {goal.lifeArea}
                    </span>
                  </div>
                  {goalTasks.length === 0 ? (
                    <p className="text-xs text-zinc-500">No tasks yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {goalTasks.map((task) => (
                        <li key={task.id} className="text-xs text-zinc-600">
                          {task.title}
                          <span className="text-zinc-400">
                            {" "}
                            — {task.status}
                            {task.plannedFor ? `, planned ${task.plannedFor}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
