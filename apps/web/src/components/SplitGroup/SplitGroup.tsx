import type { ReactNode } from "react";
import styles from "./SplitGroup.module.css";

export interface SplitGroupOption<T extends string> {
  label: string;
  value: T;
  /** Rendered above the label (e.g. EnergyPicker's per-level icon). */
  icon?: ReactNode;
}

export interface SplitGroupProps<T extends string> {
  options: SplitGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  disabled?: boolean;
}

export function SplitGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled = false,
}: SplitGroupProps<T>) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          aria-pressed={value === option.value}
          className={[styles.segment, value === option.value ? styles.selected : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {option.icon && <span className={styles.icon}>{option.icon}</span>}
          <span className={styles.label}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
