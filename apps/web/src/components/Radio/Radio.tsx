import { useId, type ReactNode } from "react";
import styles from "./Radio.module.css";

export interface RadioProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  /** Rendered between the dot and the label (e.g. SplitGroup's per-option icon). */
  icon?: ReactNode;
  disabled?: boolean;
  /** Shared across a set of Radios to make them a native mutually-exclusive
   *  group - without it, each Radio can only ever go unchecked→checked on
   *  its own, never back. */
  name?: string;
}

export function Radio({ checked, onChange, label, icon, disabled = false, name }: RadioProps) {
  const id = useId();
  return (
    <div className={styles.row}>
      <span className={styles.control}>
        <input
          type="radio"
          id={id}
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={styles.input}
        />
        <span className={styles.dot} aria-hidden="true" />
      </span>
      {icon && <span className={styles.icon}>{icon}</span>}
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
