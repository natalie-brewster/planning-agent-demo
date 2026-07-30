"use client";

import { TOOL_DEFINITIONS } from "@/lib/tools";

export default function ToolsTab() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-500">
        {TOOL_DEFINITIONS.length} tools available to the agent every turn — it decides which to call, in what
        order, and how many times.
      </p>
      {TOOL_DEFINITIONS.map((tool) => (
        <div key={tool.name} className="glass p-3">
          <div className="font-mono text-sm font-semibold">{tool.name}</div>
          <p className="mt-1 text-sm text-zinc-600">{tool.description}</p>
          <pre className="glass-inset mt-2 overflow-x-auto p-2 text-xs font-mono text-zinc-600">
            {JSON.stringify(tool.input_schema, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
