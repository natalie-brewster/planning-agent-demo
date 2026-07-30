export type Goal = {
  id: string;
  title: string;
  type: "Project" | "Area";
  lifeArea: string;
  status: "Active" | "Completed" | "Archived";
};

export type Task = {
  id: string;
  goalId: string;
  title: string;
  notes: string | null;
  status: "Not Started" | "In Progress" | "Done";
  plannedFor: string | null; // YYYY-MM-DD
  recurrence: string;
};

export type LoggedActivity = {
  id: string;
  date: string; // YYYY-MM-DD
  kind: "Completed from list" | "Partial progress" | "Also accomplished";
  title: string;
  durationMinutes: number | null;
  taskId: string | null;
  goalId: string | null;
};

export type ProposedWork = {
  sourceText: string;
  outcome: "completed" | "partial" | "missed" | "unplanned";
  effectiveDate: string | null;
  durationMinutes: number | null;
  taskId: string | null;
  goalId: string | null;
  confidence: "high" | "medium" | "low";
  explanation: string;
};
