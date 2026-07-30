import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PROMPT_VERSIONS, ACTIVE_PROMPT_ID } from "@/lib/prompts";
import type { PromptScoreEntry } from "@/eval/run";

export async function GET() {
  let scores: PromptScoreEntry[] = [];
  try {
    const raw = await readFile(resolve(process.cwd(), "src/eval/prompt-scores.json"), "utf-8");
    scores = JSON.parse(raw);
  } catch {
    scores = [];
  }

  const versions = PROMPT_VERSIONS.map((version) => ({
    ...version,
    active: version.id === ACTIVE_PROMPT_ID,
    score: scores.find((s) => s.promptId === version.id) ?? null,
  }));

  return NextResponse.json(versions);
}
