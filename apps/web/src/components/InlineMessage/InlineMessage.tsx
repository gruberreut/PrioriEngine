import type { ReactNode } from "react";
import styles from "./InlineMessage.module.css";

export type InlineMessageStatus = "success" | "error" | "info";

const dotClass: Record<InlineMessageStatus, string> = {
  success: styles.dotSuccess,
  error: styles.dotError,
  info: styles.dotInfo,
};

export interface InlineMessageProps {
  status: InlineMessageStatus;
  children: ReactNode;
}

export function InlineMessage({ status, children }: InlineMessageProps) {
  return (
    <div className={styles.message} role={status === "error" ? "alert" : "status"}>
      <span className={[styles.dot, dotClass[status]].join(" ")} aria-hidden="true" />
      <span className={styles.text}>{children}</span>
    </div>
  );
}
