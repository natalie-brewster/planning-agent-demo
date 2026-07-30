// Single source of truth for the two taxonomies used across the eval system:
// the shapes of input a case can be (EVAL_CATEGORIES) and the verdicts a
// graded run can land in (FAILURE_BUCKETS). cases.ts, run.ts (including the
// grader's own instructions), and the "Eval Taxonomy" tab all read from here so
// the descriptions can't drift out of sync with each other.

export type EvalCategory =
  | "report-clean-match"
  | "report-fallback-goal"
  | "report-ambiguous-match"
  | "report-fuzzy-match"
  | "report-duplicate"
  | "creation-request"
  | "nonexistent-reference"
  | "off-topic"
  | "adversarial"
  | "vague"
  | "multi-activity";

export const EVAL_CATEGORIES: { id: EvalCategory; label: string; description: string }[] = [
  { id: "report-clean-match", label: "Clean match", description: "Clearly matches one existing task." },
  {
    id: "report-fallback-goal",
    label: "Fallback goal",
    description: "Real work described, but no task match — should land under a goal, or Miscellaneous.",
  },
  {
    id: "report-ambiguous-match",
    label: "Ambiguous match",
    description: "Multiple existing tasks are plausible matches; confidence should reflect the ambiguity.",
  },
  {
    id: "report-fuzzy-match",
    label: "Fuzzy match",
    description: "Matches a task's intent, but not its exact wording.",
  },
  {
    id: "report-duplicate",
    label: "Duplicate",
    description: "The activity already exists in recentEvents — tests whether the agent notices.",
  },
  {
    id: "creation-request",
    label: "Creation request",
    description: "Asks to create a new task or goal. No tool exists for this — should not be faked as a completed activity.",
  },
  {
    id: "nonexistent-reference",
    label: "Nonexistent reference",
    description: "Names a goal or task that doesn't actually exist in the data.",
  },
  { id: "off-topic", label: "Off-topic", description: "Not a planning report at all (e.g. gibberish)." },
  {
    id: "adversarial",
    label: "Adversarial",
    description: "Tries to get the agent to misbehave, e.g. a prompt-injection attempt.",
  },
  {
    id: "vague",
    label: "Vague",
    description: "A real report, but too underspecified to pin down confidently.",
  },
  {
    id: "multi-activity",
    label: "Multi-activity",
    description: "3+ distinct activities described in a single message.",
  },
];

// The outcome field the agent actually returns per item (see ProposedWork in
// src/lib/types.ts). These four raw values are the wire contract the model is
// instructed to use in src/lib/prompts.ts and src/lib/tools.ts — they stay as
// they are so we don't have to touch the tool schema or re-validate prompt
// scores just to relabel text. What's documented here (and shown via
// outcomeLabel below) is a friendlier display label layered on top,
// including splitting "unplanned" into two readable variants depending on
// whether a goal was matched.
export type Outcome = "completed" | "partial" | "missed" | "unplanned";

export const OUTCOMES: { key: string; id: Outcome; label: string; description: string }[] = [
  {
    key: "completed",
    id: "completed",
    label: "Completed task",
    description: "Matched an existing task (taskId set) that was completed as planned.",
  },
  {
    key: "partial",
    id: "partial",
    label: "Partial task completed",
    description: "Matched an existing task (taskId set), but only partial progress was made.",
  },
  {
    key: "missed",
    id: "missed",
    label: "Missed task",
    description: "Matched an existing task (taskId set), but it didn't happen.",
  },
  {
    key: "unplanned-goal",
    id: "unplanned",
    label: "Unplanned (goal match)",
    description: "No existing task matches (taskId null), but the work fits an existing goal (goalId set).",
  },
  {
    key: "unplanned-no-goal",
    id: "unplanned",
    label: "Unplanned (no goal match)",
    description: "No existing task or goal matches (taskId and goalId both null).",
  },
];

// Same raw "unplanned" value covers two different situations — this is what
// picks the right display label using the goalId that came back alongside it.
export function outcomeLabel(outcome: Outcome, goalId: string | null): string {
  if (outcome === "unplanned") {
    return goalId ? "Unplanned (goal match)" : "Unplanned (no goal match)";
  }
  return OUTCOMES.find((o) => o.id === outcome)?.label ?? outcome;
}

export type FailureBucket =
  | "correct"
  | "wrong-tool"
  | "right-tool-wrong-args"
  | "no-tool-called"
  | "hallucinated-data"
  | "incomplete";

export const FAILURE_BUCKETS: { id: FailureBucket; label: string; description: string }[] = [
  {
    id: "correct",
    label: "Correct",
    description: "Behavior is defensible and matches the case's expectedBehavior — the only non-failure verdict.",
  },
  {
    id: "wrong-tool",
    label: "Wrong tool",
    description:
      "Called a tool that doesn't fit the situation — e.g. fabricated a submit_reconciliation item for a creation-request or off-topic message that described no real activity.",
  },
  {
    id: "right-tool-wrong-args",
    label: "Right tool, wrong args",
    description: "Called reasonable tools, but arguments are wrong — bad taskId/goalId match, wrong duration, wrong outcome.",
  },
  {
    id: "no-tool-called",
    label: "No tool called",
    description:
      "Failed to call a tool it needed to call — most commonly skipping get_recent_events, or never calling submit_reconciliation at all.",
  },
  {
    id: "hallucinated-data",
    label: "Hallucinated data",
    description:
      "Invented a taskId or goalId that was never returned by search_tasks/search_goals, or invented activity the user never described.",
  },
  {
    id: "incomplete",
    label: "Incomplete",
    description:
      "Partially right but missing something — merged distinct activities into fewer items, wrong/missing date, dropped an activity, or missed noting a duplicate.",
  },
];
