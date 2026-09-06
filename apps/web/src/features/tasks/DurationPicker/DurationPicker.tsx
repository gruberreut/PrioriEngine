import { SplitGroup } from "../../../components/SplitGroup/SplitGroup";
import styles from "./DurationPicker.module.css";

const OPTIONS = [10, 20, 30, 60] as const;

export interface DurationPickerProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

export function DurationPicker({ value, onChange, label, disabled = false }: DurationPickerProps) {
  const options = OPTIONS.map((option) => ({
    value: String(option),
    label: "min",
    icon: <span className={styles.number}>{option}</span>,
  }));

  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <SplitGroup
        options={options}
        value={String(value)}
        onChange={(val) => onChange(Number(val))}
        label={label ?? "Duration"}
        disabled={disabled}
      />
    </div>
  );
}
