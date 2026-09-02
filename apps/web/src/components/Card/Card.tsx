import type { ReactNode } from "react";
import styles from "./Card.module.css";

export interface CardProps {
  /** Omit to use Card purely for its surface/border/radius/shadow chrome,
   *  with children as the entire content - e.g. wrapping a different
   *  component that renders its own title, or a loading skeleton. */
  title?: string;
  kicker?: string;
  meta?: string;
  active?: boolean;
  children?: ReactNode;
}

export function Card({ title, kicker, meta, active = false, children }: CardProps) {
  return (
    <div className={[styles.card, active ? styles.active : ""].filter(Boolean).join(" ")}>
      {kicker && <div className={styles.kicker}>{kicker}</div>}
      {title && <div className={styles.title}>{title}</div>}
      {meta && <div className={styles.meta}>{meta}</div>}
      {children}
    </div>
  );
}
