export interface Task {
  id: string;
  title: string;
  duration: number;
  energyRequired: "low" | "medium" | "high";
  location: "home" | "in-person" | "anywhere";
  status: "pending" | "in_progress" | "completed";
  contexts: string[];
  priority: number;
  priorityUpdatedAt: string;
  dueDate: string | null;
  lastSuggestedAt: string | null;
  parentId?: string | null;
  contextId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  ancestors?: { id: string; title: string }[];
}
