import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  context?: string;
}

export function EmptyState({ context }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <p className={styles.message}>
        {context
          ? `No tasks found for context "${context}".`
          : "No tasks match your current filters."}
      </p>
    </div>
  );
}
