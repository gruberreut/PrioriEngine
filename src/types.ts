export type EnergyLevel = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface RawTask {
  id?: string;
  title?: string;
  priority?: number;
  priorityUpdatedAt?: string;
  dueDate?: string | null;
  recurrence?: string | null;
  duration?: number;
  energyRequired?: EnergyLevel;
  contexts?: string[];
  projectId?: string | null;
  parentId?: string | null;
  status?: TaskStatus;
  createdAt?: string;
  lastSuggestedAt?: string | null;
  children?: RawTask[];
}

export interface LoadedTask {
  task: RawTask;
  parent?: LoadedTask;
  depth: number;
}

export interface NormalizedTask {
  id: string;
  title: string;
  priority: number;
  priorityUpdatedAt: string;
  dueDate: string | null;
  recurrence: string | null;
  duration: number;
  energyRequired: EnergyLevel;
  contexts: string[];
  projectId: string | null;
  parentId: string | null;
  status: TaskStatus;
  createdAt: string | null;
  lastSuggestedAt: string | null;
  depth: number;
}

export interface RuntimeParams {
  currentTime: Date;
  context?: string;
  availableTime: number;
  energyLevel: EnergyLevel;
  explain: boolean;
  limit: number;
  lastCompletedProject?: string;
}

export interface ScoreWeights {
  wPriority: number;
  wUrgency: number;
  wEnergy: number;
  wDuration: number;
  wFlow: number;
  wSuggestion: number;
}

export interface ScoreBreakdown {
  priorityScore: number;
  urgencyScore: number;
  energyScore: number;
  durationScore: number;
  flowBonus: number;
  suggestionPenalty: number;
  totalScore: number;
  reasons: string[];
}

export interface RankedTask {
  task: NormalizedTask;
  breakdown: ScoreBreakdown;
}

export type ExclusionReason =
  | "context_mismatch"
  | "completed"
  | "in_progress_blocked"
  | "non_leaf"
  | "invalid";

export interface ExclusionRecord {
  taskId: string;
  reason: ExclusionReason;
  detail: string;
}

export interface RankResult {
  mode: "recommendations" | "in_progress_block";
  top: RankedTask[];
  exclusions: ExclusionRecord[];
  inProgressTask?: NormalizedTask;
}
