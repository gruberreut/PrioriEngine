import { TextInput } from "../../../components/TextInput/TextInput";
import { SplitGroup } from "../../../components/SplitGroup/SplitGroup";
import styles from "./PriorityPicker.module.css";

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const OPTIONS = [
  { label: "Urgent", value: 1 },
  { label: "Soon", value: 3 },
  { label: "Medium", value: 6 },
  { label: "Later", value: 8 },
  { label: "Ongoing", value: 10 },
] as const;

export interface PriorityPickerProps {
  value: number;
  onChange: (value: number) => void;
  dueDate?: string;
  onDueDateChange?: (date: string) => void;
  label?: string;
  disabled?: boolean;
}

export function PriorityPicker({
  value,
  onChange,
  dueDate,
  onDueDateChange,
  label,
  disabled = false,
}: PriorityPickerProps) {
  const options = OPTIONS.map((option) => ({ value: String(option.value), label: option.label }));

  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <SplitGroup
        options={options}
        value={String(value)}
        onChange={(val) => onChange(Number(val))}
        label={label ?? "Priority"}
        disabled={disabled}
      />
      {value === 1 && (
        <TextInput
          label="Due date"
          hideLabel
          type="date"
          value={dueDate ?? getTomorrow()}
          onChange={(val) => onDueDateChange?.(val)}
          disabled={disabled}
        />
      )}
    </div>
  );
}
