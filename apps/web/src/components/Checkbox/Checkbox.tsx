import { useId } from "react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled = false }: CheckboxProps) {
  const id = useId();
  return (
    <div className={styles.container}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={styles.input}
      />
      {label !== undefined && (
        <label
          htmlFor={id}
          className={disabled ? styles.labelDisabled : styles.label}
        >
          {label}
        </label>
      )}
    </div>
  );
}
