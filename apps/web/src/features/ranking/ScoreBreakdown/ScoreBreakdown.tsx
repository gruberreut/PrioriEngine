import styles from "./ScoreBreakdown.module.css";

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
    <div className={styles.container}>
      {ROWS.map(({ label, key }) => {
        const value = breakdown[key];
        const valueClass = value < 0 ? styles.valueNegative : value > 0 ? styles.valuePositive : styles.valueNeutral;
        return (
          <div key={key} className={styles.row}>
            <span>{label}</span>
            <span className={`${styles.value} ${valueClass}`}>
              {value > 0 ? "+" : ""}{value.toFixed(2)}
            </span>
          </div>
        );
      })}
      <div className={styles.totalRow}>
        <span>Total</span>
        <span className={styles.totalValue}>{breakdown.totalScore.toFixed(2)}</span>
      </div>
      {breakdown.reasons.length > 0 && (
        <ul className={styles.reasons}>
          {breakdown.reasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
