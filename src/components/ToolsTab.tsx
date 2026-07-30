"use client";

import { activeVersion } from "@/lib/versions";

export default function ToolsTab() {
  const tools = activeVersion.tools;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-zinc-500">
        {tools.length} tools available to the agent every turn on the active version (
        <span className="font-mono">{activeVersion.label}</span>) — it decides which to call, in what order, and
        how many times. See the AB Testing tab to compare against other versions&apos; tool schemas.
      </p>
      {tools.map((tool) => (
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
