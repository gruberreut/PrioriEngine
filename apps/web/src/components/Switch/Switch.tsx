import { useId } from "react";
import styles from "./Switch.module.css";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  const id = useId();
  return (
    <div className={styles.row}>
      <span className={styles.control}>
        <input
          type="checkbox"
          role="switch"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={styles.input}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.knob} />
        </span>
      </span>
      {label !== undefined && (
        <label
          htmlFor={id}
          className={[styles.label, disabled ? styles.labelDisabled : ""].filter(Boolean).join(" ")}
        >
          {label}
        </label>
      )}
    </div>
  );
}
