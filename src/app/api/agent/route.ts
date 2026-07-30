import { NextResponse } from "next/server";
import { runReconciliationAgent } from "@/lib/agent";

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
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
