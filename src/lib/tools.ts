import type Anthropic from "@anthropic-ai/sdk";
import { goals, recentEvents, tasks, TODAY } from "./fakeActivity";

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "search_tasks",
    description: "Search existing to-do tasks by keyword. Matches against task title and notes. Returns up to 5 candidates with their id, title, status, goalId, and planned date.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keyword or phrase to search for, e.g. 'run' or 'case study'." },
      },
      required: ["query"],
    },
  },
  {
    name: "search_goals",
    description: "Search existing goals by keyword. Matches against goal title and life area. Returns up to 5 candidates with their id, title, and lifeArea.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keyword or phrase to search for, e.g. 'fitness' or 'career'." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_recent_events",
    description: "Get work events logged in the last N days, to check whether an activity has already been recorded and avoid creating a duplicate.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number", description: "How many days back from today to look, e.g. 3." },
      },
      required: ["days"],
    },
  },
  {
    name: "submit_reconciliation",
    description:
      "Finalize the reconciliation. Call this exactly once, after you've searched tasks/goals and checked recent events, with one item per distinct activity described in the user's report.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sourceText: { type: "string", description: "The specific part of the user's report this item covers." },
              outcome: { type: "string", enum: ["completed", "partial", "missed", "unplanned"] },
              effectiveDate: { type: ["string", "null"], description: "YYYY-MM-DD, or null if it can't be resolved." },
              durationMinutes: { type: ["number", "null"] },
              taskId: { type: ["string", "null"], description: "Must be an id returned by search_tasks, or null." },
              goalId: { type: ["string", "null"], description: "Must be an id returned by search_goals, or null." },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              explanation: { type: "string", description: "One sentence on why this match was chosen." },
            },
            required: ["sourceText", "outcome", "effectiveDate", "durationMinutes", "taskId", "goalId", "confidence", "explanation"],
          },
        },
      },
      required: ["items"],
    },
  },
];

function matches(haystack: (string | null | undefined)[], query: string) {
  const q = query.toLowerCase();
  return haystack.some((value) => value?.toLowerCase().includes(q));
}

export function executeTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case "search_tasks": {
      const query = String(input.query ?? "");
      const results = tasks
        .filter((task) => matches([task.title, task.notes], query))
        .slice(0, 5)
        .map(({ id, title, status, goalId, plannedFor }) => ({ id, title, status, goalId, plannedFor }));
      return { query, resultCount: results.length, results };
    }
    case "search_goals": {
      const query = String(input.query ?? "");
      const results = goals
        .filter((goal) => matches([goal.title, goal.lifeArea], query))
        .slice(0, 5)
        .map(({ id, title, lifeArea }) => ({ id, title, lifeArea }));
      return { query, resultCount: results.length, results };
    }
    case "get_recent_events": {
      const days = Number(input.days ?? 3);
      const cutoff = new Date(`${TODAY}T00:00:00Z`);
      cutoff.setUTCDate(cutoff.getUTCDate() - days);
      const results = recentEvents.filter((event) => new Date(`${event.date}T00:00:00Z`) >= cutoff);
      return { today: TODAY, days, resultCount: results.length, results };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
