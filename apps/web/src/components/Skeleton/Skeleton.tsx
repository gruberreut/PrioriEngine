import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  /** CSS width, e.g. "70%" or "120px". Defaults to filling its container. */
  width?: string;
  /** CSS height, e.g. "0.75rem". Defaults to a single text line's height. */
  height?: string;
}

export function Skeleton({ width, height }: SkeletonProps) {
  return <div className={styles.skeleton} style={{ width, height }} />;
}
