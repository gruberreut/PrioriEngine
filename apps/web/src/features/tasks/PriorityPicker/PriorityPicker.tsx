import styles from "./PriorityPicker.module.css";

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const OPTIONS = [
  { label: "Urgent", value: 1 },
  { label: "Soon", value: 3 },
  { label: "Medium", value: 6 },
  { label: "Later", value: 8 },
  { label: "Ongoing", value: 10 },
] as const;

export interface PriorityPickerProps {
  value: number;
  onChange: (value: number) => void;
  dueDate?: string;
  onDueDateChange?: (date: string) => void;
  label?: string;
  disabled?: boolean;
}

export function PriorityPicker({
  value,
  onChange,
  dueDate,
  onDueDateChange,
  label,
  disabled = false,
}: PriorityPickerProps) {
  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.group} role="group" aria-label={label ?? "Priority"}>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            aria-pressed={value === option.value}
            className={`${styles.button} ${value === option.value ? styles.selected : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value === 1 && (
        <input
          type="date"
          className={styles.dateInput}
          value={dueDate ?? getTomorrow()}
          onChange={(e) => onDueDateChange?.(e.target.value)}
          disabled={disabled}
          aria-label="Due date"
        />
      )}
    </div>
  );
}
