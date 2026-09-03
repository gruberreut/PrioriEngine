import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Task } from "../../../types/task";
import { InProgressBlock } from "../InProgressBlock/InProgressBlock";
import { getTasksByStatus, updateTask } from "../../../services/taskService";
import { resolveTask } from "../../tasks/resolveTask";
import { InlineMessage } from "../../../components/InlineMessage/InlineMessage";
import styles from "./InProgressPage.module.css";

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
    if (actionId !== "complete" || state.status !== "loaded") return;
    try {
      await updateTask(state.task.id, { status: "completed" });
    } catch {
      return;
    }
    navigate("/", { replace: true });
  }

  return (
    <div className={styles.page}>
      <InProgressBlock task={state.task} onAction={handleAction} />
    </div>
  );
}
