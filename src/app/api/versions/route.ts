import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { VERSIONS, ACTIVE_VERSION_ID } from "@/lib/versions";
import { evalCases } from "@/eval/cases";
import type { VersionScoreEntry } from "@/eval/run";

export async function GET() {
  let scores: VersionScoreEntry[] = [];
  try {
    const raw = await readFile(resolve(process.cwd(), "src/eval/version-scores.json"), "utf-8");
    scores = JSON.parse(raw);
  } catch {
    scores = [];
  }

  const currentCaseIds = evalCases.map((c) => c.id);

  const versions = VERSIONS.map((version) => {
    const score = scores.find((s) => s.versionId === version.id) ?? null;
    const missingCaseIds = score ? currentCaseIds.filter((id) => !score.caseIds.includes(id)) : currentCaseIds;
    return {
      id: version.id,
      label: version.label,
      changeNotes: version.changeNotes,
      prompt: version.prompt,
      tools: version.tools,
      toolsChanged: version.toolsChanged,
      active: version.id === ACTIVE_VERSION_ID,
      score,
      coverage: score ? { covered: score.caseIds.length, total: currentCaseIds.length, missingCaseIds } : null,
    };
  });

  return NextResponse.json(versions);
}
