import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Task } from "../../../types/task";
import { InProgressBlock } from "../InProgressBlock/InProgressBlock";
import { getTasksByStatus, updateTask, snoozeTask, deleteTask } from "../../../services/taskService";
import { resolveTask } from "../../tasks/resolveTask";
import { InlineMessage } from "../../../components/InlineMessage/InlineMessage";
import { ConfirmDialog } from "../../../components/ConfirmDialog/ConfirmDialog";
import styles from "./InProgressPage.module.css";

const DELETE_CHILDREN_OPTIONS = [
  { label: "Keep subtasks", value: "reparent" as const, variant: "primary" as const },
  { label: "Delete subtasks too", value: "delete" as const, variant: "secondary" as const },
];

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; task: Task };

interface InProgressPageProps {
  initialState?: State;
}

export function InProgressPage({ initialState }: InProgressPageProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<State>(initialState ?? { status: "loading" });
  const [pendingDelete, setPendingDelete] = useState(false);

  useEffect(() => {
    if (initialState) return;
    getTasksByStatus("in_progress")
      .then(([task]) => {
        if (!task) {
          navigate("/", { replace: true });
          return;
        }
        const cardTask: Task = { ...task, ...resolveTask(task, []) };
        setState({ status: "loaded", task: cardTask });
      })
      .catch((err: unknown) =>
        setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" })
      );
  }, [initialState, navigate]);

  async function refreshTask() {
    try {
      const [task] = await getTasksByStatus("in_progress");
      if (!task) {
        navigate("/", { replace: true });
        return;
      }
      const cardTask: Task = { ...task, ...resolveTask(task, []) };
      setState({ status: "loaded", task: cardTask });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  if (state.status === "loading") {
    return (
      <div className={styles.page}>
        <p className={styles.message}>Loading…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={styles.page}>
        <InlineMessage status="error">{state.message}</InlineMessage>
      </div>
    );
  }

  async function handleAction(actionId: string) {
    if (state.status !== "loaded") return;
    const task = state.task;

    if (actionId === "complete") {
      try {
        await updateTask(task.id, { status: "completed" });
      } catch {
        return;
      }
      navigate("/", { replace: true });
      return;
    }

    if (actionId === "snooze") {
      try {
        await snoozeTask(task.id);
      } catch {
        return;
      }
      await refreshTask();
      return;
    }

    if (actionId === "delete") {
      if (task.hasChildren) {
        setPendingDelete(true);
        return;
      }
      try {
        await deleteTask(task.id);
      } catch {
        return;
      }
      navigate("/", { replace: true });
    }
  }

  async function handleDeleteChildrenChoice(childAction: string) {
    setPendingDelete(false);
    if (state.status !== "loaded") return;
    try {
      await deleteTask(state.task.id, childAction as "delete" | "reparent");
    } catch {
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <div className={styles.page}>
      <InProgressBlock task={state.task} onAction={handleAction} />
      <ConfirmDialog
        open={pendingDelete}
        title="This task has subtasks"
        description="What should happen to them?"
        options={DELETE_CHILDREN_OPTIONS}
        onSelect={handleDeleteChildrenChoice}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  );
}
