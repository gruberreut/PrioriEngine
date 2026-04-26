import { ScoreBreakdown, type ScoreBreakdownData } from "../ScoreBreakdown/ScoreBreakdown";

export interface TaskData {
  id: string;
  title: string;
  duration: number;
  energyRequired: "low" | "medium" | "high";
  contexts: string[];
}

export interface TaskCardProps {
  task: TaskData;
  breakdown?: ScoreBreakdownData;
  explain?: boolean;
}

export function TaskCard({ task, breakdown, explain = false }: TaskCardProps) {
  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontWeight: 600, fontSize: "15px", color: "#111827" }}>{task.title}</div>
      <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#6B7280" }}>
        <span>{task.duration} min</span>
        <span style={{ textTransform: "capitalize" }}>{task.energyRequired} energy</span>
        {task.contexts.length > 0 && <span>{task.contexts.join(", ")}</span>}
      </div>
      {explain && breakdown && <ScoreBreakdown breakdown={breakdown} />}
    </div>
  );
}
