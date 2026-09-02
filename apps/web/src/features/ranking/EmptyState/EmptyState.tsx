import { Button } from "../../../components/Button/Button";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  context?: string;
  message?: string;
  onBack?: () => void;
}

export function EmptyState({ context, message, onBack }: EmptyStateProps) {
  const text =
    message ??
    (context
      ? `No tasks found for context "${context}".`
      : "No tasks match your current filters.");

  return (
    <div className={styles.container}>
      <p className={styles.message}>{text}</p>
      {onBack && (
        <div className={styles.backButtonWrapper}>
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to parameters
          </Button>
        </div>
      )}
    </div>
  );
}
