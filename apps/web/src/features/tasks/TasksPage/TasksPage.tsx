import { useEffect, useState } from "react";
import type { Task } from "../../../types/task";
import { getTasks } from "../../../services/taskService";
import { TaskTreeItem } from "../TaskTreeItem/TaskTreeItem";
import { InlineMessage } from "../../../components/InlineMessage/InlineMessage";
import styles from "./TasksPage.module.css";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; tasks: Task[] };

interface TasksPageProps {
  initialState?: State;
}

export function TasksPage({ initialState }: TasksPageProps) {
  const [state, setState] = useState<State>(initialState ?? { status: "loading" });

  useEffect(() => {
    if (initialState) return;
    getTasks()
      .then((tasks) => setState({ status: "loaded", tasks }))
      .catch((err: unknown) => setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" }));
  }, [initialState]);

  if (state.status === "loading") {
    return (
      <div className={styles.page}>
        <p className={styles.message}>Loading tasks…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={styles.page}>
        <InlineMessage status="error">Could not load tasks: {state.message}</InlineMessage>
      </div>
    );
  }

  const rootTasks = state.tasks.filter((t) => !t.parentId);

  return (
    <div className={styles.page}>
      {rootTasks.map((task) => (
        <TaskTreeItem
          key={task.id}
          task={task}
          ancestors={[]}
          depth={0}
          allTasks={state.tasks}
        />
      ))}
    </div>
  );
}
