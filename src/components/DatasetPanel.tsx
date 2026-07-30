"use client";

import { useState } from "react";
import { goals, tasks } from "@/lib/fakeActivity";

export default function DatasetPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
      >
        <span>Existing goals &amp; tasks ({goals.length} goals, {tasks.length} tasks)</span>
        <span className="text-zinc-500">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            This is the dataset the agent runs against — use it as reference when writing a
            message to test.
          </p>
          {goals.map((goal) => {
            const goalTasks = tasks.filter((t) => t.goalId === goal.id);
            return (
              <div key={goal.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span>{goal.title}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-normal text-zinc-500 dark:bg-zinc-900">
                    {goal.type} · {goal.lifeArea}
                  </span>
                </div>
                {goalTasks.length === 0 ? (
                  <p className="pl-4 text-xs text-zinc-500">No tasks yet.</p>
                ) : (
                  <ul className="flex flex-col gap-0.5 pl-4">
                    {goalTasks.map((task) => (
                      <li key={task.id} className="text-xs text-zinc-600 dark:text-zinc-400">
                        {task.title}
                        <span className="text-zinc-400 dark:text-zinc-600">
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
      )}
    </div>
  );
}
