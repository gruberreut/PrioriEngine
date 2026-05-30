import styles from "./DurationPicker.module.css";

const OPTIONS = [10, 20, 30, 60] as const;

export interface DurationPickerProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

export function DurationPicker({ value, onChange, label, disabled = false }: DurationPickerProps) {
  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.group} role="group" aria-label={label ?? "Duration"}>
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            disabled={disabled}
            aria-pressed={value === option}
            className={`${styles.button} ${value === option ? styles.selected : ""}`}
          >
            {option} min
          </button>
        ))}
      </div>
    </div>
  );
}
