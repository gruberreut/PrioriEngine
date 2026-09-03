import type { ReactNode } from "react";
import styles from "./ActionButton.module.css";

export interface ActionButtonProps {
  icon: ReactNode;
  label?: string;
  color?: string;
  showLabel?: boolean;
  onClick?: () => void;
}

export function ActionButton({ icon, label, color, showLabel = false, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      className={styles.actionButton}
      style={color ? { backgroundColor: color, borderColor: color } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <span className={styles.actionIcon}>{icon}</span>
      {showLabel && label && <span className={styles.actionLabel}>{label}</span>}
    </button>
  );
}
