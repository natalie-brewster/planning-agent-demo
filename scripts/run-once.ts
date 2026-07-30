import { runReconciliationAgent } from "../src/lib/agent";

const message = process.argv.slice(2).join(" ") || "Finished the case study writeup yesterday and also went for a run.";

async function main() {
  console.log(`> ${message}\n`);
  const result = await runReconciliationAgent(message);
  for (const step of result.trace) {
    switch (step.type) {
      case "user_message":
        console.log(`[user] ${step.content}`);
        break;
      case "assistant_text":
        console.log(`[assistant] ${step.content}`);
        break;
      case "tool_call":
        console.log(`[tool_call] ${step.name}(${JSON.stringify(step.input)})`);
        break;
      case "tool_result":
        console.log(`[tool_result:${step.name}] ${JSON.stringify(step.output)}`);
        break;
      case "final_result":
        console.log(`[final_result]`, JSON.stringify(step.items, null, 2));
        break;
      case "error":
        console.log(`[error] ${step.message}`);
        break;
    }
  }
  console.log(`\n${result.toolCallCount} tool calls, ${result.turnCount} turns, ${result.elapsedMs}ms, ${result.inputTokens}in/${result.outputTokens}out tokens`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
