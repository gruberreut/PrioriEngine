export interface ScoreBreakdownData {
  priorityScore: number;
  urgencyScore: number;
  energyScore: number;
  durationScore: number;
  flowBonus: number;
  suggestionPenalty: number;
  totalScore: number;
  reasons: string[];
}

export interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownData;
}

const ROWS: { label: string; key: keyof Omit<ScoreBreakdownData, "totalScore" | "reasons"> }[] = [
  { label: "Priority", key: "priorityScore" },
  { label: "Urgency", key: "urgencyScore" },
  { label: "Energy fit", key: "energyScore" },
  { label: "Duration fit", key: "durationScore" },
  { label: "Flow bonus", key: "flowBonus" },
  { label: "Suggestion penalty", key: "suggestionPenalty" },
];

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div style={{ fontSize: "13px", color: "#6B7280", display: "flex", flexDirection: "column", gap: "4px" }}>
      {ROWS.map(({ label, key }) => {
        const value = breakdown[key];
        const isNegative = value < 0;
        return (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span>{label}</span>
            <span style={{ color: isNegative ? "#EF4444" : value > 0 ? "#10B981" : "#9CA3AF", fontVariantNumeric: "tabular-nums" }}>
              {value > 0 ? "+" : ""}{value.toFixed(2)}
            </span>
          </div>
        );
      })}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", fontWeight: 600, color: "#111827", borderTop: "1px solid #E5E7EB", paddingTop: "4px", marginTop: "2px" }}>
        <span>Total</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{breakdown.totalScore.toFixed(2)}</span>
      </div>
      {breakdown.reasons.length > 0 && (
        <ul style={{ margin: "4px 0 0", padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {breakdown.reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
