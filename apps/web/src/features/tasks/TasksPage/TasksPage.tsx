import { useEffect, useState } from "react";
import type { Task } from "../../../types/task";
import { getTasks, deleteTask } from "../../../services/taskService";
import { getDescendants } from "../resolveTask";
import { TaskTreeItem } from "../TaskTreeItem/TaskTreeItem";
import { InlineMessage } from "../../../components/InlineMessage/InlineMessage";
import { ConfirmDialog } from "../../../components/ConfirmDialog/ConfirmDialog";
import styles from "./TasksPage.module.css";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; tasks: Task[] };

interface TasksPageProps {
  initialState?: State;
}

const DELETE_CHILDREN_OPTIONS = [
  { label: "Keep subtasks", value: "reparent" as const, variant: "primary" as const },
  { label: "Delete subtasks too", value: "delete" as const, variant: "secondary" as const },
];

export function TasksPage({ initialState }: TasksPageProps) {
  const [state, setState] = useState<State>(initialState ?? { status: "loading" });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);

  function refetch() {
    getTasks()
      .then((tasks) => setState({ status: "loaded", tasks }))
      .catch((err: unknown) => setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" }));
  }

  useEffect(() => {
    if (initialState) return;
    refetch();
  }, [initialState]);

  function removeLocally(ids: string[]) {
    setState((prev) =>
      prev.status === "loaded"
        ? { ...prev, tasks: prev.tasks.filter((t) => !ids.includes(t.id)) }
        : prev
    );
  }

  function reparentLocally(parentId: string) {
    setState((prev) =>
      prev.status === "loaded"
        ? { ...prev, tasks: prev.tasks.map((t) => (t.parentId === parentId ? { ...t, parentId: null } : t)) }
        : prev
    );
  }

  function handleDelete(task: Task) {
    if (task.hasChildren) {
      setPendingDeleteId(task.id);
      return;
    }
    removeLocally([task.id]);
    deleteTask(task.id).catch(() => setDeleteFailed(true));
  }

  function handleDeleteChildrenChoice(childAction: string) {
    const taskId = pendingDeleteId;
    setPendingDeleteId(null);
    if (!taskId) return;

    const action = childAction as "delete" | "reparent";
    if (action === "delete") {
      const tasks = state.status === "loaded" ? state.tasks : [];
      const descendantIds = getDescendants(taskId, tasks).map((t) => t.id);
      removeLocally([taskId, ...descendantIds]);
    } else {
      reparentLocally(taskId);
      removeLocally([taskId]);
    }
    deleteTask(taskId, action).catch(() => setDeleteFailed(true));
  }

  function handleDeleteFailedAck() {
    setDeleteFailed(false);
    refetch();
  }

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
          onDelete={handleDelete}
        />
      ))}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="This task has subtasks"
        description="What should happen to them?"
        options={DELETE_CHILDREN_OPTIONS}
        onSelect={handleDeleteChildrenChoice}
        onCancel={() => setPendingDeleteId(null)}
      />
      <ConfirmDialog
        open={deleteFailed}
        title="Something went wrong"
        description="This task couldn't be deleted. The list will refresh."
        options={[{ label: "OK", value: "ok" }]}
        onSelect={handleDeleteFailedAck}
        onCancel={handleDeleteFailedAck}
      />
    </div>
  );
}
