import { useId } from "react";
import styles from "./Select.module.css";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ options, value, onChange, label, placeholder, disabled = false }: SelectProps) {
  const id = useId();
  return (
    <div className={styles.container}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        disabled={disabled}
        className={styles.select}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
