import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { runReconciliationAgent } from "@/lib/agent";

function isLowCreditError(error: unknown): boolean {
  if (!(error instanceof Anthropic.APIError)) return false;
  if (error.status === 429) return true;
  const message = error.message?.toLowerCase() ?? "";
  return message.includes("credit balance") || message.includes("insufficient_quota");
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Server is missing ANTHROPIC_API_KEY." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  try {
    const result = await runReconciliationAgent(message);
    return NextResponse.json(result);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Agent run failed.";
    if (isLowCreditError(error)) {
      return NextResponse.json({ error: detail, lowCredit: true }, { status: 402 });
    }
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
