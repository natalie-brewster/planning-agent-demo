import type { Goal, Task, LoggedActivity } from "./types";

// Fabricated demo data for the Planning Agent Demo. Shaped like a real planning
// system's Goal/Task/LoggedActivity records, but every name and event below is
// made up for this demo — no connection to any real person's actual plans.

export const TODAY = "2026-07-29";

export const goals: Goal[] = [
  { id: "g-fitness", title: "Run a 10k", type: "Project", lifeArea: "Health", status: "Active" },
  { id: "g-spanish", title: "Learn conversational Spanish", type: "Project", lifeArea: "Learning", status: "Active" },
  { id: "g-portfolio", title: "Ship personal portfolio site", type: "Project", lifeArea: "Career", status: "Active" },
  { id: "g-reading", title: "Read 12 books this year", type: "Area", lifeArea: "Personal", status: "Active" },
  { id: "g-misc", title: "Miscellaneous", type: "Area", lifeArea: "Logistics", status: "Active" },
];

export const tasks: Task[] = [
  { id: "t-run1", goalId: "g-fitness", title: "Run 5k at easy pace", notes: null, status: "Not Started", plannedFor: "2026-07-28", recurrence: "3x per week" },
  { id: "t-run2", goalId: "g-fitness", title: "Interval training session", notes: null, status: "Not Started", plannedFor: "2026-07-30", recurrence: "Weekly" },
  { id: "t-run3", goalId: "g-fitness", title: "Buy new running shoes", notes: "Old pair has 400+ miles", status: "Not Started", plannedFor: null, recurrence: "Does not repeat" },
  { id: "t-span1", goalId: "g-spanish", title: "Duolingo daily lesson", notes: null, status: "In Progress", plannedFor: "2026-07-29", recurrence: "Daily" },
  { id: "t-span2", goalId: "g-spanish", title: "Book a conversation exchange session", notes: null, status: "Not Started", plannedFor: null, recurrence: "Does not repeat" },
  { id: "t-port1", goalId: "g-portfolio", title: "Write case study for last project", notes: "Focus on the migration work", status: "In Progress", plannedFor: "2026-07-29", recurrence: "Does not repeat" },
  { id: "t-port2", goalId: "g-portfolio", title: "Deploy site to Vercel", notes: null, status: "Not Started", plannedFor: null, recurrence: "Does not repeat" },
  { id: "t-read1", goalId: "g-reading", title: "Finish current book", notes: "About 60 pages left", status: "In Progress", plannedFor: null, recurrence: "Does not repeat" },
  { id: "t-misc1", goalId: "g-misc", title: "Schedule dentist appointment", notes: null, status: "Not Started", plannedFor: null, recurrence: "Does not repeat" },
];

export const recentEvents: LoggedActivity[] = [
  { id: "e1", date: "2026-07-27", kind: "Completed from list", title: "Run 5k at easy pace", durationMinutes: 32, taskId: "t-run1", goalId: "g-fitness" },
  { id: "e2", date: "2026-07-28", kind: "Also accomplished", title: "Meal prepped for the week", durationMinutes: 45, taskId: null, goalId: "g-misc" },
  { id: "e3", date: "2026-07-28", kind: "Partial progress", title: "Duolingo daily lesson", durationMinutes: 10, taskId: "t-span1", goalId: "g-spanish" },
];
