import { useId } from "react";
import styles from "./Radio.module.css";

export interface RadioProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  /** Shared across a set of Radios to make them a native mutually-exclusive
   *  group - without it, each Radio can only ever go unchecked→checked on
   *  its own, never back. */
  name?: string;
}

export function Radio({ checked, onChange, label, disabled = false, name }: RadioProps) {
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
