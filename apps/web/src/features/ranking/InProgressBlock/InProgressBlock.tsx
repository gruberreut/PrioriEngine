import { Icon } from "../../../components/Icon/Icon";
import { CheckCircle } from "../../../assets/icons/CheckCircle";
import { Moon } from "../../../assets/icons/Moon";
import { Trash } from "../../../assets/icons/Trash";
import type { Task } from "../../../types/task";
import { TaskCard, type TaskAction } from "../../../entity/TaskCard/TaskCard";
import styles from "./InProgressBlock.module.css";

const ACTIONS: TaskAction[] = [
  { id: "complete", icon: <Icon asset={CheckCircle} label="Complete" size={24} />, label: "Complete", color: "#d1fae5" },
  { id: "snooze", icon: <Icon asset={Moon} label="Snooze" size={24} />, label: "Snooze", color: "#ede9fe" },
  { id: "delete", icon: <Icon asset={Trash} label="Delete" size={24} />, label: "Delete", color: "#fee2e2" },
];

export interface InProgressBlockProps {
  task: Task;
  onAction?: (actionId: string) => void;
}

export function InProgressBlock({ task, onAction }: InProgressBlockProps) {
  return (
    <div className={styles.container}>
      <TaskCard task={{ ...task, status: "in_progress" }} flavor="flat" actions={ACTIONS} onAction={onAction} />
      <div className={styles.prompt}>
        Finish this task or mark it complete to get new suggestions.
      </div>
    </div>
  );
}
