import type { ReactNode } from "react";
import styles from "./Chip.module.css";

export interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

export function Chip({ label, selected, onClick, disabled = false, icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={[styles.chip, selected ? styles.selected : ""].filter(Boolean).join(" ")}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
    </button>
  );
}
