import { EnergyIcon, type EnergyLevel } from "../EnergyIcon/EnergyIcon";
import { SplitGroup } from "../../../components/SplitGroup/SplitGroup";
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
  const options = LEVELS.map((level) => ({
    value: level,
    label: level,
    icon: <EnergyIcon level={level} size={20} />,
  }));

  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <SplitGroup options={options} value={value} onChange={onChange} label={label ?? "Energy level"} disabled={disabled} />
    </div>
  );
}
