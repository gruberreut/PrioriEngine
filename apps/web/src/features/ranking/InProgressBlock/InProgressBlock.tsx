import { TaskCard, type TaskData } from "../TaskCard/TaskCard";
import styles from "./InProgressBlock.module.css";

export interface InProgressBlockProps {
  task: TaskData;
}

export function InProgressBlock({ task }: InProgressBlockProps) {
  return (
    <div className={styles.container}>
      <div className={styles.label}>In progress</div>
      <TaskCard task={task} flavor="flat" />
      <div className={styles.prompt}>
        Finish this task or mark it complete to get new suggestions.
      </div>
    </div>
  );
}
