import styles from "./FAB.module.css";

export interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={styles.fab}
      aria-label="Add task"
    >
      +
    </button>
  );
}
