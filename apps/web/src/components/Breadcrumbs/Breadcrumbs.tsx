import styles from "./Breadcrumbs.module.css";

export interface BreadcrumbsProps {
  ancestors: { id: string; title: string }[];
}

export function Breadcrumbs({ ancestors }: BreadcrumbsProps) {
  return (
    <div className={styles.breadcrumbs}>
      {ancestors.map((ancestor, index) => (
        <span key={ancestor.id}>
          {index > 0 && <span className={styles.separator}>›</span>}
          <span className={styles.crumb}>{ancestor.title}</span>
        </span>
      ))}
    </div>
  );
}
