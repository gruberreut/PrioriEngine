import styles from "./ListRow.module.css";

export interface ListRowProps {
  title: string;
  meta?: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function ListRow({ title, meta, selected = false, onClick, disabled = false }: ListRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={[styles.row, selected ? styles.selected : ""].filter(Boolean).join(" ")}
    >
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.title}>{title}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </span>
    </button>
  );
}
