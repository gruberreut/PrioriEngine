import { useId, type ReactNode } from "react";
import { Radio } from "../Radio/Radio";
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
  const radioName = useId();
  return (
    <>
      {/* Narrow-width fallback: the pill row below overflows once its options
          don't fit a single line (see SplitGroup.module.css's breakpoint
          comment), so a vertical radio list stands in below that width. */}
      <div className={styles.radioGroup} role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={radioName}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            label={option.label}
            icon={option.icon}
            disabled={disabled}
          />
        ))}
      </div>
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
    </>
  );
}
