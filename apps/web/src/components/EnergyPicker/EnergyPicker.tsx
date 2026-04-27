import { EnergyIcon, type EnergyLevel } from "../EnergyIcon/EnergyIcon";
import styles from "./EnergyPicker.module.css";

export type { EnergyLevel };

const LEVELS: EnergyLevel[] = ["low", "medium", "high"];

export interface EnergyPickerProps {
  value: EnergyLevel;
  onChange: (value: EnergyLevel) => void;
  label?: string;
  disabled?: boolean;
}

export function EnergyPicker({ value, onChange, label, disabled = false }: EnergyPickerProps) {
  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.group} role="group" aria-label={label ?? "Energy level"}>
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            disabled={disabled}
            aria-pressed={value === level}
            className={`${styles.button} ${value === level ? styles.selected : ""}`}
          >
            <EnergyIcon level={level} size={20} />
            <span className={styles.levelLabel}>{level}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
